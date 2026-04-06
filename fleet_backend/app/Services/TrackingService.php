<?php

namespace App\Services;

use App\Models\Position;
use App\Models\Mission;
use App\Models\Alerte;

class TrackingService
{
    // Coordonnées CETIC SPA (Point de référence fixe)
    private float $latCetic = 36.727274;
    private float $lngCetic = 3.185811;

    /**
     * Analyse une nouvelle position GPS par rapport à la mission.
     */
    public function analyserComportement(Position $current, Mission $mission)
    {
        // On n'analyse le comportement que si le véhicule est en mouvement (Aller ou Retour)
        if (!in_array($mission->phase, ['en_route', 'en_retour'])) {
            return;
        }

        $resultats = [
            'eloignement' => $this->verifieProgression($current, $mission),
            'deviation'   => $this->verifieDeviation($current, $mission),
            'immobilité'  => $this->verifieImmobilite($mission)
        ];

        foreach ($resultats as $type => $infraction) {
            if ($infraction) {
                $this->declencherAlerte($current, $mission, $type);
            }
        }
    }

    /**
     * PILLIER 1 : PROGRESSION
     * Vérifie si le véhicule s'éloigne de sa destination actuelle.
     */
    private function verifieProgression(Position $current, Mission $mission): bool
    {
        $historique = $mission->positions()->orderByDesc('created_at')->skip(5)->first();
        if (!$historique) return false;

        if ($mission->phase === 'en_route') {
            // ALLER : Doit se rapprocher de la zone de mission
            return $this->sEloigneDe($current, $historique, $mission->zone_lat, $mission->zone_lng, $mission);
        }

        if ($mission->phase === 'en_retour') {
            // RETOUR : Doit se rapprocher de CETIC SPA
            return $this->sEloigneDe($current, $historique, $this->latCetic, $this->lngCetic, $mission);
        }

        return false;
    }

    /**
     * Helper pour calculer si la distance à une cible augmente.
     */
    private function sEloigneDe(Position $current, Position $old, float $targetLat, float $targetLng, Mission $mission): bool
    {
        $dNow = $mission->haversine($current->latitude, $current->longitude, $targetLat, $targetLng);
        $dOld = $mission->haversine($old->latitude, $old->longitude, $targetLat, $targetLng);

        // Alerte si on s'éloigne de plus de 1000m par rapport à l'historique
        return $dNow > ($dOld + 1000);
    }

    /**
     * PILLIER 2 : DÉVIATION LATÉRALE
     * Calcule la distance entre la position actuelle et le segment (CETIC <-> Mission).
     */
    private function verifieDeviation(Position $current, Mission $mission): bool
    {
        $distanceLigne = $this->calculerDistancePointLigne(
            $current->latitude, $current->longitude,
            $this->latCetic, $this->lngCetic,
            $mission->zone_lat, $mission->zone_lng
        );

        // Seuil de tolérance : 10km (ajustable selon tes besoins)
        return $distanceLigne > 10000;
    }

    /**
     * PILLIER 3 : IMMOBILITÉ
     * Vérifie si le véhicule a parcouru moins de 50m sur les 10 derniers relevés.
     */
    private function verifieImmobilite(Mission $mission): bool
    {
        $recentes = $mission->positions()->orderByDesc('created_at')->take(10)->get();
        if ($recentes->count() < 10) return false;

        $mouvementTotal = 0;
        for ($i = 0; $i < $recentes->count() - 1; $i++) {
            $mouvementTotal += $mission->haversine(
                $recentes[$i]->latitude, $recentes[$i]->longitude,
                $recentes[$i+1]->latitude, $recentes[$i+1]->longitude
            );
        }

        return $mouvementTotal < 50;
    }

    /**
     * Calcul mathématique de la distance perpendiculaire à une droite.
     */
    private function calculerDistancePointLigne($latP, $lngP, $latA, $lngA, $latB, $lngB): float
    {
        $x = $latP; $y = $lngP;
        $x1 = $latA; $y1 = $lngA;
        $x2 = $latB; $y2 = $lngB;

        $A = $x - $x1; $B = $y - $y1;
        $C = $x2 - $x1; $D = $y2 - $y1;

        $dot = $A * $C + $B * $D;
        $len_sq = $C * $C + $D * $D;
        $param = ($len_sq != 0) ? $dot / $len_sq : -1;

        if ($param < 0) { $xx = $x1; $yy = $y1; }
        elseif ($param > 1) { $xx = $x2; $yy = $y2; }
        else { $xx = $x1 + $param * $C; $yy = $y1 + $param * $D; }

        $dx = $x - $xx; $dy = $y - $yy;
        return sqrt($dx * $dx + $dy * $dy) * 111000;
    }


        private function declencherAlerte(Position $current, Mission $mission, string $type)
        {
            $typeEnum = 'sortie_zone_mission';
            $nouveauMessage = "Comportement anormal : " . ucfirst($type);

            $alerteExistante = Alerte::where('mission_id', $mission->id)
                ->where('type_alerte', $typeEnum)
                ->where('acquittee', false)
                ->latest()
                ->first();


            if (!$alerteExistante ||
                $alerteExistante->created_at->diffInMinutes(now()) >= 30 ||
                $alerteExistante->message !== $nouveauMessage) {

                Alerte::create([
                    'vehicule_id' => $current->vehicule_id,
                    'mission_id'  => $mission->id,
                    'type_alerte' => $typeEnum,
                    'latitude'    => $current->latitude,
                    'longitude'   => $current->longitude,
                    'message'     => $nouveauMessage,
                    'acquittee'   => false,
                ]);

            } else {
                // 3. Sinon, on met à jour la position et le timestamp pour le temps réel
                $alerteExistante->update([
                    'latitude'   => $current->latitude,
                    'longitude'  => $current->longitude,
                    'updated_at' => now(),
                ]);
            }
        }
}
