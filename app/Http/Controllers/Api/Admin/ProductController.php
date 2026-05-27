<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category', 'seller.user', 'images', 'variants', 'brewingMethods'])
            ->when($request->filled('seller_id'), fn ($query) => $query->where('seller_id', $request->integer('seller_id')))
            ->when($request->filled('category_id'), fn ($query) => $query->where('category_id', $request->integer('category_id')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('origin', 'like', "%{$search}%")
                        ->orWhereHas('seller', fn ($query) => $query->where('store_name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $product->load(['category', 'seller.user', 'images', 'variants', 'brewingMethods', 'orderItems.order']),
        ]);
    }
}
