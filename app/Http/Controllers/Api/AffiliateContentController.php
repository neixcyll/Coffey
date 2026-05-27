<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\AffiliateCommission;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Order;
use App\Services\AffiliateService;
use App\Services\ArticleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AffiliateContentController extends Controller
{
    public function summary(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $profile = $this->profile($request, $affiliates);
        $articleIds = Article::query()
            ->where('author_id', $request->user()->id)
            ->where('author_type', 'affiliate')
            ->pluck('id');

        $affiliateClickIds = $profile->articleClicks()
            ->whereIn('article_id', $articleIds)
            ->whereNotNull('affiliate_click_id')
            ->pluck('affiliate_click_id');

        $orderIds = Order::query()
            ->whereIn('affiliate_click_id', $affiliateClickIds)
            ->pluck('id');

        return response()->json([
            'data' => [
                'total_articles' => $articleIds->count(),
                'published_articles' => Article::whereIn('id', $articleIds)->where('status', 'published')->count(),
                'pending_articles' => Article::whereIn('id', $articleIds)->where('status', 'pending')->count(),
                'article_views' => Article::whereIn('id', $articleIds)->withCount('views')->get()->sum('views_count'),
                'product_clicks' => $profile->articleClicks()->whereIn('article_id', $articleIds)->count(),
                'estimated_commission' => (float) AffiliateCommission::query()
                    ->where('affiliate_profile_id', $profile->id)
                    ->whereIn('order_id', $orderIds)
                    ->whereIn('status', ['pending', 'approved', 'paid'])
                    ->sum('commission_amount'),
            ],
        ]);
    }

    public function index(Request $request, AffiliateService $affiliates): JsonResponse
    {
        $this->profile($request, $affiliates);

        $articles = Article::query()
            ->with(['category', 'author.creatorProfile', 'articleProducts.product.seller', 'articleProducts.product.variants'])
            ->withCount(['views', 'clicks'])
            ->where('author_id', $request->user()->id)
            ->where('author_type', 'affiliate')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return ArticleResource::collection($articles)->response();
    }

    public function store(Request $request, AffiliateService $affiliates, ArticleService $articles): JsonResponse
    {
        $profile = $this->profile($request, $affiliates);
        $data = $this->validatedArticleData($request, false);
        $articles->ensureCreatorProfile($request->user(), $profile->affiliate_name);

        $article = Article::create([
            ...$this->articleAttributes($data),
            'author_id' => $request->user()->id,
            'author_type' => 'affiliate',
            'slug' => $articles->uniqueSlug($data['title']),
            'status' => $data['status'] ?? 'pending',
            'published_at' => null,
        ]);

        $articles->syncRecommendations($article, $data['recommendations'] ?? []);

        return response()->json([
            'message' => 'Artikel dibuat dan menunggu review admin.',
            'data' => new ArticleResource($article->load(['category', 'author.creatorProfile', 'articleProducts.product.seller', 'articleProducts.product.variants'])->loadCount(['views', 'clicks'])),
        ], 201);
    }

    public function show(Request $request, Article $article, AffiliateService $affiliates): JsonResponse
    {
        $this->profile($request, $affiliates);
        abort_if($article->author_id !== $request->user()->id || $article->author_type !== 'affiliate', 404);

        return (new ArticleResource($article->load(['category', 'author.creatorProfile', 'articleProducts.product.category', 'articleProducts.product.seller', 'articleProducts.product.variants'])->loadCount(['views', 'clicks'])))->response();
    }

    public function update(Request $request, Article $article, AffiliateService $affiliates, ArticleService $articles): JsonResponse
    {
        $this->profile($request, $affiliates);
        abort_if($article->author_id !== $request->user()->id || $article->author_type !== 'affiliate', 404);

        $data = $this->validatedArticleData($request, true);
        $article->fill($this->articleAttributes($data));

        if (($data['title'] ?? null) && $article->isDirty('title')) {
            $article->slug = $articles->uniqueSlug($data['title'], $article);
        }

        $article->status = $data['status'] ?? 'pending';
        $article->published_at = null;
        $article->rejected_at = null;
        $article->rejection_reason = null;
        $article->save();

        if (array_key_exists('recommendations', $data)) {
            $articles->syncRecommendations($article, $data['recommendations'] ?? []);
        }

        return response()->json([
            'message' => 'Artikel diperbarui dan kembali menunggu review admin.',
            'data' => new ArticleResource($article->fresh()->load(['category', 'author.creatorProfile', 'articleProducts.product.seller', 'articleProducts.product.variants'])->loadCount(['views', 'clicks'])),
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => ArticleCategory::query()->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    private function profile(Request $request, AffiliateService $affiliates)
    {
        $profile = $affiliates->profileFor($request->user());
        abort_if(! $profile || $profile->status !== 'active', 403, 'Daftar affiliate aktif diperlukan untuk membuat konten.');

        return $profile;
    }

    private function validatedArticleData(Request $request, bool $partial): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'article_category_id' => [$required, 'integer', 'exists:article_categories,id'],
            'title' => [$required, 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => [$required, 'string'],
            'featured_image' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', Rule::in(['draft', 'pending'])],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'recommendations' => ['nullable', 'array'],
            'recommendations.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'recommendations.*.custom_title' => ['nullable', 'string', 'max:255'],
            'recommendations.*.custom_description' => ['nullable', 'string', 'max:1000'],
            'recommendations.*.external_platform' => ['nullable', 'string', 'max:100'],
            'recommendations.*.external_url' => ['nullable', 'string', 'max:2000'],
            'recommendations.*.external_price_label' => ['nullable', 'string', 'max:255'],
            'recommendations.*.external_image' => ['nullable', 'string', 'max:2000'],
            'recommendations.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function articleAttributes(array $data): array
    {
        return collect($data)->only([
            'article_category_id',
            'title',
            'excerpt',
            'content',
            'featured_image',
            'meta_title',
            'meta_description',
        ])->all();
    }
}
