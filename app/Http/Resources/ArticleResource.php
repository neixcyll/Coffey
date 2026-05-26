<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'featured_image' => $this->featured_image,
            'featured_image_url' => $this->featured_image_url,
            'author_id' => $this->author_id,
            'author_type' => $this->author_type,
            'status' => $this->status,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'published_at' => $this->published_at,
            'rejected_at' => $this->rejected_at,
            'rejection_reason' => $this->rejection_reason,
            'is_featured' => $this->is_featured,
            'featured_rank' => $this->featured_rank,
            'views_count' => $this->whenCounted('views'),
            'clicks_count' => $this->whenCounted('clicks'),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author->id,
                'name' => $this->author->name,
                'email' => $request->user()?->isAdmin() ? $this->author->email : null,
                'creator_profile' => $this->author->creatorProfile ? [
                    'username' => $this->author->creatorProfile->username,
                    'display_name' => $this->author->creatorProfile->display_name,
                    'bio' => $this->author->creatorProfile->bio,
                    'avatar_url' => $this->author->creatorProfile->avatar_url,
                    'website_url' => $this->author->creatorProfile->website_url,
                ] : null,
            ]),
            'recommended_products' => ArticleProductResource::collection($this->whenLoaded('articleProducts')),
            'related_articles' => ArticleSummaryResource::collection($this->whenLoaded('relatedArticles')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
