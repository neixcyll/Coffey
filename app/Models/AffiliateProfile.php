<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateProfile extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'affiliate_name',
        'phone',
        'payout_bank',
        'payout_account_name',
        'payout_account_number',
        'notes',
        'commission_rate',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(AffiliateClick::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class);
    }

    public function articleClicks(): HasMany
    {
        return $this->hasMany(ArticleClick::class, 'affiliate_id');
    }
}
