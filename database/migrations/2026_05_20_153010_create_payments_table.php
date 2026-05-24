<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('payment_gateway')->default('midtrans');
            $table->string('gateway_order_id')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('snap_token')->nullable();
            $table->string('redirect_url')->nullable();
            $table->string('transaction_id')->nullable()->index();
            $table->string('payment_type')->nullable();
            $table->enum('status', ['pending', 'paid', 'challenge', 'expire', 'cancel', 'deny', 'failure', 'refund'])->default('pending')->index();
            $table->json('raw_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
