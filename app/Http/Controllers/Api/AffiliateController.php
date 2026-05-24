<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Services\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateController extends Controller
{
    public function trackClick(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'landing_url' => ['nullable', 'string', 'max:2000'],
        ]);

        $profile = $affiliates->activeProfileByCode($data['code']);

        if (! $profile) {
            return response()->json(['message' => 'Kode affiliate tidak ditemukan.'], 404);
        }

        $click = $affiliates->trackClick($profile, $request, $data['product_id'] ?? null);

        return response()->json([
            'message' => 'Click affiliate dicatat.',
            'data' => [
                'click_id' => $click->id,
                'affiliate_code' => $profile->code,
            ],
        ], 201);
    }

    public function dashboard(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $profile = $affiliates->profileFor($request->user());

        if (! $profile) {
            return response()->json([
                'data' => [
                    'requires_registration' => true,
                    'profile' => null,
                    'summary' => null,
                    'recent_commissions' => [],
                    'recent_clicks' => [],
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'requires_registration' => false,
                'profile' => $profile,
                'summary' => $affiliates->commissionSummary($profile),
                'recent_commissions' => $profile->commissions()
                    ->with(['order:id,order_number,total_amount,status,created_at', 'product:id,name'])
                    ->latest()
                    ->limit(8)
                    ->get(),
                'recent_clicks' => $profile->clicks()
                    ->with('product:id,name')
                    ->latest()
                    ->limit(8)
                    ->get(),
            ],
        ]);
    }

    public function register(Request $request, AffiliateService $affiliates): JsonResponse
    {
        if ($request->user()->affiliateProfile) {
            return response()->json(['message' => 'Akun affiliate sudah terdaftar.'], 422);
        }

        $data = $request->validate([
            'affiliate_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'payout_bank' => ['nullable', 'string', 'max:100'],
            'payout_account_name' => ['nullable', 'string', 'max:255'],
            'payout_account_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $profile = $affiliates->registerProfile($request->user(), $data);

        return response()->json([
            'message' => 'Pendaftaran affiliate berhasil.',
            'data' => [
                'profile' => $profile,
                'summary' => $affiliates->commissionSummary($profile),
            ],
        ], 201);
    }

    public function commissions(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $profile = $affiliates->profileFor($request->user());

        if (! $profile) {
            return response()->json(['data' => []]);
        }

        $commissions = AffiliateCommission::query()
            ->with(['order:id,order_number,total_amount,status,created_at', 'product:id,name', 'seller:id,store_name'])
            ->where('affiliate_profile_id', $profile->id)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($commissions);
    }

    public function clicks(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $profile = $affiliates->profileFor($request->user());

        if (! $profile) {
            return response()->json(['data' => []]);
        }

        $clicks = AffiliateClick::query()
            ->with('product:id,name')
            ->where('affiliate_profile_id', $profile->id)
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($clicks);
    }
}
