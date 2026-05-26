<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $seller = $this->seller($request);

        $reviews = ProductReview::query()
            ->where('seller_id', $seller->id)
            ->with([
                'product:id,name,slug,image',
                'user:id,name',
                'order:id,order_number',
            ])
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($reviews);
    }

    public function reply(Request $request, ProductReview $review): JsonResponse
    {
        $seller = $this->seller($request);

        abort_if($review->seller_id !== $seller->id, 404);

        $data = $request->validate([
            'seller_reply' => ['required', 'string', 'min:2'],
        ]);

        $review->update([
            'seller_reply' => $data['seller_reply'],
            'seller_replied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Balasan seller berhasil disimpan.',
            'data' => $review->fresh()->load([
                'product:id,name,slug,image',
                'user:id,name',
                'order:id,order_number',
            ]),
        ]);
    }

    private function seller(Request $request)
    {
        $user = $request->user()->loadMissing(['role', 'sellerProfile']);

        abort_unless($user->hasRole('seller'), 403, 'Login sebagai seller untuk mengelola review.');

        $seller = $user->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');
        abort_if($seller->status !== 'active', 403, 'Seller belum aktif.');

        return $seller;
    }
}
