<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'order_id',
        'user_id',
        'seller_id',
        'rating',
        'comment',
        'images',
        'seller_reply',
        'seller_replied_at',
        'status',
    ];

    protected $appends = [
        'image_urls',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'rating' => 'integer',
            'seller_replied_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function getImageUrlsAttribute(): array
    {
        return collect($this->images ?? [])
            ->map(fn (string $path) => str_starts_with($path, 'http') ? $path : Storage::url($path))
            ->values()
            ->all();
    }
}
