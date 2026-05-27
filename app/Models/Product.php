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
        'roast_level',
        'origin',
        'image',
    ];

    protected $appends = [
        'image_url',
        'avg_rating',
        'reviews_count',
        'price',
        'min_price',
        'max_price',
        'stock',
        'weight',
    ];

    protected function casts(): array
    {
        return [];
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

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)
            ->orderBy('sort_order')
            ->orderBy('weight_grams')
            ->orderBy('grind_size');
    }

    public function brewingMethods(): BelongsToMany
    {
        return $this->belongsToMany(BrewingMethod::class, 'product_brewing_method')
            ->withTimestamps()
            ->orderBy('name');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
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

    public function getPriceAttribute($value = null): ?float
    {
        return $this->getMinPriceAttribute() ?? ($value === null ? null : (float) $value);
    }

    public function getMinPriceAttribute(): ?float
    {
        $variant = $this->relationLoaded('variants')
            ? $this->variants->sortBy(fn (ProductVariant $variant) => (float) $variant->price)->first()
            : $this->variants()->orderBy('price')->first();

        return $variant ? (float) $variant->price : null;
    }

    public function getMaxPriceAttribute(): ?float
    {
        $variant = $this->relationLoaded('variants')
            ? $this->variants->sortByDesc(fn (ProductVariant $variant) => (float) $variant->price)->first()
            : $this->variants()->orderByDesc('price')->first();

        return $variant ? (float) $variant->price : null;
    }

    public function getStockAttribute($value = null): int
    {
        if ($this->relationLoaded('variants')) {
            return (int) $this->variants->sum('stock');
        }

        return $this->variants()->exists()
            ? (int) $this->variants()->sum('stock')
            : (int) ($value ?? 0);
    }

    public function getWeightAttribute($value = null): ?int
    {
        $variant = $this->relationLoaded('variants')
            ? $this->variants->sortBy('weight_grams')->first()
            : $this->variants()->orderBy('weight_grams')->first();

        return $variant ? (int) $variant->weight_grams : ($value === null ? null : (int) $value);
    }

    public function getAvgRatingAttribute(): ?float
    {
        $average = $this->attributes['avg_rating'] ?? null;

        if ($average === null) {
            $average = $this->relationLoaded('reviews')
                ? $this->reviews->where('status', 'published')->avg('rating')
                : $this->reviews()->where('status', 'published')->avg('rating');
        }

        return $average === null ? null : round((float) $average, 1);
    }

    public function getReviewsCountAttribute(): int
    {
        $count = $this->attributes['reviews_count'] ?? null;

        if ($count === null) {
            $count = $this->relationLoaded('reviews')
                ? $this->reviews->where('status', 'published')->count()
                : $this->reviews()->where('status', 'published')->count();
        }

        return (int) $count;
    }
}
