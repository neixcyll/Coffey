<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Services\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AffiliateController extends Controller
{
    public function index(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $profiles = AffiliateProfile::query()
            ->with('user.role')
            ->withCount(['clicks', 'commissions'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $profiles->getCollection()->transform(function (AffiliateProfile $profile) use ($affiliates) {
            return $this->payload($profile, $affiliates);
        });

        return response()->json($profiles);
    }

    public function show(AffiliateProfile $affiliate, AffiliateService $affiliates): JsonResponse
    {
        $affiliate->load(['user.role', 'commissions.order', 'commissions.product', 'clicks.product']);

        return response()->json([
            'data' => $this->payload($affiliate, $affiliates) + [
                'commissions' => $affiliate->commissions,
                'clicks' => $affiliate->clicks,
            ],
        ]);
    }

    public function update(Request $request, AffiliateProfile $affiliate, AffiliateService $affiliates): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(AffiliateService::PROFILE_STATUSES)],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ]);

        $affiliate->update($data);

        return response()->json([
            'message' => 'Affiliate berhasil diperbarui.',
            'data' => $this->payload($affiliate->fresh('user.role'), $affiliates),
        ]);
    }

    private function payload(AffiliateProfile $profile, AffiliateService $affiliates): array
    {
        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'code' => $profile->code,
            'affiliate_name' => $profile->affiliate_name,
            'phone' => $profile->phone,
            'payout_bank' => $profile->payout_bank,
            'payout_account_name' => $profile->payout_account_name,
            'payout_account_number' => $profile->payout_account_number,
            'notes' => $profile->notes,
            'commission_rate' => $profile->commission_rate,
            'status' => $profile->status,
            'user' => $profile->user,
            'clicks_count' => $profile->clicks_count ?? $profile->clicks()->count(),
            'commissions_count' => $profile->commissions_count ?? $profile->commissions()->count(),
            'summary' => $affiliates->commissionSummary($profile),
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
        ];
    }
}
