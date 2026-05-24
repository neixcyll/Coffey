<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\SellerProfile;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SellerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sellers = SellerProfile::query()
            ->with('user.role')
            ->withCount('products')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('store_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $sellers->getCollection()->transform(fn (SellerProfile $seller) => $this->sellerPayload($seller));

        return response()->json($sellers);
    }

    public function show(SellerProfile $seller): JsonResponse
    {
        $seller->load(['user.role', 'products.category', 'products.images']);

        return response()->json([
            'data' => $this->sellerPayload($seller) + [
                'products' => $seller->products,
            ],
        ]);
    }

    public function updateStatus(Request $request, SellerProfile $seller): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'active', 'rejected', 'suspended'])],
        ]);

        $seller->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Status seller berhasil diperbarui.',
            'data' => $this->sellerPayload($seller->fresh(['user.role'])),
        ]);
    }

    public function approve(SellerProfile $seller): JsonResponse
    {
        return $this->setStatus($seller, 'active');
    }

    public function reject(SellerProfile $seller): JsonResponse
    {
        return $this->setStatus($seller, 'rejected');
    }

    public function suspend(SellerProfile $seller): JsonResponse
    {
        return $this->setStatus($seller, 'suspended');
    }

    private function setStatus(SellerProfile $seller, string $status): JsonResponse
    {
        $seller->update(['status' => $status]);

        return response()->json([
            'message' => "Seller berhasil {$status}.",
            'data' => $this->sellerPayload($seller->fresh(['user.role'])),
        ]);
    }

    private function sellerPayload(SellerProfile $seller): array
    {
        $paidStatuses = PaymentStatusService::PAID_ORDER_STATUSES;

        return [
            'id' => $seller->id,
            'user_id' => $seller->user_id,
            'store_name' => $seller->store_name,
            'slug' => $seller->slug,
            'phone' => $seller->phone,
            'address' => $seller->address,
            'description' => $seller->description,
            'status' => $seller->status,
            'created_at' => $seller->created_at,
            'updated_at' => $seller->updated_at,
            'user' => $seller->user,
            'products_count' => $seller->products_count ?? $seller->products()->count(),
            'total_orders' => $seller->orderItems()->distinct('order_id')->count('order_id'),
            'total_revenue' => (float) OrderItem::query()
                ->where('seller_id', $seller->id)
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->whereIn('orders.status', $paidStatuses)
                ->sum('order_items.subtotal'),
        ];
    }
}
