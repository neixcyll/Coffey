<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleProduct extends Model
{
    protected $table = 'article_product';

    protected $fillable = [
        'article_id',
        'product_id',
        'custom_title',
        'custom_description',
        'external_platform',
        'external_url',
        'external_price_label',
        'external_image',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
