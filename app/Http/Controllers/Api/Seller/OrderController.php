<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\PaymentStatusService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderController extends Controller
{
    private const STATUS_ORDER = [
        'pending' => 1,
        'processing' => 2,
        'shipped' => 3,
        'completed' => 4,
    ];

    private const NEXT_STATUS = [
        'pending' => 'processing',
        'processing' => 'shipped',
        'shipped' => 'completed',
    ];

    public function index(Request $request): JsonResponse
    {
        $seller = $this->seller($request);

        $orders = Order::query()
            ->whereHas('items', fn ($query) => $query->where('seller_id', $seller->id))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->with(['items' => fn ($query) => $query->where('seller_id', $seller->id)->with(['product.brewingMethods', 'productVariant'])])
            ->with('payment')
            ->latest()
            ->paginate($request->integer('per_page', 10));

        $orders->getCollection()->transform(fn (Order $order) => $this->sellerOrderPayload($order, $seller));

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
                    ->with(['product.brewingMethods', 'productVariant']);
            }])
            ->with('payment')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Order $order) => $this->sellerOrderPayload($order, $seller))
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
            'items' => fn ($query) => $query->where('seller_id', $seller->id)->with(['product.brewingMethods', 'productVariant']),
            'payment',
        ]);

        return response()->json([
            'data' => $this->sellerOrderPayload($order, $seller),
        ]);
    }

    public function updateOrderStatus(Request $request, Order $order, PaymentStatusService $payments): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->validate([
            'status' => ['required', 'in:processing,shipped,completed'],
        ]);

        $order = $this->refreshPaymentStatus($order, $payments);

        $updatedOrder = DB::transaction(function () use ($order, $seller, $data) {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $previousOrderStatus = $lockedOrder->status;

            abort_if(! in_array($lockedOrder->status, ['paid', 'processing', 'shipped', 'completed'], true), 422, 'Order belum dibayar.');

            $items = $lockedOrder->items()
                ->where('seller_id', $seller->id)
                ->lockForUpdate()
                ->get();

            abort_if($items->isEmpty(), 404);

            $this->assertSellerItemsCanTransition($items, $data['status']);

            $items->each->update(['status' => $data['status']]);
            $this->syncOrderStatus($lockedOrder);

            $freshOrder = $lockedOrder->fresh();
            $this->createOrderStatusNotification($freshOrder, $previousOrderStatus);

            return $freshOrder;
        });

        return $this->show($request, $updatedOrder);
    }

    public function updateItemStatus(Request $request, Order $order, OrderItem $orderItem, PaymentStatusService $payments): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->validate([
            'status' => ['required', 'in:processing,shipped,completed'],
        ]);

        abort_if($orderItem->order_id !== $order->id || $orderItem->seller_id !== $seller->id, 404);
        $order = $this->refreshPaymentStatus($order, $payments);

        $updatedOrder = DB::transaction(function () use ($order, $orderItem, $data) {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $previousOrderStatus = $lockedOrder->status;

            abort_if(! in_array($lockedOrder->status, ['paid', 'processing', 'shipped', 'completed'], true), 422, 'Order belum dibayar.');

            $lockedItem = OrderItem::query()
                ->whereKey($orderItem->id)
                ->where('order_id', $lockedOrder->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertValidStatusTransition($lockedItem->status, $data['status']);

            $lockedItem->update(['status' => $data['status']]);
            $this->syncOrderStatus($lockedOrder);

            $freshOrder = $lockedOrder->fresh();
            $this->createOrderStatusNotification($freshOrder, $previousOrderStatus);

            return $freshOrder;
        });

        return $this->show($request, $updatedOrder);
    }

    private function seller(Request $request)
    {
        $seller = $request->user()->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');
        abort_if($seller->status !== 'active', 403, 'Seller belum aktif.');

        return $seller;
    }

    private function sellerOrderPayload(Order $order, $seller): array
    {
        $order->loadMissing('payment');
        $status = $order->status === 'pending' && $order->payment?->status === 'paid'
            ? 'paid'
            : $order->status;

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $status,
            'seller_status' => $this->sellerStatus($order->items),
            'next_status' => $this->nextStatus($this->sellerStatus($order->items)),
            'payment_status' => $order->payment?->status,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'shipping_address' => $order->shipping_address,
            'origin_city' => $order->origin_city,
            'destination_city' => $order->destination_city,
            'courier' => $order->courier,
            'shipping_service' => $order->shipping_service,
            'shipping_cost' => (float) $order->shipping_cost,
            'shipping_estimated_days' => $order->shipping_estimated_days,
            'notes' => $order->notes,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'seller_total' => (float) $order->items->sum('subtotal'),
            'total_amount' => (float) $order->total_amount,
            'seller' => [
                'id' => $seller->id,
                'store_name' => $seller->store_name,
                'origin_city' => $seller->origin_city,
            ],
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

    private function assertSellerItemsCanTransition(Collection $items, string $nextStatus): void
    {
        $items->each(fn (OrderItem $item) => $this->assertValidStatusTransition($item->status, $nextStatus));
    }

    private function assertValidStatusTransition(string $currentStatus, string $nextStatus): void
    {
        if ($currentStatus === 'completed') {
            $this->unprocessable('Order yang sudah completed tidak dapat diubah lagi.');
        }

        $currentRank = self::STATUS_ORDER[$currentStatus] ?? null;
        $nextRank = self::STATUS_ORDER[$nextStatus] ?? null;

        if (! $currentRank || ! $nextRank) {
            $this->unprocessable('Status order tidak valid.');
        }

        if ($nextRank < $currentRank) {
            $this->unprocessable('Status order tidak dapat dikembalikan ke status sebelumnya.');
        }

        $expectedStatus = self::NEXT_STATUS[$currentStatus] ?? null;

        if ($nextStatus !== $expectedStatus) {
            $this->unprocessable("Status order hanya dapat maju satu tahap dari {$currentStatus} ke {$expectedStatus}.");
        }
    }

    private function sellerStatus(Collection $items): string
    {
        $statuses = $items->pluck('status')->filter();

        if ($statuses->isEmpty()) {
            return 'pending';
        }

        $lowestRank = $statuses
            ->map(fn (string $status) => self::STATUS_ORDER[$status] ?? 0)
            ->filter()
            ->min();

        return array_search($lowestRank, self::STATUS_ORDER, true) ?: $statuses->first();
    }

    private function nextStatus(string $status): ?string
    {
        return self::NEXT_STATUS[$status] ?? null;
    }

    private function createOrderStatusNotification(Order $order, string $previousStatus): void
    {
        $order->loadMissing('user');

        if (! in_array($order->status, ['shipped', 'completed'], true) || $order->status === $previousStatus) {
            return;
        }

        $payload = match ($order->status) {
            'shipped' => [
                'title' => 'Pesanan Dikirim',
                'message' => "Pesanan kamu dengan nomor order #{$order->id} sedang dalam pengiriman.",
                'type' => 'order_shipped',
            ],
            'completed' => [
                'title' => 'Pesanan Selesai',
                'message' => "Pesanan kamu dengan nomor order #{$order->id} telah selesai.",
                'type' => 'order_completed',
            ],
        };

        Notification::create($payload + [
            'user_id' => $order->user_id,
            'order_id' => $order->id,
        ]);
    }

    private function unprocessable(string $message): void
    {
        throw new HttpResponseException(response()->json([
            'message' => $message,
        ], 422));
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
