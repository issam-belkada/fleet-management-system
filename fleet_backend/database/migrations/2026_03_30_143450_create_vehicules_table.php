<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->string('immatriculation', 20)->unique();
            $table->string('marque', 50);
            $table->string('modele', 50);
            $table->string('couleur', 30);
            $table->enum('statut', ['assignee', 'non_assignee', 'en_maintenance'])
                  ->default('non_assignee');
            $table->json('zones_autorisees')
                  ->comment('IDs de zones_wilayas ex: [1,2,3,4]');
            $table->decimal('last_lat', 10, 7)->nullable();
            $table->decimal('last_lng', 10, 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicules');
    }
};
