<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicule_id')
                  ->constrained('vehicules')
                  ->cascadeOnDelete();
            $table->foreignId('mission_id')
                  ->nullable()
                  ->constrained('missions')
                  ->nullOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedSmallInteger('vitesse')
                  ->nullable()
                  ->comment('Vitesse en km/h');
            $table->enum('phase', ['en_route', 'on_site'])
                  ->nullable()
                  ->comment('NULL si hors mission');
            $table->timestamp('created_at')
                  ->comment('Horodatage précis du tick GPS');

            // Index pour accélérer les requêtes fréquentes
            $table->index(['vehicule_id', 'created_at']);
            $table->index('mission_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
