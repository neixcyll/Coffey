<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        'seller_id',
        'product_name',
        'variant_label',
        'weight_grams',
        'grind_size',
        'price',
        'quantity',
        'subtotal',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'weight_grams' => 'integer',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function affiliateCommission(): HasOne
    {
        return $this->hasOne(AffiliateCommission::class);
    }
}
