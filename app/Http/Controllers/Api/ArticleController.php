<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ArticleSummaryResource;
use App\Models\AffiliateProfile;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\ArticleClick;
use App\Models\ArticleProduct;
use App\Models\ArticleView;
use App\Models\CreatorProfile;
use App\Models\Product;
use App\Services\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => ArticleCategory::query()
                ->withCount(['articles' => fn ($query) => $query->published()])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $articles = Article::query()
            ->published()
            ->with(['category', 'author.creatorProfile'])
            ->withCount(['views', 'clicks'])
            ->when($request->filled('category'), function ($query) use ($request) {
                $category = $request->string('category')->toString();
                $query->whereHas('category', fn ($query) => $query->where('slug', $category));
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('is_featured', true))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('is_featured')
            ->orderBy('featured_rank')
            ->latest('published_at')
            ->paginate($request->integer('per_page', 12))
            ->withQueryString();

        return ArticleSummaryResource::collection($articles)->response();
    }

    public function show(Request $request, Article $article): JsonResponse
    {
        abort_if($article->status !== 'published' || ! $article->published_at || $article->published_at->isFuture(), 404);

        $this->recordView($article, $request);

        $article->load([
            'category',
            'author.creatorProfile',
            'articleProducts.product.category',
            'articleProducts.product.seller:id,store_name,slug,status',
            'articleProducts.product.images',
        ])->loadCount(['views', 'clicks']);

        $related = Article::query()
            ->published()
            ->with(['category', 'author.creatorProfile'])
            ->withCount(['views', 'clicks'])
            ->whereKeyNot($article->id)
            ->where('article_category_id', $article->article_category_id)
            ->latest('published_at')
            ->limit(3)
            ->get();

        $article->setRelation('relatedArticles', $related);

        return (new ArticleResource($article))->response();
    }

    public function trackClick(Request $request, Article $article, AffiliateService $affiliates): JsonResponse
    {
        abort_if($article->status !== 'published' || ! $article->published_at || $article->published_at->isFuture(), 404);

        $data = $request->validate([
            'article_product_id' => ['nullable', 'integer', 'exists:article_product,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'target_url' => ['nullable', 'string', 'max:2000'],
            'referrer' => ['nullable', 'string', 'max:2000'],
        ]);

        $articleProduct = null;
        if (! empty($data['article_product_id'])) {
            $articleProduct = ArticleProduct::query()
                ->with('product.seller')
                ->where('article_id', $article->id)
                ->whereKey($data['article_product_id'])
                ->firstOrFail();
        }

        $product = $articleProduct?->product;
        if (! $product && ! empty($data['product_id'])) {
            $product = Product::query()->with('seller')->findOrFail($data['product_id']);
        }

        $affiliateProfile = $this->affiliateProfileForArticle($article);
        $affiliateClick = null;

        if ($affiliateProfile) {
            $affiliateClick = $affiliates->trackClick($affiliateProfile, $request, $product?->id);
        }

        $internalAvailable = $product
            && $product->status === 'active'
            && $product->stock > 0
            && $product->seller?->status === 'active';

        $targetUrl = $internalAvailable
            ? '/product/'.$product->slug
            : ($articleProduct?->external_url ?: ($data['target_url'] ?? null));

        $click = ArticleClick::create([
            'article_id' => $article->id,
            'article_product_id' => $articleProduct?->id,
            'product_id' => $product?->id,
            'affiliate_id' => $affiliateProfile?->id,
            'affiliate_click_id' => $affiliateClick?->id,
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'referrer' => $data['referrer'] ?? $request->headers->get('referer'),
            'target_url' => $targetUrl,
            'external_platform' => $internalAvailable ? null : $articleProduct?->external_platform,
            'clicked_at' => now(),
        ]);

        return response()->json([
            'message' => 'Klik artikel dicatat.',
            'data' => [
                'click_id' => $click->id,
                'affiliate_code' => $affiliateProfile?->code,
                'affiliate_click_id' => $affiliateClick?->id,
                'target_url' => $targetUrl,
                'internal' => (bool) $internalAvailable,
            ],
        ], 201);
    }

    public function creator(string $username): JsonResponse
    {
        $profile = CreatorProfile::query()
            ->with('user.affiliateProfile')
            ->where('username', $username)
            ->where('status', 'active')
            ->firstOrFail();

        $articles = Article::query()
            ->published()
            ->with(['category', 'author.creatorProfile'])
            ->withCount(['views', 'clicks'])
            ->where('author_id', $profile->user_id)
            ->latest('published_at')
            ->paginate(12);

        $articlePayload = ArticleSummaryResource::collection($articles)->response()->getData(true);

        return response()->json([
            'data' => [
                'profile' => [
                    'username' => $profile->username,
                    'display_name' => $profile->display_name,
                    'bio' => $profile->bio,
                    'avatar_url' => $profile->avatar_url,
                    'website_url' => $profile->website_url,
                    'social_links' => $profile->social_links,
                    'affiliate_code' => $profile->user->affiliateProfile?->code,
                ],
                'articles' => $articlePayload,
            ],
        ]);
    }

    private function affiliateProfileForArticle(Article $article): ?AffiliateProfile
    {
        if ($article->author_type !== 'affiliate') {
            return null;
        }

        return AffiliateProfile::query()
            ->where('user_id', $article->author_id)
            ->where('status', 'active')
            ->first();
    }

    private function recordView(Article $article, Request $request): void
    {
        ArticleView::create([
            'article_id' => $article->id,
            'user_id' => $request->user()?->id,
            'visitor_hash' => hash('sha256', $request->ip().'|'.(string) $request->userAgent()),
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'referrer' => $request->headers->get('referer'),
            'viewed_at' => now(),
        ]);
    }
}
