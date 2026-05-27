<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $this->seedBrewingMethods();
        $this->backfillProductOptions();
        $this->upgradeCartItems();
        $this->upgradeOrderItems();
        $this->dropLegacyProductColumns();
        $this->addProductNameUniqueness();
    }

    public function down(): void
    {
        //
    }

    private function seedBrewingMethods(): void
    {
        if (! Schema::hasTable('brewing_methods')) {
            return;
        }

        foreach (['V60', 'French Press', 'Espresso', 'Tubruk', 'Aeropress', 'Moka Pot', 'Drip Bag', 'Cold Brew'] as $name) {
            DB::table('brewing_methods')->updateOrInsert(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'updated_at' => now(), 'created_at' => now()],
            );
        }
    }

    private function backfillProductOptions(): void
    {
        if (! Schema::hasTable('products') || ! Schema::hasTable('product_variants')) {
            return;
        }

        $columns = ['id'];
        foreach (['price', 'stock', 'weight', 'brewing_method'] as $column) {
            if (Schema::hasColumn('products', $column)) {
                $columns[] = $column;
            }
        }

        DB::table('products')
            ->select($columns)
            ->orderBy('id')
            ->get()
            ->each(function (object $product) {
                if (! DB::table('product_variants')->where('product_id', $product->id)->exists() && isset($product->price)) {
                    DB::table('product_variants')->insert([
                        'product_id' => $product->id,
                        'weight_grams' => (int) ($product->weight ?? 250),
                        'grind_size' => 'Medium',
                        'price' => (float) ($product->price ?? 0),
                        'stock' => (int) ($product->stock ?? 0),
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                if (isset($product->brewing_method)) {
                    $methodIds = collect(explode(',', (string) $product->brewing_method))
                        ->map(fn (string $name) => trim($name))
                        ->filter()
                        ->map(fn (string $name) => $this->brewingMethodId($name))
                        ->filter()
                        ->unique()
                        ->values();

                    foreach ($methodIds as $methodId) {
                        DB::table('product_brewing_method')->updateOrInsert(
                            ['product_id' => $product->id, 'brewing_method_id' => $methodId],
                            ['created_at' => now(), 'updated_at' => now()],
                        );
                    }
                }
            });
    }

    private function upgradeCartItems(): void
    {
        if (! Schema::hasTable('cart_items')) {
            return;
        }

        $addedVariantColumn = ! Schema::hasColumn('cart_items', 'product_variant_id');

        if ($addedVariantColumn) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained()->cascadeOnDelete();
            });
        }

        DB::table('cart_items')
            ->whereNull('product_variant_id')
            ->orderBy('id')
            ->get(['id', 'product_id'])
            ->each(function (object $item) {
                $variantId = DB::table('product_variants')
                    ->where('product_id', $item->product_id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->value('id');

                if ($variantId) {
                    DB::table('cart_items')->where('id', $item->id)->update(['product_variant_id' => $variantId]);
                }
            });

        if ($addedVariantColumn) {
            $this->trySchemaChange(fn () => Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique('cart_items_cart_id_product_id_unique');
            }));

            $this->trySchemaChange(fn () => Schema::table('cart_items', function (Blueprint $table) {
                $table->unique(['cart_id', 'product_id', 'product_variant_id'], 'cart_items_cart_product_variant_unique');
            }));
        }
    }

    private function upgradeOrderItems(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'product_variant_id')) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('order_items', 'variant_label')) {
                $table->string('variant_label')->nullable()->after('product_name');
            }

            if (! Schema::hasColumn('order_items', 'weight_grams')) {
                $table->unsignedInteger('weight_grams')->nullable()->after('variant_label');
            }

            if (! Schema::hasColumn('order_items', 'grind_size')) {
                $table->string('grind_size', 100)->nullable()->after('weight_grams');
            }
        });

        DB::table('order_items')
            ->whereNull('product_variant_id')
            ->orderBy('id')
            ->get(['id', 'product_id'])
            ->each(function (object $item) {
                $variantId = DB::table('product_variants')
                    ->where('product_id', $item->product_id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->value('id');

                if ($variantId) {
                    DB::table('order_items')->where('id', $item->id)->update(['product_variant_id' => $variantId]);
                }
            });

        DB::table('order_items')
            ->whereNotNull('product_variant_id')
            ->orderBy('id')
            ->get(['id', 'product_variant_id', 'variant_label'])
            ->each(function (object $item) {
                if ($item->variant_label) {
                    return;
                }

                $variant = DB::table('product_variants')->where('id', $item->product_variant_id)->first();

                if (! $variant) {
                    return;
                }

                DB::table('order_items')->where('id', $item->id)->update([
                    'variant_label' => $this->variantLabel((int) $variant->weight_grams, (string) $variant->grind_size),
                    'weight_grams' => $variant->weight_grams,
                    'grind_size' => $variant->grind_size,
                ]);
            });
    }

    private function dropLegacyProductColumns(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        $this->trySchemaChange(fn () => Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_id_status_index');
        }));

        $this->trySchemaChange(fn () => Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_seller_id_status_index');
        }));

        $this->trySchemaChange(fn () => Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_status_index');
        }));

        $columns = collect(['price', 'stock', 'weight', 'brewing_method', 'status'])
            ->filter(fn (string $column) => Schema::hasColumn('products', $column))
            ->values()
            ->all();

        if ($columns !== []) {
            Schema::table('products', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }

    private function addProductNameUniqueness(): void
    {
        if (! Schema::hasTable('products') || $this->hasDuplicateProductNames()) {
            return;
        }

        $this->trySchemaChange(fn () => Schema::table('products', function (Blueprint $table) {
            $table->unique(['seller_id', 'name'], 'products_seller_id_name_unique');
        }));
    }

    private function brewingMethodId(string $name): ?int
    {
        if (! Schema::hasTable('brewing_methods')) {
            return null;
        }

        $slug = Str::slug($name);

        DB::table('brewing_methods')->updateOrInsert(
            ['slug' => $slug],
            ['name' => $name, 'updated_at' => now(), 'created_at' => now()],
        );

        return DB::table('brewing_methods')->where('slug', $slug)->value('id');
    }

    private function hasDuplicateProductNames(): bool
    {
        return DB::table('products')
            ->select('seller_id', 'name')
            ->groupBy('seller_id', 'name')
            ->havingRaw('COUNT(*) > 1')
            ->exists();
    }

    private function variantLabel(int $grams, string $grindSize): string
    {
        $weight = $grams >= 1000 && $grams % 1000 === 0
            ? ($grams / 1000).'kg'
            : $grams.'gr';

        return "{$weight} / {$grindSize}";
    }

    private function trySchemaChange(callable $callback): void
    {
        try {
            $callback();
        } catch (Throwable) {
            //
        }
    }
};
