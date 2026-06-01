<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $seller = $request->user()->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');
        abort_if($seller->status !== 'active', 403, 'Seller belum aktif.');

        $paidStatuses = ['paid', 'processing', 'shipped', 'completed'];
        $orderItems = OrderItem::query()
            ->where('seller_id', $seller->id)
            ->join('orders', 'orders.id', '=', 'order_items.order_id');

        return response()->json([
            'data' => [
                'seller' => $seller,
                'total_products' => $seller->products()->count(),
                'total_orders' => (clone $orderItems)->distinct('order_items.order_id')->count('order_items.order_id'),
                'total_revenue' => (float) (clone $orderItems)
                    ->whereIn('orders.status', $paidStatuses)
                    ->sum('order_items.subtotal'),
                'pending_orders' => (clone $orderItems)
                    ->where('orders.status', 'pending')
                    ->distinct('order_items.order_id')
                    ->count('order_items.order_id'),
                'average_rating' => round((float) ProductReview::query()
                    ->where('status', 'published')
                    ->whereHas('product', fn ($query) => $query->where('seller_id', $seller->id))
                    ->avg('rating'), 1),
                'revenue_traffic' => $this->revenueTraffic($seller->id, $paidStatuses),
            ],
        ]);
    }

    private function revenueTraffic(int $sellerId, array $paidStatuses): array
    {
        $start = now()->subDays(13)->startOfDay();
        $rows = OrderItem::query()
            ->where('seller_id', $sellerId)
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', $paidStatuses)
            ->where('orders.created_at', '>=', $start)
            ->get(['orders.created_at', 'order_items.subtotal']);

        $grouped = $rows->groupBy(fn ($row) => Carbon::parse($row->created_at)->toDateString());

        return collect(range(13, 0))
            ->map(function (int $daysAgo) use ($grouped) {
                $date = now()->subDays($daysAgo)->toDateString();
                $items = $grouped->get($date, collect());

                return [
                    'date' => $date,
                    'revenue' => (float) $items->sum('subtotal'),
                    'items' => $items->count(),
                ];
            })
            ->values()
            ->all();
    }
}
