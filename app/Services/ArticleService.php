<?php

namespace App\Services;

use App\Models\Article;
use App\Models\CreatorProfile;
use App\Models\User;
use Illuminate\Support\Str;

class ArticleService
{
    public function authorTypeFor(User $user): string
    {
        $user->loadMissing('role');

        if ($user->hasRole('admin')) {
            return 'admin';
        }

        if ($user->hasRole('seller')) {
            return 'seller';
        }

        return 'affiliate';
    }

    public function uniqueSlug(string $title, ?Article $ignore = null): string
    {
        $base = Str::slug($title) ?: Str::lower(Str::random(8));
        $slug = $base;
        $counter = 2;

        while (Article::where('slug', $slug)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function ensureCreatorProfile(User $user, ?string $displayName = null): CreatorProfile
    {
        $existing = $user->creatorProfile()->first();

        if ($existing) {
            $user->setRelation('creatorProfile', $existing);

            return $existing;
        }

        $base = Str::slug($displayName ?: $user->name) ?: 'creator';
        $username = $base;
        $counter = 2;

        while (CreatorProfile::where('username', $username)->exists()) {
            $username = "{$base}-{$counter}";
            $counter++;
        }

        $profile = CreatorProfile::create([
            'user_id' => $user->id,
            'username' => $username,
            'display_name' => $displayName ?: $user->name,
            'status' => 'active',
        ]);

        $user->setRelation('creatorProfile', $profile);

        return $profile;
    }

    public function syncRecommendations(Article $article, array $recommendations): void
    {
        $article->articleProducts()->delete();

        foreach (array_values($recommendations) as $index => $recommendation) {
            if (empty($recommendation['product_id']) && empty($recommendation['external_url']) && empty($recommendation['custom_title'])) {
                continue;
            }

            $article->articleProducts()->create([
                'product_id' => $recommendation['product_id'] ?? null,
                'custom_title' => $recommendation['custom_title'] ?? null,
                'custom_description' => $recommendation['custom_description'] ?? null,
                'external_platform' => $recommendation['external_platform'] ?? null,
                'external_url' => $recommendation['external_url'] ?? null,
                'external_price_label' => $recommendation['external_price_label'] ?? null,
                'external_image' => $recommendation['external_image'] ?? null,
                'sort_order' => $recommendation['sort_order'] ?? $index,
            ]);
        }
    }
}
