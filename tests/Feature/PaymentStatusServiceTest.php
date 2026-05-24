<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use App\Services\AffiliateService;
use App\Services\MidtransService;
use App\Services\PaymentStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PaymentStatusServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_snap_success_callback_marks_order_paid_when_gateway_status_is_still_pending(): void
    {
        $sellerRole = Role::create(['name' => 'seller']);
        $customerRole = Role::create(['name' => 'customer']);
        $sellerUser = User::factory()->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        $customer = User::factory()->create(['role_id' => $customerRole->id, 'status' => 'active']);
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
            'name' => 'Kopi Test',
            'slug' => 'kopi-test',
            'description' => 'Kopi untuk test',
            'price' => 50000,
            'stock' => 7,
            'weight' => 250,
            'roast_level' => 'medium',
            'origin' => 'Bandung',
            'brewing_method' => 'espresso',
            'status' => 'active',
        ]);
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'KOPI-TEST-SNAP',
            'total_amount' => 100000,
            'status' => 'pending',
            'customer_name' => 'Customer Test',
            'customer_phone' => '081234567890',
            'shipping_address' => 'Jl. Test',
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'seller_id' => $seller->id,
            'product_name' => $product->name,
            'price' => 50000,
            'quantity' => 2,
            'subtotal' => 100000,
            'status' => 'pending',
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_gateway' => 'midtrans',
            'gateway_order_id' => $order->order_number,
            'amount' => 100000,
            'status' => 'pending',
        ]);

        $midtrans = Mockery::mock(MidtransService::class);
        $midtrans->shouldReceive('getTransactionStatus')->once()->andReturn([
            'order_id' => $order->order_number,
            'transaction_status' => 'pending',
            'status_code' => '201',
            'gross_amount' => '100000.00',
        ]);
        $midtrans->shouldReceive('verifySignature')->once()->andReturnTrue();

        $service = new PaymentStatusService($midtrans, app(AffiliateService::class));
        $service->syncFromGateway($payment, [
            'order_id' => $order->order_number,
            'transaction_id' => 'snap-transaction-1',
            'transaction_status' => 'settlement',
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'payment_type' => 'qris',
            'signature_key' => 'valid-signature',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
            'transaction_id' => 'snap-transaction-1',
            'payment_type' => 'qris',
        ]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
    }
}
