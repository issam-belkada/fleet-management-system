<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicule;
use App\Models\Position;
use App\Events\VehiclePositionUpdated;
use Illuminate\Support\Facades\Http;

class SimulateMedeaTrip extends Command
{
    protected $signature = 'fleet:medea {id}';
    protected $description = 'Simulation Alger -> Médéa avec détection de mission';

    public function handle()
    {
        $id = $this->argument('id');

        // 1. On charge le véhicule AVEC sa relation missionActive dès le départ
        $vehicule = Vehicule::with(['missionActive'])->find($id);

        if (!$vehicule) {
            $this->error("❌ Véhicule #$id introuvable !");
            return;
        }

        // Vérification immédiate pour le debug en console
        if (!$vehicule->missionActive) {
            $this->warn("⚠️ Attention : Aucune mission 'active' trouvée pour ce véhicule en base.");
        } else {
            $this->info("✅ Mission détectée : ID #" . $vehicule->missionActive->id);
        }

        $start = $vehicule->last_lng . "," . $vehicule->last_lat;
        $destLat = 36.717347;
$destLng = 4.043060;

$end = "{$destLng},{$destLat}";
        $response = Http::get("http://router.project-osrm.org/route/v1/driving/$start;$end?overview=full&geometries=geojson");
        $rawPoints = $response->json()['routes'][0]['geometry']['coordinates'];
        $finalPath = $this->generateHighResPath($rawPoints, 1000);

        foreach ($finalPath as $index => $point) {
            $lng = $point[0];
            $lat = $point[1];

            if ($index === 0) {
                $vehicule->load('missionActive');
            }

            $vehicule->update([
                'last_lat' => $lat,
                'last_lng' => $lng,
            ]);

            // 3. Utilisation de l'ID de la mission
            Position::create([
                'vehicule_id' => $vehicule->id,
                'latitude'    => $lat,
                'longitude'   => $lng,
                'vitesse'     => rand(60, 90),
                // On récupère l'ID via la relation chargée
                'mission_id'  => $vehicule->missionActive?->id,
            ]);

            broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

            $percent = round(($index / count($finalPath)) * 100, 1);
            $this->output->write("\r🚗 Simulation: {$percent}% | Mission ID: " . ($vehicule->missionActive?->id ?? 'NULL'));

            usleep(500000);
        }

        $this->info("\n\n✅ Terminé.");
    }

    private function generateHighResPath($points, $targetCount) {
        $highRes = [];
        $currentPointsCount = count($points);
        $stepsPerSegment = ceil($targetCount / ($currentPointsCount - 1));
        for ($i = 0; $i < $currentPointsCount - 1; $i++) {
            $start = $points[$i]; $end = $points[$i + 1];
            for ($j = 0; $j < $stepsPerSegment; $j++) {
                if (count($highRes) >= $targetCount) break;
                $ratio = $j / $stepsPerSegment;
                $highRes[] = [
                    $start[0] + ($end[0] - $start[0]) * $ratio,
                    $start[1] + ($end[1] - $start[1]) * $ratio
                ];
            }
        }
        return $highRes;
    }
}
