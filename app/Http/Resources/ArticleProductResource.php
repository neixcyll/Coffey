<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $internalAvailable = $product
            && $product->status === 'active'
            && $product->stock > 0
            && $product->seller?->status === 'active';

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'title' => $this->custom_title ?: $product?->name,
            'description' => $this->custom_description ?: $product?->description,
            'image_url' => $this->external_image ?: $product?->image_url,
            'price' => $product?->price,
            'price_label' => $this->external_price_label ?: ($product ? null : '-'),
            'external_platform' => $this->external_platform,
            'external_url' => $this->external_url,
            'sort_order' => $this->sort_order,
            'internal_available' => (bool) $internalAvailable,
            'cta_label' => $internalAvailable ? 'Beli di Marketplace' : 'Cek Harga via Affiliate Link',
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'stock' => $product->stock,
                'status' => $product->status,
                'image_url' => $product->image_url,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'seller' => $product->seller ? [
                    'id' => $product->seller->id,
                    'store_name' => $product->seller->store_name,
                    'slug' => $product->seller->slug,
                    'status' => $product->seller->status,
                ] : null,
            ] : null,
        ];
    }
}
