<?php

namespace Tests\Feature;

use App\Models\BrewingMethod;
use App\Models\Category;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SellerProductSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_product_supports_multiple_brewing_methods_variants_and_duplicate_name_validation(): void
    {
        $sellerRole = Role::create(['name' => 'seller']);
        $sellerUser = User::factory()->create(['role_id' => $sellerRole->id, 'status' => 'active']);
        $seller = SellerProfile::create([
            'user_id' => $sellerUser->id,
            'store_name' => 'Test Roastery',
            'slug' => 'test-roastery',
            'status' => 'active',
        ]);
        $category = Category::create(['name' => 'Arabica', 'slug' => 'arabica']);
        $brewingMethodIds = BrewingMethod::query()->limit(2)->pluck('id')->all();

        Sanctum::actingAs($sellerUser);

        $payload = [
            'category_id' => $category->id,
            'name' => 'Kopi Variant Test',
            'description' => 'Kopi dengan beberapa brewing dan variant.',
            'roast_level' => 'medium',
            'origin' => 'Bandung',
            'brewing_methods' => $brewingMethodIds,
            'variants' => [
                ['weight_grams' => 100, 'grind_size' => 'Medium', 'price' => 35000, 'stock' => 10],
                ['weight_grams' => 250, 'grind_size' => 'Fine', 'price' => 78000, 'stock' => 7],
            ],
        ];

        $this->postJson('/api/seller/products', $payload)
            ->assertCreated()
            ->assertJsonCount(2, 'data.brewing_methods')
            ->assertJsonCount(2, 'data.variants')
            ->assertJsonPath('data.stock', 17);

        $this->assertDatabaseHas('products', [
            'seller_id' => $seller->id,
            'name' => 'Kopi Variant Test',
        ]);
        $this->assertDatabaseHas('product_variants', [
            'weight_grams' => 250,
            'grind_size' => 'Fine',
            'stock' => 7,
        ]);

        $this->postJson('/api/seller/products', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name')
            ->assertJsonPath('errors.name.0', 'Produk dengan nama tersebut sudah ada.');
    }
}
