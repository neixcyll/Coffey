<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\Article;
use App\Models\Payment;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $paidStatuses = PaymentStatusService::PAID_ORDER_STATUSES;
        $roles = Role::query()->pluck('id', 'name');

        return response()->json([
            'data' => [
                'total_users' => User::count(),
                'total_customers' => User::where('role_id', $roles['customer'] ?? 0)->count(),
                'total_sellers' => User::where('role_id', $roles['seller'] ?? 0)->count(),
                'total_products' => Product::count(),
                'total_orders' => Order::count(),
                'total_revenue' => (float) Order::whereIn('status', $paidStatuses)->sum('total_amount'),
                'paid_revenue' => (float) Order::whereIn('status', $paidStatuses)->sum('total_amount'),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'pending_seller_approvals' => SellerProfile::where('status', 'pending')->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'total_affiliates' => AffiliateProfile::count(),
                'pending_affiliate_commissions' => AffiliateCommission::where('status', 'pending')->count(),
                'affiliate_commission_amount' => (float) AffiliateCommission::whereIn('status', ['pending', 'approved', 'paid'])->sum('commission_amount'),
                'total_articles' => Article::count(),
                'published_articles' => Article::where('status', 'published')->count(),
                'pending_articles' => Article::where('status', 'pending')->count(),
            ],
        ]);
    }
}
