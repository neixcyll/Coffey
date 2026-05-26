<?php

namespace App\Services;

use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AffiliateService
{
    public const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'cancelled'];
    public const PROFILE_STATUSES = ['active', 'inactive'];

    public function profileFor(User $user): ?AffiliateProfile
    {
        return $user->affiliateProfile()->first();
    }

    public function registerProfile(User $user, array $data): AffiliateProfile
    {
        $existing = $user->affiliateProfile()->first();

        if ($existing) {
            app(ArticleService::class)->ensureCreatorProfile($user, $existing->affiliate_name ?: $user->name);
            $user->setRelation('affiliateProfile', $existing);

            return $existing;
        }

        $profile = AffiliateProfile::create([
            'user_id' => $user->id,
            'code' => $this->uniqueCode($user),
            'affiliate_name' => $data['affiliate_name'],
            'phone' => $data['phone'] ?? null,
            'payout_bank' => $data['payout_bank'] ?? null,
            'payout_account_name' => $data['payout_account_name'] ?? null,
            'payout_account_number' => $data['payout_account_number'] ?? null,
            'notes' => $data['notes'] ?? null,
            'commission_rate' => 5,
            'status' => 'active',
        ]);

        app(ArticleService::class)->ensureCreatorProfile($user, $profile->affiliate_name);
        $user->setRelation('affiliateProfile', $profile);

        return $profile;
    }

    public function activeProfileByCode(?string $code): ?AffiliateProfile
    {
        if (! $code) {
            return null;
        }

        return AffiliateProfile::query()
            ->where('code', Str::upper(trim($code)))
            ->where('status', 'active')
            ->first();
    }

    public function trackClick(AffiliateProfile $profile, Request $request, ?int $productId = null): AffiliateClick
    {
        return AffiliateClick::create([
            'affiliate_profile_id' => $profile->id,
            'product_id' => $productId,
            'visitor_hash' => $this->visitorHash($request),
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'landing_url' => $request->input('landing_url'),
            'clicked_at' => now(),
        ]);
    }

    public function createCommissionsForOrder(Order $order): void
    {
        $order->loadMissing(['items', 'affiliateProfile', 'affiliateClick']);

        $profile = $order->affiliateProfile;

        if (! $profile || $profile->status !== 'active') {
            return;
        }

        $rate = (float) $profile->commission_rate;

        foreach ($order->items as $item) {
            $amount = (float) $item->subtotal;

            AffiliateCommission::updateOrCreate(
                ['order_item_id' => $item->id],
                [
                    'affiliate_profile_id' => $profile->id,
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'seller_id' => $item->seller_id,
                    'amount' => $amount,
                    'commission_rate' => $rate,
                    'commission_amount' => round($amount * $rate / 100, 2),
                    'status' => 'pending',
                ],
            );
        }

        if ($order->affiliateClick && ! $order->affiliateClick->converted_at) {
            $order->affiliateClick->update(['converted_at' => now()]);
        }
    }

    public function cancelCommissionsForOrder(Order $order): void
    {
        $order->affiliateCommissions()
            ->whereIn('status', ['pending', 'approved'])
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
    }

    public function commissionSummary(AffiliateProfile $profile): array
    {
        $base = $profile->commissions();

        return [
            'total_clicks' => $profile->clicks()->count(),
            'total_conversions' => $profile->commissions()->distinct('order_id')->count('order_id'),
            'pending_commission' => (float) (clone $base)->where('status', 'pending')->sum('commission_amount'),
            'approved_commission' => (float) (clone $base)->where('status', 'approved')->sum('commission_amount'),
            'paid_commission' => (float) (clone $base)->where('status', 'paid')->sum('commission_amount'),
            'cancelled_commission' => (float) (clone $base)->where('status', 'cancelled')->sum('commission_amount'),
            'total_commission' => (float) (clone $base)->whereIn('status', ['pending', 'approved', 'paid'])->sum('commission_amount'),
        ];
    }

    private function uniqueCode(User $user): string
    {
        $base = Str::upper(Str::slug(Str::words($user->name, 2, ''), ''));
        $base = preg_replace('/[^A-Z0-9]/', '', $base) ?: 'KOPI';
        $base = Str::limit($base, 12, '');
        $code = $base.Str::upper(Str::random(4));

        while (AffiliateProfile::where('code', $code)->exists()) {
            $code = $base.Str::upper(Str::random(5));
        }

        return $code;
    }

    private function visitorHash(Request $request): string
    {
        return hash('sha256', $request->ip().'|'.(string) $request->userAgent());
    }
}
