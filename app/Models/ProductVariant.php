<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'weight_grams',
        'grind_size',
        'price',
        'stock',
        'sku',
        'sort_order',
    ];

    protected $appends = [
        'label',
    ];

    protected function casts(): array
    {
        return [
            'weight_grams' => 'integer',
            'price' => 'decimal:2',
            'stock' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getLabelAttribute(): string
    {
        return $this->weightLabel().' / '.$this->grind_size;
    }

    private function weightLabel(): string
    {
        $grams = (int) $this->weight_grams;

        if ($grams >= 1000 && $grams % 1000 === 0) {
            return ($grams / 1000).'kg';
        }

        if ($grams >= 1000) {
            return rtrim(rtrim(number_format($grams / 1000, 2, '.', ''), '0'), '.').'kg';
        }

        return $grams.'gr';
    }
}
