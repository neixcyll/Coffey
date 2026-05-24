<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = collect(['admin', 'seller', 'customer'])
            ->mapWithKeys(fn (string $name) => [$name => Role::firstOrCreate(['name' => $name])]);

        User::updateOrCreate(
            ['email' => 'admin@kopi.test'],
            [
                'role_id' => $roles['admin']->id,
                'name' => 'Admin Kopi',
                'password' => Hash::make('password'),
                'status' => 'active',
            ],
        );

        $sellerUser = User::updateOrCreate(
            ['email' => 'seller@kopi.test'],
            [
                'role_id' => $roles['seller']->id,
                'name' => 'Seller Kopi Nusantara',
                'password' => Hash::make('password'),
                'status' => 'active',
            ],
        );

        $customerUser = User::updateOrCreate(
            ['email' => 'customer@kopi.test'],
            [
                'role_id' => $roles['customer']->id,
                'name' => 'Customer Kopi',
                'password' => Hash::make('password'),
                'status' => 'active',
            ],
        );

        $seller = SellerProfile::updateOrCreate(
            ['user_id' => $sellerUser->id],
            [
                'store_name' => 'Kopi Nusantara Roastery',
                'slug' => 'kopi-nusantara-roastery',
                'phone' => '081234567890',
                'address' => 'Jl. Kopi No. 10, Bandung',
                'description' => 'Roastery kecil yang fokus pada kopi single origin Indonesia.',
                'status' => 'active',
            ],
        );

        $categories = collect([
            ['name' => 'Arabica', 'description' => 'Kopi arabica single origin dan specialty.'],
            ['name' => 'Robusta', 'description' => 'Kopi robusta dengan karakter kuat.'],
            ['name' => 'Blend', 'description' => 'Racikan kopi untuk espresso dan harian.'],
            ['name' => 'Espresso', 'description' => 'Kopi yang cocok untuk mesin espresso.'],
            ['name' => 'Drip Bag', 'description' => 'Kopi siap seduh dalam kemasan drip bag.'],
        ])->mapWithKeys(function (array $category) {
            $model = Category::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                $category + ['slug' => Str::slug($category['name'])],
            );

            return [$model->slug => $model];
        });

        $products = [
            [
                'category' => 'arabica',
                'name' => 'Arabika Gayo Wine Process',
                'description' => 'Biji kopi Gayo dengan aroma fermentasi lembut, body medium, dan aftertaste manis.',
                'price' => 95000,
                'stock' => 35,
                'weight' => 250,
                'roast_level' => 'medium',
                'origin' => 'Aceh Gayo',
                'brewing_method' => 'V60, Aeropress, Tubruk',
                'image' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
            ],
            [
                'category' => 'arabica',
                'name' => 'Toraja Sapan Washed',
                'description' => 'Kopi Toraja dengan acidity bersih, note rempah, dan sweetness cokelat.',
                'price' => 88000,
                'stock' => 42,
                'weight' => 250,
                'roast_level' => 'medium-dark',
                'origin' => 'Tana Toraja',
                'brewing_method' => 'French Press, V60, Espresso',
                'image' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
            ],
            [
                'category' => 'robusta',
                'name' => 'Robusta Temanggung Natural',
                'description' => 'Robusta dengan body tebal, crema kuat, dan rasa kacang panggang.',
                'price' => 62000,
                'stock' => 50,
                'weight' => 250,
                'roast_level' => 'dark',
                'origin' => 'Temanggung',
                'brewing_method' => 'Espresso, Moka Pot, Tubruk',
                'image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
            ],
            [
                'category' => 'blend',
                'name' => 'Espresso Blend Cokelat',
                'description' => 'Blend arabika dan robusta untuk espresso dengan rasa cokelat, kacang, dan body stabil.',
                'price' => 78000,
                'stock' => 60,
                'weight' => 250,
                'roast_level' => 'medium-dark',
                'origin' => 'Jawa Barat, Lampung',
                'brewing_method' => 'Espresso, Cappuccino, Moka Pot',
                'image' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
            ],
        ];

        foreach ($products as $product) {
            $model = Product::updateOrCreate(
                ['slug' => Str::slug($product['name'])],
                [
                    'category_id' => $categories[$product['category']]->id,
                    'seller_id' => $seller->id,
                    'name' => $product['name'],
                    'slug' => Str::slug($product['name']),
                    'description' => $product['description'],
                    'price' => $product['price'],
                    'stock' => $product['stock'],
                    'weight' => $product['weight'],
                    'roast_level' => $product['roast_level'],
                    'origin' => $product['origin'],
                    'brewing_method' => $product['brewing_method'],
                    'image' => $product['image'],
                    'status' => 'active',
                ],
            );

            ProductImage::updateOrCreate(
                ['product_id' => $model->id, 'path' => $product['image']],
                ['is_primary' => true, 'sort_order' => 0],
            );
        }
    }
}
