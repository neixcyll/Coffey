<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateClick extends Model
{
    protected $fillable = [
        'affiliate_profile_id',
        'product_id',
        'visitor_hash',
        'ip_address',
        'user_agent',
        'landing_url',
        'clicked_at',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function affiliateProfile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
