<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $seller = $this->seller($request);

        $orders = Order::query()
            ->whereHas('items', fn ($query) => $query->where('seller_id', $seller->id))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->with(['items' => fn ($query) => $query->where('seller_id', $seller->id)->with('product')])
            ->with('payment')
            ->latest()
            ->paginate($request->integer('per_page', 10));

        $orders->getCollection()->transform(fn (Order $order) => $this->sellerOrderPayload($order));

        return response()->json($orders);
    }

    public function notifications(Request $request): JsonResponse
    {
        $seller = $this->seller($request);
        $paidStatuses = PaymentStatusService::PAID_ORDER_STATUSES;

        $base = Order::query()
            ->where(function ($query) use ($paidStatuses) {
                $query->whereIn('status', $paidStatuses)
                    ->orWhereHas('payment', fn ($payment) => $payment->where('status', 'paid'));
            })
            ->whereHas('items', function ($query) use ($seller) {
                $query->where('seller_id', $seller->id)
                    ->where('status', 'pending');
            });

        $orders = (clone $base)
            ->with(['items' => function ($query) use ($seller) {
                $query->where('seller_id', $seller->id)
                    ->where('status', 'pending')
                    ->with('product');
            }])
            ->with('payment')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Order $order) => $this->sellerOrderPayload($order))
            ->values();

        return response()->json([
            'data' => [
                'count' => (clone $base)->count(),
                'orders' => $orders,
            ],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $seller = $this->seller($request);

        abort_if(! $order->items()->where('seller_id', $seller->id)->exists(), 404);

        $order->load([
            'items' => fn ($query) => $query->where('seller_id', $seller->id)->with('product'),
            'payment',
        ]);

        return response()->json([
            'data' => $this->sellerOrderPayload($order),
        ]);
    }

    public function updateOrderStatus(Request $request, Order $order, PaymentStatusService $payments): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->validate([
            'status' => ['required', 'in:processing,shipped,completed'],
        ]);

        $order = $this->refreshPaymentStatus($order, $payments);

        abort_if(! in_array($order->status, ['paid', 'processing', 'shipped', 'completed'], true), 422, 'Order belum dibayar.');

        $updated = $order->items()
            ->where('seller_id', $seller->id)
            ->update(['status' => $data['status']]);

        abort_if($updated === 0, 404);

        $this->syncOrderStatus($order);

        return $this->show($request, $order->fresh());
    }

    public function updateItemStatus(Request $request, Order $order, OrderItem $orderItem, PaymentStatusService $payments): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->validate([
            'status' => ['required', 'in:processing,shipped,completed'],
        ]);

        abort_if($orderItem->order_id !== $order->id || $orderItem->seller_id !== $seller->id, 404);
        $order = $this->refreshPaymentStatus($order, $payments);
        abort_if(! in_array($order->status, ['paid', 'processing', 'shipped', 'completed'], true), 422, 'Order belum dibayar.');

        $orderItem->update(['status' => $data['status']]);
        $this->syncOrderStatus($order);

        return $this->show($request, $order->fresh());
    }

    private function seller(Request $request)
    {
        $seller = $request->user()->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');
        abort_if($seller->status !== 'active', 403, 'Seller belum aktif.');

        return $seller;
    }

    private function sellerOrderPayload(Order $order): array
    {
        $order->loadMissing('payment');
        $status = $order->status === 'pending' && $order->payment?->status === 'paid'
            ? 'paid'
            : $order->status;

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $status,
            'payment_status' => $order->payment?->status,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'shipping_address' => $order->shipping_address,
            'notes' => $order->notes,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'seller_total' => (float) $order->items->sum('subtotal'),
            'items' => $order->items,
        ];
    }

    private function syncOrderStatus(Order $order): void
    {
        $statuses = $order->items()->pluck('status');

        if ($statuses->every(fn ($status) => $status === 'completed')) {
            $order->update(['status' => 'completed']);
        } elseif ($statuses->every(fn ($status) => in_array($status, ['shipped', 'completed'], true))) {
            $order->update(['status' => 'shipped']);
        } elseif ($statuses->contains(fn ($status) => in_array($status, ['processing', 'shipped', 'completed'], true))) {
            $order->update(['status' => 'processing']);
        } elseif ($order->status !== 'paid') {
            $order->update(['status' => 'paid']);
        }
    }

    private function refreshPaymentStatus(Order $order, PaymentStatusService $payments): Order
    {
        $order->loadMissing('payment');

        if ($order->status !== 'pending' || ! $order->payment || $order->payment->status === 'paid') {
            if ($order->status === 'pending' && $order->payment?->status === 'paid') {
                $order->update(['status' => 'paid']);
            }

            return $order->fresh();
        }

        try {
            $payments->syncFromGateway($order->payment);
        } catch (Throwable $exception) {
            report($exception);
        }

        return $order->fresh();
    }
}
