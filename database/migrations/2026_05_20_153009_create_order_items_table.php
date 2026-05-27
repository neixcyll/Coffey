<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('seller_id')->constrained('seller_profiles')->cascadeOnDelete();
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->unsignedInteger('weight_grams')->nullable();
            $table->string('grind_size', 100)->nullable();
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('subtotal', 12, 2);
            $table->enum('status', ['pending', 'processing', 'shipped', 'completed', 'cancelled'])->default('pending')->index();
            $table->timestamps();

            $table->index(['seller_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
