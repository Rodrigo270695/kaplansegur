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
        Schema::create('unit_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['unit_id', 'zone_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_zones');
    }
};
