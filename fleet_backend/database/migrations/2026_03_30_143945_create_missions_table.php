<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conducteur_id')
                  ->constrained('conducteurs')
                  ->restrictOnDelete();
            $table->foreignId('vehicule_id')
                  ->constrained('vehicules')
                  ->restrictOnDelete();
            $table->foreignId('cree_par')
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->string('nom', 150);
            $table->text('description')->nullable();
            $table->enum('statut', ['en_attente', 'active', 'cloturee'])
                  ->default('en_attente');
            $table->enum('phase', ['en_route', 'on_site','en_retour'])
                  ->default('en_route');
            $table->decimal('zone_lat', 10, 7)
                  ->comment('Latitude du centre du cercle d\'arrivée');
            $table->decimal('zone_lng', 10, 7)
                  ->comment('Longitude du centre du cercle d\'arrivée');
            $table->unsignedInteger('zone_rayon_m')
                  ->comment('Rayon admis en mètres ex: 500');
            $table->string('wilaya_destination', 100)
                  ->comment('Nom de la région cible hors zone habituelle');
            $table->timestamp('date_debut')->nullable()
                  ->comment('Rempli à l\'activation');
            $table->timestamp('date_fin')->nullable()
                  ->comment('Rempli à la clôture');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};
