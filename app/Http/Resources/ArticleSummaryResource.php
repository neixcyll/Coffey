<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'featured_image_url' => $this->featured_image_url,
            'published_at' => $this->published_at,
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
                'creator_profile' => $this->author->creatorProfile ? [
                    'username' => $this->author->creatorProfile->username,
                    'display_name' => $this->author->creatorProfile->display_name,
                    'avatar_url' => $this->author->creatorProfile->avatar_url,
                ] : null,
            ]),
        ];
    }
}
