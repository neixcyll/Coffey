<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Role;
use App\Models\User;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $paidStatuses = PaymentStatusService::PAID_ORDER_STATUSES;
        $monthStart = now()->startOfMonth();
        $customerRoleId = Role::where('name', 'customer')->value('id');

        $bestSellingProducts = OrderItem::query()
            ->select([
                'product_id',
                'product_name',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_revenue'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', $paidStatuses)
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        $topSellers = OrderItem::query()
            ->select([
                'seller_profiles.id',
                'seller_profiles.store_name',
                DB::raw('COUNT(DISTINCT order_items.order_id) as total_orders'),
                DB::raw('SUM(order_items.subtotal) as total_revenue'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('seller_profiles', 'seller_profiles.id', '=', 'order_items.seller_id')
            ->whereIn('orders.status', $paidStatuses)
            ->groupBy('seller_profiles.id', 'seller_profiles.store_name')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        $topAffiliates = AffiliateCommission::query()
            ->select([
                'affiliate_profiles.id',
                'affiliate_profiles.code',
                'users.name',
                DB::raw('COUNT(DISTINCT affiliate_commissions.order_id) as total_orders'),
                DB::raw('SUM(affiliate_commissions.commission_amount) as total_commission'),
            ])
            ->join('affiliate_profiles', 'affiliate_profiles.id', '=', 'affiliate_commissions.affiliate_profile_id')
            ->join('users', 'users.id', '=', 'affiliate_profiles.user_id')
            ->whereIn('affiliate_commissions.status', ['pending', 'approved', 'paid'])
            ->groupBy('affiliate_profiles.id', 'affiliate_profiles.code', 'users.name')
            ->orderByDesc('total_commission')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'best_selling_products' => $bestSellingProducts,
                'top_sellers' => $topSellers,
                'monthly_revenue' => (float) Order::whereIn('status', $paidStatuses)
                    ->where('created_at', '>=', $monthStart)
                    ->sum('total_amount'),
                'monthly_orders' => Order::where('created_at', '>=', $monthStart)->count(),
                'monthly_new_customers' => User::where('role_id', $customerRoleId)
                    ->where('created_at', '>=', $monthStart)
                    ->count(),
                'monthly_affiliate_commission' => (float) AffiliateCommission::whereIn('status', ['pending', 'approved', 'paid'])
                    ->where('created_at', '>=', $monthStart)
                    ->sum('commission_amount'),
                'top_affiliates' => $topAffiliates,
            ],
        ]);
    }
}
