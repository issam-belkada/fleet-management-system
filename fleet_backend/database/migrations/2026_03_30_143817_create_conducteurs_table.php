<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('conducteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicule_id')
                  ->unique()
                  ->constrained('vehicules')
                  ->cascadeOnUpdate()
                  ->restrictOnDelete();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('telephone', 20);
            $table->string('numero_permis', 50)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conducteurs');
    }
};
