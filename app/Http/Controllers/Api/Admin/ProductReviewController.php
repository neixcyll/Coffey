<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = ProductReview::query()
            ->with(['product:id,name,slug', 'user:id,name', 'seller:id,store_name,slug', 'order:id,order_number'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($reviews);
    }

    public function approve(ProductReview $review): JsonResponse
    {
        $review->update(['status' => 'published']);

        return response()->json([
            'message' => 'Review dipublish.',
            'data' => $review->fresh(['product:id,name,slug', 'user:id,name', 'seller:id,store_name,slug']),
        ]);
    }

    public function reject(Request $request, ProductReview $review): JsonResponse
    {
        $review->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Review ditolak.',
            'data' => $review->fresh(['product:id,name,slug', 'user:id,name', 'seller:id,store_name,slug']),
        ]);
    }
}
