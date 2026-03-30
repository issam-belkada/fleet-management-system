<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicule_id')
                  ->constrained('vehicules')
                  ->cascadeOnDelete();
            $table->foreignId('mission_id')
                  ->nullable()
                  ->constrained('missions')
                  ->nullOnDelete();
            $table->enum('type_alerte', [
                'sortie_zone_permanente',
                'sortie_zone_mission',
                'exces_vitesse',
            ]);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('message', 255)->nullable()
                  ->comment('ex: Vitesse détectée: 125 km/h');
            $table->boolean('acquittee')->default(false);
            $table->timestamp('acquittee_le')->nullable();
            $table->timestamps();

            $table->index(['vehicule_id', 'acquittee']);
            $table->index('mission_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};
