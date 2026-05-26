<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        foreach (['Review', 'Brewing Guide', 'Comparison', 'Beans', 'Equipment', 'Coffee Setup', 'Deals'] as $index => $name) {
            DB::table('article_categories')->insert([
                'name' => $name,
                'slug' => Str::slug($name),
                'sort_order' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::create('creator_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('username')->unique();
            $table->string('display_name');
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable();
            $table->string('website_url')->nullable();
            $table->json('social_links')->nullable();
            $table->string('status', 30)->default('active')->index();
            $table->timestamps();
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_category_id')->constrained()->restrictOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('author_type', 30)->index();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('featured_image')->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('featured_rank')->default(0);
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['author_id', 'author_type', 'status']);
        });

        Schema::create('article_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('custom_title')->nullable();
            $table->text('custom_description')->nullable();
            $table->string('external_platform')->nullable();
            $table->string('external_url', 2000)->nullable();
            $table->string('external_price_label')->nullable();
            $table->string('external_image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['article_id', 'sort_order']);
            $table->index(['product_id', 'article_id']);
        });

        Schema::create('article_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('article_product_id')->nullable()->constrained('article_product')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('affiliate_id')->nullable()->constrained('affiliate_profiles')->nullOnDelete();
            $table->foreignId('affiliate_click_id')->nullable()->constrained('affiliate_clicks')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('referrer')->nullable();
            $table->string('target_url', 2000)->nullable();
            $table->string('external_platform')->nullable();
            $table->timestamp('clicked_at')->nullable()->index();
            $table->timestamps();

            $table->index(['article_id', 'clicked_at']);
            $table->index(['affiliate_id', 'clicked_at']);
        });

        Schema::create('article_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_hash', 80)->nullable()->index();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('referrer')->nullable();
            $table->timestamp('viewed_at')->nullable()->index();
            $table->timestamps();

            $table->index(['article_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_views');
        Schema::dropIfExists('article_clicks');
        Schema::dropIfExists('article_product');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('creator_profiles');
        Schema::dropIfExists('article_categories');
    }
};
