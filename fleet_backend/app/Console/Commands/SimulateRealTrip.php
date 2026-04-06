<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicule;
use App\Models\Position;
use App\Events\VehiclePositionUpdated;

class SimulateRealTrip extends Command
{
    // On change la signature pour ne pas avoir de conflit : php artisan fleet:trip {id}
    protected $signature = 'fleet:trip {id}';
    protected $description = 'Simulation haute résolution Alger -> Médéa';

    public function handle()
    {
        $id = $this->argument('id');
        $vehicule = Vehicule::with(['missionActive'])->find($id);

        if (!$vehicule) {
            $this->error("❌ Véhicule #$id introuvable !");
            return;
        }

        // --- COORDONNÉES RÉELLES ---
        $startLat = 36.7000000; // Alger (CETIC / Point de départ)
        $startLng = 3.2100000;
        $endLat   = 36.2936134; // Médéa (Destination)
        $endLng   = 2.7803650;

        // Nombre de points (plus c'est haut, plus c'est fluide)
        $totalSteps = 600;

        $this->info("🚀 Simulation du trajet réel lancée...");
        $this->info("📍 Départ: Alger | 🏁 Destination: Médéa");
        $this->warn("⚡ Fréquence : 1 point toutes les 0.7s");

        for ($i = 0; $i <= $totalSteps; $i++) {
            // Interpolation pour un mouvement fluide
            $currentLat = $startLat + ($endLat - $startLat) * ($i / $totalSteps);
            $currentLng = $startLng + ($endLng - $startLng) * ($i / $totalSteps);

            // Ajout d'un micro-bruit GPS pour le réalisme (évite la ligne mathématique parfaite)
            $currentLat += (rand(-1, 1) / 1000000);
            $currentLng += (rand(-1, 1) / 1000000);

            try {
                // 1. Mise à jour de l'état du véhicule
                $vehicule->update([
                    'last_lat' => $currentLat,
                    'last_lng' => $currentLng,
                ]);

                // 2. Création de la position (Déclenche le PositionObserver -> Alertes)
                Position::create([
                    'vehicule_id' => $vehicule->id,
                    'latitude'    => $currentLat,
                    'longitude'   => $currentLng,
                    'vitesse'     => rand(80, 105), // Vitesse de croisière
                    'mission_id'  => $vehicule->missionActive?->id,
                ]);

                // 3. Diffusion temps réel (Reverb)
                broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

                // Affichage propre en console
                $progression = round(($i / $totalSteps) * 100, 1);
                $this->output->write("\r<info>🚗 Trajet: {$progression}% | Lat: " . number_format($currentLat, 6) . " | Lng: " . number_format($currentLng, 6) . "</info>");

            } catch (\Exception $e) {
                $this->error("\n Erreur : " . $e->getMessage());
            }

            // Délai pour une fluidité maximale (700ms)
            usleep(700000);
        }

        $this->info("\n\n✅ Mission accomplie : Le véhicule est arrivé à Médéa.");
    }
}
