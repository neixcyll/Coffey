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
        Schema::create('brewing_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('product_brewing_method', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brewing_method_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'brewing_method_id']);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('weight_grams');
            $table->string('grind_size', 100);
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('stock');
            $table->string('sku')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'weight_grams', 'grind_size']);
            $table->index(['product_id', 'stock']);
        });

        $now = now();
        $methods = collect([
            'V60',
            'French Press',
            'Espresso',
            'Tubruk',
            'Aeropress',
            'Moka Pot',
            'Drip Bag',
            'Cold Brew',
        ])->map(fn (string $name) => [
            'name' => $name,
            'slug' => Str::slug($name),
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('brewing_methods')->insert($methods);
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_brewing_method');
        Schema::dropIfExists('brewing_methods');
    }
};
