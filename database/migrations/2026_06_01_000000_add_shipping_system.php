<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->string('origin_city');
            $table->string('destination_city');
            $table->string('courier', 100);
            $table->string('service', 100);
            $table->decimal('cost', 12, 2);
            $table->string('estimated_days', 100);
            $table->timestamps();

            $table->index(['origin_city', 'destination_city']);
            $table->unique(['origin_city', 'destination_city', 'courier', 'service'], 'shipping_rates_route_service_unique');
        });

        Schema::table('seller_profiles', function (Blueprint $table) {
            $table->string('origin_city')->nullable()->after('address');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('shipping_rate_id')->nullable()->after('order_number')->constrained('shipping_rates')->nullOnDelete();
            $table->decimal('subtotal_amount', 12, 2)->default(0)->after('shipping_rate_id');
            $table->string('courier', 100)->nullable()->after('shipping_address');
            $table->string('shipping_service', 100)->nullable()->after('courier');
            $table->decimal('shipping_cost', 12, 2)->default(0)->after('shipping_service');
            $table->string('shipping_estimated_days', 100)->nullable()->after('shipping_cost');
            $table->string('origin_city')->nullable()->after('shipping_estimated_days');
            $table->string('destination_city')->nullable()->after('origin_city');
        });

        DB::table('orders')->update(['subtotal_amount' => DB::raw('total_amount')]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_rate_id');
            $table->dropColumn([
                'subtotal_amount',
                'courier',
                'shipping_service',
                'shipping_cost',
                'shipping_estimated_days',
                'origin_city',
                'destination_city',
            ]);
        });

        Schema::table('seller_profiles', function (Blueprint $table) {
            $table->dropColumn('origin_city');
        });

        Schema::dropIfExists('shipping_rates');
    }
};
