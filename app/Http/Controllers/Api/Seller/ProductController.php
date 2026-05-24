<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $seller = $this->seller($request);

        $products = Product::query()
            ->with(['category', 'images'])
            ->where('seller_id', $seller->id)
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->safe()->except(['image', 'images']);
        $data['seller_id'] = $seller->id;
        $data['slug'] = $this->uniqueProductSlug($data['name']);
        $data['status'] = $data['status'] ?? 'active';

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);
        $this->storeImages($request, $product);

        return response()->json([
            'message' => 'Produk berhasil dibuat.',
            'data' => $product->load(['category', 'images']),
        ], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeSellerProduct($request, $product);

        return response()->json([
            'data' => $product->load(['category', 'images']),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorizeSellerProduct($request, $product);

        $data = $request->safe()->except(['image', 'images']);

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueProductSlug($data['name'], $product);
        }

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);
        $this->storeImages($request, $product);

        return response()->json([
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->fresh()->load(['category', 'images']),
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
}
