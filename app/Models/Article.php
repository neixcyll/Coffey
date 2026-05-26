<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Article extends Model
{
    public const STATUSES = ['draft', 'pending', 'published', 'rejected'];
    public const AUTHOR_TYPES = ['admin', 'seller', 'affiliate'];

    protected $fillable = [
        'article_category_id',
        'author_id',
        'author_type',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'status',
        'meta_title',
        'meta_description',
        'published_at',
        'rejected_at',
        'rejection_reason',
        'is_featured',
        'featured_rank',
    ];

    protected $appends = [
        'featured_image_url',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'rejected_at' => 'datetime',
            'is_featured' => 'boolean',
            'featured_rank' => 'integer',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ArticleCategory::class, 'article_category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function articleProducts(): HasMany
    {
        return $this->hasMany(ArticleProduct::class)->orderBy('sort_order');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'article_product')
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

    public function clicks(): HasMany
    {
        return $this->hasMany(ArticleClick::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(ArticleView::class);
    }

    public function getFeaturedImageUrlAttribute(): ?string
    {
        if (! $this->featured_image) {
            return null;
        }

        if (str_starts_with($this->featured_image, 'http')) {
            return $this->featured_image;
        }

        return Storage::url($this->featured_image);
    }
}
