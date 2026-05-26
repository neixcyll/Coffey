<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Services\ArticleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $articles = Article::query()
            ->with(['category', 'author.creatorProfile', 'articleProducts.product.seller'])
            ->withCount(['views', 'clicks'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('category_id'), fn ($query) => $query->where('article_category_id', $request->integer('category_id')))
            ->when($request->boolean('featured'), fn ($query) => $query->where('is_featured', true))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhereHas('author', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return ArticleResource::collection($articles)->response();
    }

    public function show(Article $article): JsonResponse
    {
        return (new ArticleResource($article->load(['category', 'author.creatorProfile', 'articleProducts.product.category', 'articleProducts.product.seller'])->loadCount(['views', 'clicks'])))->response();
    }

    public function update(Request $request, Article $article, ArticleService $articles): JsonResponse
    {
        $data = $this->validatedArticleData($request);

        $article->fill(collect($data)->only([
            'article_category_id',
            'title',
            'excerpt',
            'content',
            'featured_image',
            'status',
            'meta_title',
            'meta_description',
            'is_featured',
            'featured_rank',
        ])->all());

        if (($data['title'] ?? null) && $article->isDirty('title')) {
            $article->slug = $articles->uniqueSlug($data['title'], $article);
        }

        if (($data['status'] ?? null) === 'published' && ! $article->published_at) {
            $article->published_at = now();
            $article->rejected_at = null;
            $article->rejection_reason = null;
        }

        if (($data['status'] ?? null) === 'rejected') {
            $article->rejected_at = now();
            $article->published_at = null;
        }

        if (array_key_exists('published_at', $data)) {
            $article->published_at = $data['published_at'];
        }

        $article->save();

        if (array_key_exists('recommendations', $data)) {
            $articles->syncRecommendations($article, $data['recommendations'] ?? []);
        }

        return response()->json([
            'message' => 'Artikel berhasil diperbarui.',
            'data' => new ArticleResource($article->fresh()->load(['category', 'author.creatorProfile', 'articleProducts.product.seller'])->loadCount(['views', 'clicks'])),
        ]);
    }

    public function approve(Article $article): JsonResponse
    {
        $article->update([
            'status' => 'published',
            'published_at' => $article->published_at ?: now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Artikel dipublish.',
            'data' => new ArticleResource($article->fresh()->load(['category', 'author.creatorProfile'])->loadCount(['views', 'clicks'])),
        ]);
    }

    public function reject(Request $request, Article $article): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $article->update([
            'status' => 'rejected',
            'published_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Artikel ditolak.',
            'data' => new ArticleResource($article->fresh()->load(['category', 'author.creatorProfile'])->loadCount(['views', 'clicks'])),
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => ArticleCategory::query()
                ->withCount('articles')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:article_categories,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = ArticleCategory::create([
            'name' => $data['name'],
            'slug' => $this->uniqueCategorySlug($data['name']),
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Kategori konten dibuat.',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, ArticleCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('article_categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->fill([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? $category->sort_order,
        ]);

        if ($category->isDirty('name')) {
            $category->slug = $this->uniqueCategorySlug($data['name'], $category);
        }

        $category->save();

        return response()->json([
            'message' => 'Kategori konten diperbarui.',
            'data' => $category,
        ]);
    }

    public function destroyCategory(ArticleCategory $category): JsonResponse
    {
        if ($category->articles()->exists()) {
            return response()->json(['message' => 'Kategori masih memiliki artikel.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori konten dihapus.']);
    }

    private function validatedArticleData(Request $request): array
    {
        return $request->validate([
            'article_category_id' => ['sometimes', 'integer', 'exists:article_categories,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['sometimes', 'string'],
            'featured_image' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(Article::STATUSES)],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
            'is_featured' => ['nullable', 'boolean'],
            'featured_rank' => ['nullable', 'integer', 'min:0'],
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

    private function uniqueCategorySlug(string $name, ?ArticleCategory $ignore = null): string
    {
        $base = Str::slug($name) ?: Str::lower(Str::random(8));
        $slug = $base;
        $counter = 2;

        while (ArticleCategory::where('slug', $slug)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
