<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicule;
use App\Models\Position;
use App\Events\VehiclePositionUpdated;

class SimulateReturnTrip extends Command
{
    // Signature unique : php artisan fleet:return {id}
    protected $signature = 'fleet:return {id}';
    protected $description = 'Simulation retour Médéa -> Alger (CETIC)';

    public function handle()
    {
        $id = $this->argument('id');
        $vehicule = Vehicule::with(['missionActive'])->find($id);

        if (!$vehicule) {
            $this->error("❌ Véhicule #$id introuvable !");
            return;
        }

        // --- INVERSION DES COORDONNÉES ---
        $startLat = 36.2936134; // Départ : Médéa
        $startLng = 2.7803650;
        $endLat   = 36.727274;  // Arrivée : Alger (CETIC SPA)
        $endLng   = 3.185811;

        $totalSteps = 600;

        $this->info("🔄 Simulation du trajet de RETOUR lancée...");
        $this->info("📍 Départ: Médéa | 🏁 Destination: Alger (CETIC)");

        for ($i = 0; $i <= $totalSteps; $i++) {
            // Interpolation pour remonter vers le Nord-Est
            $currentLat = $startLat + ($endLat - $startLat) * ($i / $totalSteps);
            $currentLng = $startLng + ($endLng - $startLng) * ($i / $totalSteps);

            // Micro-bruit GPS pour le réalisme
            $currentLat += (rand(-1, 1) / 1000000);
            $currentLng += (rand(-1, 1) / 1000000);

            try {
                $vehicule->update([
                    'last_lat' => $currentLat,
                    'last_lng' => $currentLng,
                ]);

                // Création de la position
                Position::create([
                    'vehicule_id' => $vehicule->id,
                    'latitude'    => $currentLat,
                    'longitude'   => $currentLng,
                    'vitesse'     => rand(70, 95),
                    'mission_id'  => $vehicule->missionActive?->id,
                ]);

                broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

                $progression = round(($i / $totalSteps) * 100, 1);
                $this->output->write("\r<info>🏠 Retour: {$progression}% | Lat: " . number_format($currentLat, 6) . " | Lng: " . number_format($currentLng, 6) . "</info>");

            } catch (\Exception $e) {
                $this->error("\n Erreur : " . $e->getMessage());
            }

            usleep(700000); // 0.7 seconde pour garder la fluidité
        }

        $this->info("\n\n✅ Le véhicule est de retour à Alger. Mission terminée.");
    }
}
