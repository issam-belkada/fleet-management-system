<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicule;
use App\Models\Position;
use App\Events\VehiclePositionUpdated;
use Illuminate\Support\Facades\Log;

class SimulateVehicleMovement extends Command
{
    // La signature pour appeler la commande : php artisan fleet:simulate {id}
    protected $signature = 'fleet:simulate {id}';
    protected $description = 'Simule le mouvement en temps réel d\'un véhicule via Reverb';

    public function handle()
    {
        $id = $this->argument('id');
        // On charge le véhicule avec ses relations pour que l'événement ait tout ce qu'il faut
        $vehicule = Vehicule::with(['conducteur', 'missionActive'])->find($id);

        if (!$vehicule) {
            $this->error("❌ Véhicule #$id introuvable dans la base de données !");
            return;
        }

        $this->info("🚀 Début de la simulation pour : {$vehicule->immatriculation}");
        $this->info("📡 En attente de diffusion sur Reverb (vérifie ton dashboard React)...");

        // Coordonnées de départ (Alger par défaut ou les dernières du véhicule)
        $lat = (float) ($vehicule->last_lat ?: 36.7538);
        $lng = (float) ($vehicule->last_lng ?: 3.0588);

        for ($i = 1; $i <= 30; $i++) {
            // Simulation d'un déplacement réaliste
            $lat += (rand(-5, 5) / 10000); 
            $lng += (rand(10, 30) / 10000); // Avance vers l'Est

            try {
                // 1. Mise à jour du véhicule en DB
                $vehicule->update([
                    'last_lat' => $lat,
                    'last_lng' => $lng,
                ]);

                // 2. Création de l'entrée dans l'historique des positions
                Position::create([
                    'vehicule_id' => $vehicule->id,
                    'latitude'    => $lat,
                    'longitude'   => $lng,
                    'vitesse'     => rand(40, 75),
                    'mission_id'  => $vehicule->missionActive?->id,
                ]);

                // 3. DIFFUSION REVERB (C'est ici que la magie opère pour React)
                broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

                $this->line("<info>[Point $i/30]</info> Position: $lat, $lng | <comment>Diffusé</comment>");

            } catch (\Exception $e) {
                $this->error("Erreur lors de la simulation : " . $e->getMessage());
                Log::error("Simulation Error: " . $e->getMessage());
            }

            // Pause de 2 secondes entre chaque mouvement pour l'animation
            sleep(2);
        }

        $this->info("✅ Simulation terminée avec succès.");
    }
}