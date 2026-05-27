<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrewingMethod;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()->orderBy('name')->get(),
        ]);
    }

    public function brewingMethods(): JsonResponse
    {
        return response()->json([
            'data' => BrewingMethod::query()->orderBy('name')->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category', 'seller:id,store_name,slug,status', 'images', 'variants', 'brewingMethods'])
            ->withAvg(['reviews as avg_rating' => fn ($query) => $query->where('status', 'published')], 'rating')
            ->withCount(['reviews as reviews_count' => fn ($query) => $query->where('status', 'published')])
            ->whereHas('seller', fn ($query) => $query->where('status', 'active'))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('origin', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category_id'), fn ($query) => $query->where('category_id', $request->integer('category_id')))
            ->when($request->filled('category'), function ($query) use ($request) {
                $category = $request->string('category')->toString();
                $query->whereHas('category', fn ($query) => $query->where('slug', $category));
            })
            ->when($request->filled('roast_level'), fn ($query) => $query->where('roast_level', $request->string('roast_level')->toString()))
            ->when($request->filled('origin'), fn ($query) => $query->where('origin', 'like', '%'.$request->string('origin')->toString().'%'))
            ->latest()
            ->paginate($request->integer('per_page', 12))
            ->withQueryString();

        return response()->json($products);
    }

    public function show(string $product): JsonResponse
    {
        $product = Product::query()
            ->with(['category', 'seller:id,store_name,slug,status,description', 'images', 'variants', 'brewingMethods'])
            ->withAvg(['reviews as avg_rating' => fn ($query) => $query->where('status', 'published')], 'rating')
            ->withCount(['reviews as reviews_count' => fn ($query) => $query->where('status', 'published')])
            ->where(function ($query) use ($product) {
                $query->where('slug', $product);

                if (ctype_digit($product)) {
                    $query->orWhereKey((int) $product);
                }
            })
            ->firstOrFail();

        abort_if($product->seller?->status !== 'active', 404);

        return response()->json([
            'data' => $product,
        ]);
    }
}
