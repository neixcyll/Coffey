<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->string('affiliate_name')->nullable()->after('code');
            $table->string('phone', 30)->nullable()->after('affiliate_name');
            $table->string('payout_bank')->nullable()->after('phone');
            $table->string('payout_account_name')->nullable()->after('payout_bank');
            $table->string('payout_account_number')->nullable()->after('payout_account_name');
            $table->text('notes')->nullable()->after('payout_account_number');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'affiliate_name',
                'phone',
                'payout_bank',
                'payout_account_name',
                'payout_account_number',
                'notes',
            ]);
        });
    }
};
