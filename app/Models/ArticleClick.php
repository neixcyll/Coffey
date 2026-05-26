<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleClick extends Model
{
    protected $fillable = [
        'article_id',
        'article_product_id',
        'product_id',
        'affiliate_id',
        'affiliate_click_id',
        'user_id',
        'ip_address',
        'user_agent',
        'referrer',
        'target_url',
        'external_platform',
        'clicked_at',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
        ];
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function articleProduct(): BelongsTo
    {
        return $this->belongsTo(ArticleProduct::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_id');
    }

    public function affiliateClick(): BelongsTo
    {
        return $this->belongsTo(AffiliateClick::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
