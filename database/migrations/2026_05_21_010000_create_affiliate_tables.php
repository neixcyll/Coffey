<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('code', 30)->unique();
            $table->decimal('commission_rate', 5, 2)->default(5);
            $table->string('status', 30)->default('active')->index();
            $table->timestamps();
        });

        Schema::create('affiliate_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_hash', 80)->nullable()->index();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('landing_url')->nullable();
            $table->timestamp('clicked_at')->nullable()->index();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'clicked_at']);
        });

        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained('seller_profiles')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('status', 30)->default('pending')->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_profile_id', 'status']);
            $table->index(['order_id', 'status']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('affiliate_profile_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->foreignId('affiliate_click_id')->nullable()->after('affiliate_profile_id')->constrained('affiliate_clicks')->nullOnDelete();
            $table->string('affiliate_code', 30)->nullable()->after('affiliate_click_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['affiliate_profile_id']);
            $table->dropForeign(['affiliate_click_id']);
            $table->dropColumn(['affiliate_profile_id', 'affiliate_click_id', 'affiliate_code']);
        });

        Schema::dropIfExists('affiliate_commissions');
        Schema::dropIfExists('affiliate_clicks');
        Schema::dropIfExists('affiliate_profiles');
    }
};
