<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicule;
use App\Models\Position;
use App\Events\VehiclePositionUpdated;
use Illuminate\Support\Facades\Http;

class SimulateChlefTrip extends Command
{
    protected $signature = 'fleet:chlef {id}';
    protected $description = 'Simulation Haute Résolution Alger Centre -> Chlef via A1';

    public function handle()
    {
        $id = $this->argument('id');

        // CORRECTION : Charger avec la relation missionActive pour éviter le NULL
        $vehicule = Vehicule::with(['missionActive'])->find($id);

        if (!$vehicule) {
            $this->error("❌ Véhicule #$id introuvable !");
            return;
        }

        $startLat = $vehicule->last_lat;
        $startLng = $vehicule->last_lng;

        $start = "{$startLng},{$startLat}";

        $end = "1.325696,36.154816";

        $this->info("🌐 Récupération de l'itinéraire réel via OSRM...");

        $response = Http::get("http://router.project-osrm.org/route/v1/driving/$start;$end?overview=full&geometries=geojson");

        if (!$response->successful() || empty($response->json()['routes'])) {
            $this->error("Impossible de joindre le service OSRM ou trajet introuvable.");
            return;
        }

        $routeData = $response->json()['routes'][0]['geometry']['coordinates'];

        // 2. Interpolation pour atteindre ~4000 points
        $this->info("📈 Augmentation de la résolution (Objectif: 4000 points)...");
        $finalPath = $this->generateHighResPath($routeData, 4000);

        $this->info("🚀 Simulation lancée. Mission active : " . ($vehicule->missionActive?->id ?? 'AUCUNE'));
        $this->warn("⚡ Fréquence : 0.5s par point");

        foreach ($finalPath as $index => $point) {
            $currentLng = $point[0];
            $currentLat = $point[1];

            // CORRECTION : Rafraîchir la mission au premier tour pour être sûr qu'elle est là
            if ($index === 0) {
                $vehicule->load('missionActive');
            }

            // Mise à jour position véhicule
            $vehicule->update([
                'last_lat' => $currentLat,
                'last_lng' => $currentLng,
            ]);

            // Création de l'historique
            Position::create([
                'vehicule_id' => $vehicule->id,
                'latitude'    => $currentLat,
                'longitude'   => $currentLng,
                'vitesse'     => rand(95, 115),
                'mission_id'  => $vehicule->missionActive?->id, // Ne sera plus NULL si chargée
            ]);

            broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

            $progression = round(($index / count($finalPath)) * 100, 2);
            $missionStatus = $vehicule->missionActive ? "ID: " . $vehicule->missionActive->id : "NULL";
            $this->output->write("\r🚗 [{$progression}%] Lat: $currentLat | Lng: $currentLng | Mission: $missionStatus");

            usleep(500000); // 0.5 secondes
        }

        $this->info("\n\n✅ Arrivée à destination confirmée.");
    }

    private function generateHighResPath($points, $targetCount)
    {
        $highRes = [];
        $pointsCount = count($points);
        if ($pointsCount < 2) return $points;

        $segmentsPerPoint = ceil($targetCount / ($pointsCount - 1));

        for ($i = 0; $i < $pointsCount - 1; $i++) {
            $start = $points[$i];
            $end = $points[$i + 1];

            for ($j = 0; $j < $segmentsPerPoint; $j++) {
                if (count($highRes) >= $targetCount) break;
                $ratio = $j / $segmentsPerPoint;
                $highRes[] = [
                    $start[0] + ($end[0] - $start[0]) * $ratio,
                    $start[1] + ($end[1] - $start[1]) * $ratio
                ];
            }
        }
        // Ajouter le point final exact
        $highRes[] = end($points);
        return $highRes;
    }
}
