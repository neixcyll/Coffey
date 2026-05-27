<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('seller_id')->constrained('seller_profiles')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('roast_level')->index();
            $table->string('origin')->index();
            $table->string('image')->nullable();
            $table->timestamps();

            $table->index('category_id');
            $table->index('seller_id');
            $table->unique(['seller_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
