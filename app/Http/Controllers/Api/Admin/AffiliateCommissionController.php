<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Services\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AffiliateCommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $commissions = AffiliateCommission::query()
            ->with([
                'affiliateProfile.user',
                'order:id,order_number,total_amount,status,created_at',
                'product:id,name',
                'seller:id,store_name',
            ])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('affiliate_profile_id'), fn ($query) => $query->where('affiliate_profile_id', $request->integer('affiliate_profile_id')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->whereHas('affiliateProfile', fn ($query) => $query->where('code', 'like', "%{$search}%"))
                    ->orWhereHas('order', fn ($query) => $query->where('order_number', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($commissions);
    }

    public function show(AffiliateCommission $commission): JsonResponse
    {
        return response()->json([
            'data' => $commission->load([
                'affiliateProfile.user',
                'order.user',
                'orderItem',
                'product',
                'seller',
            ]),
        ]);
    }

    public function update(Request $request, AffiliateCommission $commission): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(AffiliateService::COMMISSION_STATUSES)],
        ]);

        $timestamps = match ($data['status']) {
            'approved' => ['approved_at' => now(), 'paid_at' => null, 'cancelled_at' => null],
            'paid' => ['approved_at' => $commission->approved_at ?? now(), 'paid_at' => now(), 'cancelled_at' => null],
            'cancelled' => ['cancelled_at' => now()],
            default => ['approved_at' => null, 'paid_at' => null, 'cancelled_at' => null],
        };

        $commission->update(['status' => $data['status']] + $timestamps);

        return response()->json([
            'message' => 'Status komisi berhasil diperbarui.',
            'data' => $commission->fresh(['affiliateProfile.user', 'order', 'product', 'seller']),
        ]);
    }
}
