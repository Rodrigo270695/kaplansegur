<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('last_name')->after('name');
            $table->string('document_type')->after('last_name');
            $table->string('document_number')->after('document_type');
            $table->string('phone')->after('document_number');
            $table->string('role')->default('agent')->after('phone');

            $table->unique(['document_type', 'document_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['document_type', 'document_number']);
            $table->dropColumn([
                'last_name',
                'document_type',
                'document_number',
                'phone',
                'role',
            ]);
        });
    }
};
