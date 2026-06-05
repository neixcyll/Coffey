<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderStatusWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_order_status_moves_forward_one_step_and_notifies_customer(): void
    {
        $data = $this->orderFixture('pending');

        Sanctum::actingAs($data['sellerUser']);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.seller_status', 'processing')
            ->assertJsonPath('data.next_status', 'shipped');

        $this->assertDatabaseMissing('notifications', [
            'order_id' => $data['order']->id,
        ]);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'shipped'])
            ->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.seller_status', 'shipped')
            ->assertJsonPath('data.next_status', 'completed');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $data['customer']->id,
            'order_id' => $data['order']->id,
            'title' => 'Pesanan Dikirim',
            'type' => 'order_shipped',
            'is_read' => false,
        ]);

        Sanctum::actingAs($data['customer']);

        $notificationId = $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'order_shipped')
            ->json('data.0.id');

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.count', 1);

        $this->patchJson("/api/notifications/{$notificationId}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);

        Sanctum::actingAs($data['sellerUser']);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.seller_status', 'completed')
            ->assertJsonPath('data.next_status', null);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $data['customer']->id,
            'order_id' => $data['order']->id,
            'title' => 'Pesanan Selesai',
            'type' => 'order_completed',
            'is_read' => false,
        ]);
    }

    public function test_seller_order_status_rejects_backward_skip_completed_and_other_seller_updates(): void
    {
        $data = $this->orderFixture('shipped', 'shipped');

        Sanctum::actingAs($data['sellerUser']);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'processing'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Status order tidak dapat dikembalikan ke status sebelumnya.');

        $data['order']->items()->update(['status' => 'pending']);
        $data['order']->update(['status' => 'paid']);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'shipped'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Status order hanya dapat maju satu tahap dari pending ke processing.');

        $data['order']->items()->update(['status' => 'completed']);
        $data['order']->update(['status' => 'completed']);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'shipped'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Order yang sudah completed tidak dapat diubah lagi.');

        $otherSellerUser = User::factory()->create([
            'role_id' => $data['roles']['seller']->id,
            'status' => 'active',
        ]);
        SellerProfile::create([
            'user_id' => $otherSellerUser->id,
            'store_name' => 'Seller Lain',
            'slug' => 'seller-lain',
            'status' => 'active',
        ]);

        Sanctum::actingAs($otherSellerUser);

        $this->patchJson("/api/seller/orders/{$data['order']->id}/status", ['status' => 'processing'])
            ->assertNotFound();
    }

    private function orderFixture(string $itemStatus, string $orderStatus = 'paid'): array
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
            'name' => 'Kopi Workflow Test',
            'slug' => 'kopi-workflow-test',
            'description' => 'Kopi untuk test workflow status order.',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
        ]);
        $variant = $product->variants()->create([
            'weight_grams' => 250,
            'grind_size' => 'Medium',
            'price' => 50000,
            'stock' => 7,
        ]);
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'KOPI-WORKFLOW-'.uniqid(),
            'total_amount' => 100000,
            'status' => $orderStatus,
            'customer_name' => $customer->name,
            'customer_phone' => '081234567890',
            'shipping_address' => 'Jl. Workflow',
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

        return compact('roles', 'sellerUser', 'customer', 'seller', 'category', 'product', 'order');
    }
}
