<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['user.role', 'affiliateProfile.user', 'items.product', 'items.seller.user', 'payment'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('seller_id'), function ($query) use ($request) {
                $query->whereHas('items', fn ($query) => $query->where('seller_id', $request->integer('seller_id')));
            })
            ->when($request->filled('customer_id'), fn ($query) => $query->where('user_id', $request->integer('customer_id')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => $order->load(['user.role', 'affiliateProfile.user', 'affiliateCommissions', 'items.product', 'items.seller.user', 'payment']),
        ]);
    }
}
