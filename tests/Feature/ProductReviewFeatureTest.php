<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductReviewFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_review_completed_order_once_and_review_is_public(): void
    {
        $data = $this->marketplaceFixture();

        Sanctum::actingAs($data['customer']);

        $this->postJson("/api/products/{$data['product']->slug}/reviews", [
            'order_id' => $data['order']->id,
            'rating' => 5,
            'comment' => 'Kopinya harum dan packaging aman.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.user.name', $data['customer']->name);

        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $data['product']->id,
            'order_id' => $data['order']->id,
            'user_id' => $data['customer']->id,
            'seller_id' => $data['seller']->id,
            'status' => 'published',
        ]);

        $this->getJson("/api/products/{$data['product']->slug}/reviews")
            ->assertOk()
            ->assertJsonPath('meta.avg_rating', 5)
            ->assertJsonPath('meta.reviews_count', 1)
            ->assertJsonPath('data.0.comment', 'Kopinya harum dan packaging aman.');

        $this->postJson("/api/products/{$data['product']->slug}/reviews", [
            'order_id' => $data['order']->id,
            'rating' => 4,
            'comment' => 'Review kedua harus ditolak.',
        ])->assertUnprocessable();
    }

    public function test_customer_cannot_review_before_order_completed_or_for_another_customer_order(): void
    {
        $data = $this->marketplaceFixture(orderStatus: 'paid', itemStatus: 'completed');

        Sanctum::actingAs($data['customer']);

        $this->postJson("/api/products/{$data['product']->slug}/reviews", [
            'order_id' => $data['order']->id,
            'rating' => 5,
            'comment' => 'Order ini belum completed.',
        ])->assertUnprocessable();

        $otherCustomer = User::factory()->create([
            'role_id' => $data['roles']['customer']->id,
            'status' => 'active',
        ]);
        $otherOrder = $this->completedOrder($otherCustomer, $data['product'], $data['seller']);

        $this->postJson("/api/products/{$data['product']->slug}/reviews", [
            'order_id' => $otherOrder->id,
            'rating' => 5,
            'comment' => 'Order ini milik customer lain.',
        ])->assertNotFound();
    }

    public function test_seller_can_reply_only_to_review_from_their_product(): void
    {
        $data = $this->marketplaceFixture();
        $otherSellerUser = User::factory()->create([
            'role_id' => $data['roles']['seller']->id,
            'status' => 'active',
        ]);
        $otherSeller = SellerProfile::create([
            'user_id' => $otherSellerUser->id,
            'store_name' => 'Roastery Lain',
            'slug' => 'roastery-lain',
            'status' => 'active',
        ]);

        $review = ProductReview::create([
            'product_id' => $data['product']->id,
            'order_id' => $data['order']->id,
            'user_id' => $data['customer']->id,
            'seller_id' => $data['seller']->id,
            'rating' => 4,
            'comment' => 'Rasa cokelatnya enak sekali.',
            'status' => 'published',
        ]);

        Sanctum::actingAs($otherSellerUser);
        $this->postJson("/api/seller/reviews/{$review->id}/reply", [
            'seller_reply' => 'Balasan seller lain.',
        ])->assertNotFound();

        Sanctum::actingAs($data['sellerUser']);
        $this->postJson("/api/seller/reviews/{$review->id}/reply", [
            'seller_reply' => 'Terima kasih sudah mencoba kopi kami.',
        ])
            ->assertOk()
            ->assertJsonPath('data.seller_reply', 'Terima kasih sudah mencoba kopi kami.');

        $this->assertDatabaseHas('product_reviews', [
            'id' => $review->id,
            'seller_id' => $data['seller']->id,
            'seller_reply' => 'Terima kasih sudah mencoba kopi kami.',
        ]);
        $this->assertSame($otherSeller->id, $otherSellerUser->sellerProfile->id);
    }

    private function marketplaceFixture(string $orderStatus = 'completed', string $itemStatus = 'completed'): array
    {
        $roles = [
            'seller' => Role::create(['name' => 'seller']),
            'customer' => Role::create(['name' => 'customer']),
        ];
        $sellerUser = User::factory()->create([
            'role_id' => $roles['seller']->id,
            'status' => 'active',
        ]);
        $customer = User::factory()->create([
            'role_id' => $roles['customer']->id,
            'status' => 'active',
        ]);
        $seller = SellerProfile::create([
            'user_id' => $sellerUser->id,
            'store_name' => 'Test Roastery',
            'slug' => 'test-roastery',
            'status' => 'active',
        ]);
        $category = Category::create(['name' => 'Arabica', 'slug' => 'arabica']);
        $product = Product::create([
            'category_id' => $category->id,
            'seller_id' => $seller->id,
            'name' => 'Kopi Review Test',
            'slug' => 'kopi-review-test',
            'description' => 'Kopi untuk test review produk.',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
        ]);
        $product->variants()->create([
            'weight_grams' => 250,
            'grind_size' => 'Medium',
            'price' => 50000,
            'stock' => 7,
        ]);
        $order = $this->completedOrder($customer, $product, $seller, $orderStatus, $itemStatus);

        return compact('roles', 'sellerUser', 'customer', 'seller', 'category', 'product', 'order');
    }

    private function completedOrder(
        User $customer,
        Product $product,
        SellerProfile $seller,
        string $orderStatus = 'completed',
        string $itemStatus = 'completed',
    ): Order {
        $variant = $product->variants()->first()
            ?: $product->variants()->create([
                'weight_grams' => 250,
                'grind_size' => 'Medium',
                'price' => 50000,
                'stock' => 7,
            ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'KOPI-TEST-'.uniqid(),
            'total_amount' => 100000,
            'status' => $orderStatus,
            'customer_name' => $customer->name,
            'customer_phone' => '081234567890',
            'shipping_address' => 'Jl. Test',
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'seller_id' => $seller->id,
            'product_name' => $product->name,
            'variant_label' => $variant->label,
            'weight_grams' => $variant->weight_grams,
            'grind_size' => $variant->grind_size,
            'price' => 50000,
            'quantity' => 2,
            'subtotal' => 100000,
            'status' => $itemStatus,
        ]);

        return $order;
    }
}
