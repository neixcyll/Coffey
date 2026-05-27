<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use App\Services\AffiliateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContentLayerTest extends TestCase
{
    use RefreshDatabase;

    public function test_affiliate_article_requires_admin_approval_and_tracks_product_clicks(): void
    {
        $adminRole = Role::create(['name' => 'admin']);
        $sellerRole = Role::create(['name' => 'seller']);
        $customerRole = Role::create(['name' => 'customer']);

        $admin = User::factory()->create(['role_id' => $adminRole->id, 'status' => 'active']);
        $sellerUser = User::factory()->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        $affiliateUser = User::factory()->create(['role_id' => $customerRole->id, 'status' => 'active']);

        $seller = SellerProfile::create([
            'user_id' => $sellerUser->id,
            'store_name' => 'Test Roastery',
            'slug' => 'test-roastery',
            'status' => 'active',
        ]);

        $productCategory = Category::create(['name' => 'Arabica', 'slug' => 'arabica']);
        $product = Product::create([
            'category_id' => $productCategory->id,
            'seller_id' => $seller->id,
            'name' => 'Grinder Test',
            'slug' => 'grinder-test',
            'description' => 'Grinder untuk test review',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
        ]);
        $product->variants()->create([
            'weight_grams' => 500,
            'grind_size' => 'Medium',
            'price' => 750000,
            'stock' => 5,
        ]);

        app(AffiliateService::class)->registerProfile($affiliateUser, [
            'affiliate_name' => 'Creator Test',
        ]);

        $articleCategory = ArticleCategory::where('slug', 'review')->firstOrFail();

        Sanctum::actingAs($affiliateUser);
        $createResponse = $this->postJson('/api/affiliate/content/articles', [
            'article_category_id' => $articleCategory->id,
            'title' => 'Review Grinder Test untuk Pemula',
            'excerpt' => 'Review singkat grinder untuk seduhan manual.',
            'content' => "Grinder ini cocok untuk pemula.\n\nHasil gilingnya cukup konsisten.",
            'status' => 'pending',
            'recommendations' => [
                ['product_id' => $product->id],
            ],
        ])->assertCreated();

        $articleId = $createResponse->json('data.id');
        $article = Article::findOrFail($articleId);
        $this->assertSame('pending', $article->status);
        $this->getJson("/api/articles/{$article->slug}")->assertNotFound();

        Sanctum::actingAs($admin);
        $this->postJson("/api/admin/content/articles/{$article->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $article->refresh();
        $publicResponse = $this->getJson("/api/articles/{$article->slug}")
            ->assertOk()
            ->assertJsonPath('data.recommended_products.0.product_id', $product->id);

        $articleProductId = $publicResponse->json('data.recommended_products.0.id');

        $this->postJson("/api/articles/{$article->slug}/clicks", [
            'article_product_id' => $articleProductId,
            'landing_url' => "https://example.test/blog/{$article->slug}",
        ])
            ->assertCreated()
            ->assertJsonPath('data.internal', true);

        $this->assertDatabaseHas('article_clicks', [
            'article_id' => $article->id,
            'product_id' => $product->id,
        ]);
        $this->assertDatabaseHas('affiliate_clicks', [
            'product_id' => $product->id,
        ]);
    }
}
