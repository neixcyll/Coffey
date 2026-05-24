<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('role');

        $orders = Order::query()
            ->with(['affiliateProfile:id,code', 'items.product', 'items.seller:id,store_name,slug', 'payment'])
            ->when(! $user->isAdmin(), fn ($query) => $query->where('user_id', $user->id))
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user()->loadMissing('role');

        abort_if(! $user->isAdmin() && $order->user_id !== $user->id, 404);

        return response()->json([
            'data' => $order->load(['affiliateProfile:id,code', 'items.product', 'items.seller:id,store_name,slug', 'payment']),
        ]);
    }

    public function syncPayment(Request $request, Order $order, PaymentStatusService $payments): JsonResponse
    {
        abort_if($order->user_id !== $request->user()->id, 404);

        $order->loadMissing('payment');

        abort_if(! $order->payment, 404, 'Payment tidak ditemukan.');

        $snapResult = $request->input('snap_result');

        try {
            $payments->syncFromGateway($order->payment, is_array($snapResult) ? $snapResult : null);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Gagal sinkronisasi status pembayaran ke Midtrans.',
                'error' => $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'message' => 'Status pembayaran disinkronkan.',
            'data' => $order->fresh()->load(['affiliateProfile:id,code', 'items.product', 'items.seller:id,store_name,slug', 'payment']),
        ]);
    }
}
