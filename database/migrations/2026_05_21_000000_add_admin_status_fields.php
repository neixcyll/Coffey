<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status', 30)->default('active')->after('password')->index();
            }
        });

        Schema::table('seller_profiles', function (Blueprint $table) {
            $table->string('status', 30)->default('active')->change();
        });

        DB::table('seller_profiles')
            ->where('status', 'inactive')
            ->update(['status' => 'suspended']);

        Schema::table('payments', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
        });

        DB::table('payments')->where('status', 'expire')->update(['status' => 'expired']);
        DB::table('payments')->where('status', 'cancel')->update(['status' => 'cancelled']);
        DB::table('payments')->whereIn('status', ['deny', 'failure', 'challenge'])->update(['status' => 'failed']);
        DB::table('payments')->where('status', 'refund')->update(['status' => 'refunded']);
    }

    public function down(): void
    {
        DB::table('payments')->where('status', 'expired')->update(['status' => 'expire']);
        DB::table('payments')->where('status', 'cancelled')->update(['status' => 'cancel']);
        DB::table('payments')->where('status', 'failed')->update(['status' => 'failure']);
        DB::table('payments')->where('status', 'refunded')->update(['status' => 'refund']);

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
