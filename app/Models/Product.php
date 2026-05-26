<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'seller_id',
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'weight',
        'roast_level',
        'origin',
        'brewing_method',
        'image',
        'status',
    ];

    protected $appends = [
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'weight' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function articleRecommendations(): HasMany
    {
        return $this->hasMany(ArticleProduct::class);
    }

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_product')
            ->withPivot([
                'id',
                'custom_title',
                'custom_description',
                'external_platform',
                'external_url',
                'external_price_label',
                'external_image',
                'sort_order',
            ])
            ->withTimestamps();
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return Storage::url($this->image);
    }
}
