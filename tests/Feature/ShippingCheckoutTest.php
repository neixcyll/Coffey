<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\ShippingRate;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use Tests\TestCase;

class ShippingCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_selects_database_shipping_rate_and_checkout_total_includes_shipping(): void
    {
        $sellerRole = Role::create(['name' => 'seller']);
        $customerRole = Role::create(['name' => 'customer']);
        $sellerUser = User::factory()->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        $customer = User::factory()->create(['role_id' => $customerRole->id, 'status' => 'active']);
        $seller = SellerProfile::create([
            'user_id' => $sellerUser->id,
            'store_name' => 'Test Roastery',
            'slug' => 'test-roastery',
            'origin_city' => 'Bandung',
            'status' => 'active',
        ]);
        $category = Category::create(['name' => 'Arabica', 'slug' => 'arabica']);
        $product = Product::create([
            'category_id' => $category->id,
            'seller_id' => $seller->id,
            'name' => 'Kopi Test Ongkir',
            'slug' => 'kopi-test-ongkir',
            'description' => 'Kopi untuk test ongkir.',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
        ]);
        $variant = $product->variants()->create([
            'weight_grams' => 250,
            'grind_size' => 'Medium',
            'price' => 50000,
            'stock' => 10,
        ]);
        $rate = ShippingRate::create([
            'origin_city' => 'Bandung',
            'destination_city' => 'Jakarta',
            'courier' => 'JNE',
            'service' => 'REG',
            'cost' => 18000,
            'estimated_days' => '2-3 hari',
        ]);
        $cart = Cart::create(['user_id' => $customer->id]);
        $cart->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $this->mock(MidtransService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('createSnapTransaction')
                ->once()
                ->withArgs(fn ($order) => (float) $order->total_amount === 118000.0)
                ->andReturn((object) ['token' => 'snap-test-token', 'redirect_url' => 'https://example.test/snap']);
            $mock->shouldReceive('clientKey')->once()->andReturn('client-key');
            $mock->shouldReceive('snapScriptUrl')->once()->andReturn('https://example.test/snap.js');
        });

        Sanctum::actingAs($customer);

        $this->getJson('/api/shipping-rates?destination_city=jakarta')
            ->assertOk()
            ->assertJsonPath('data.origin_city', 'Bandung')
            ->assertJsonPath('data.rates.0.id', $rate->id);

        $this->postJson('/api/checkout', [
            'customer_name' => 'Customer Test',
            'customer_phone' => '081234567890',
            'shipping_address' => 'Jl. Test No. 1',
            'destination_city' => 'Jakarta',
            'shipping_rate_id' => $rate->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.subtotal_amount', '100000.00')
            ->assertJsonPath('data.shipping_cost', '18000.00')
            ->assertJsonPath('data.total_amount', '118000.00')
            ->assertJsonPath('data.courier', 'JNE')
            ->assertJsonPath('data.shipping_service', 'REG');

        $this->assertDatabaseHas('orders', [
            'subtotal_amount' => 100000,
            'shipping_cost' => 18000,
            'total_amount' => 118000,
            'origin_city' => 'Bandung',
            'destination_city' => 'Jakarta',
        ]);
        $this->assertDatabaseHas('payments', ['amount' => 118000]);
    }

    public function test_shipping_lookup_returns_requested_unavailable_message(): void
    {
        $sellerRole = Role::create(['name' => 'seller']);
        $customerRole = Role::create(['name' => 'customer']);
        $sellerUser = User::factory()->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        $customer = User::factory()->create(['role_id' => $customerRole->id, 'status' => 'active']);
        $seller = SellerProfile::create([
            'user_id' => $sellerUser->id,
            'store_name' => 'Test Roastery',
            'slug' => 'test-roastery',
            'origin_city' => 'Bandung',
            'status' => 'active',
        ]);
        $category = Category::create(['name' => 'Arabica', 'slug' => 'arabica']);
        $product = Product::create([
            'category_id' => $category->id,
            'seller_id' => $seller->id,
            'name' => 'Kopi Test Ongkir Kosong',
            'slug' => 'kopi-test-ongkir-kosong',
            'description' => 'Kopi untuk test ongkir kosong.',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
        ]);
        $variant = $product->variants()->create([
            'weight_grams' => 250,
            'grind_size' => 'Medium',
            'price' => 50000,
            'stock' => 10,
        ]);
        $cart = Cart::create(['user_id' => $customer->id]);
        $cart->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        Sanctum::actingAs($customer);

        $this->getJson('/api/shipping-rates?destination_city=Semarang')
            ->assertOk()
            ->assertJsonPath('message', 'Ongkir untuk kota tujuan ini belum tersedia.')
            ->assertJsonCount(0, 'data.rates');
    }
}
