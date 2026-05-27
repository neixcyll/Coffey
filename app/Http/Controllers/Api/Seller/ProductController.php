<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $seller = $this->seller($request);

        $products = Product::query()
            ->with(['category', 'images', 'variants', 'brewingMethods'])
            ->withAvg(['reviews as avg_rating' => fn ($query) => $query->where('status', 'published')], 'rating')
            ->withCount(['reviews as reviews_count' => fn ($query) => $query->where('status', 'published')])
            ->where('seller_id', $seller->id)
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->safe()->except(['image', 'images', 'variants', 'brewing_methods']);
        $data['seller_id'] = $seller->id;
        $data['slug'] = $this->uniqueProductSlug($data['name']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = DB::transaction(function () use ($request, $data) {
            $product = Product::create($data);
            $this->syncBrewingMethods($product, $request->input('brewing_methods', []));
            $this->syncVariants($product, $request->input('variants', []));
            $this->storeImages($request, $product);

            return $product;
        });

        return response()->json([
            'message' => 'Produk berhasil dibuat.',
            'data' => $product->fresh()->load(['category', 'images', 'variants', 'brewingMethods']),
        ], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeSellerProduct($request, $product);

        return response()->json([
            'data' => $product->load(['category', 'images', 'variants', 'brewingMethods']),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorizeSellerProduct($request, $product);

        $data = $request->safe()->except(['image', 'images', 'variants', 'brewing_methods']);

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueProductSlug($data['name'], $product);
        }

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        DB::transaction(function () use ($request, $product, $data) {
            $product->update($data);

            if ($request->has('brewing_methods') || $request->has('brewing_methods_present')) {
                $this->syncBrewingMethods($product, $request->input('brewing_methods', []));
            }

            if ($request->has('variants')) {
                $this->syncVariants($product, $request->input('variants', []));
            }

            $this->storeImages($request, $product);
        });

        return response()->json([
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->fresh()->load(['category', 'images', 'variants', 'brewingMethods']),
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorizeSellerProduct($request, $product);

        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }

    private function seller(Request $request)
    {
        $seller = $request->user()->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');
        abort_if($seller->status !== 'active', 403, 'Seller belum aktif.');

        return $seller;
    }

    private function authorizeSellerProduct(Request $request, Product $product): void
    {
        $seller = $this->seller($request);

        abort_if($product->seller_id !== $seller->id, 404);
    }

    private function uniqueProductSlug(string $name, ?Product $ignore = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (Product::where('slug', $slug)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function storeImages(Request $request, Product $product): void
    {
        $paths = [];

        if ($request->hasFile('image')) {
            $paths[] = $product->image;
        }

        foreach ($request->file('images', []) as $image) {
            $paths[] = $image->store('products', 'public');
        }

        if ($paths === []) {
            return;
        }

        $product->images()->update(['is_primary' => false]);

        foreach ($paths as $index => $path) {
            $product->images()->create([
                'path' => $path,
                'is_primary' => $index === 0,
                'sort_order' => $index,
            ]);
        }

        if (! $product->image) {
            $product->update(['image' => $paths[0]]);
        }
    }

    private function syncBrewingMethods(Product $product, array $methodIds): void
    {
        $product->brewingMethods()->sync(
            collect($methodIds)
                ->map(fn ($id) => (int) $id)
                ->filter()
                ->unique()
                ->values()
                ->all(),
        );
    }

    private function syncVariants(Product $product, array $variants): void
    {
        $keptVariantIds = [];

        foreach (array_values($variants) as $index => $variant) {
            $payload = [
                'weight_grams' => (int) $variant['weight_grams'],
                'grind_size' => trim((string) $variant['grind_size']),
                'price' => $variant['price'],
                'stock' => (int) $variant['stock'],
                'sku' => $variant['sku'] ?? null,
                'sort_order' => $index,
            ];

            $existing = ! empty($variant['id'])
                ? $product->variants()->whereKey((int) $variant['id'])->first()
                : null;

            if ($existing) {
                $existing->update($payload);
                $keptVariantIds[] = $existing->id;

                continue;
            }

            $created = $product->variants()->create($payload);
            $keptVariantIds[] = $created->id;
        }

        $product->variants()
            ->when($keptVariantIds !== [], fn ($query) => $query->whereKeyNot($keptVariantIds))
            ->delete();
    }
}
