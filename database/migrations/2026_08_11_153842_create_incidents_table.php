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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reason_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Fecha/hora y GPS los fija el sistema al crear el registro
            // (zona horaria America/Lima ya configurada en config/app.php).
            $table->dateTime('occurred_at');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('detail');
            $table->string('evidence')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
