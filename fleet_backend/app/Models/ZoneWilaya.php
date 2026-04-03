<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZoneWilaya extends Model
{
    protected $table = 'zones_wilayas';

    // Désactive les timestamps standards car tu n'as que created_at
    public $timestamps = false;

    protected $fillable = [
        'nom',
        'code_wilaya',
        'polygone',
    ];

    protected $casts = [
        'polygone'   => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Vérifie si un point [lat, lng] est dans cette wilaya.
     * Note: Le GeoJSON stocke [lng, lat].
     */
    public function contientPoint(float $lat, float $lng): bool
    {
        $geometry = $this->polygone;

        if (!$geometry || !isset($geometry['coordinates'])) {
            return false;
        }

        // Comme c'est un MultiPolygon, on boucle sur chaque polygone
        foreach ($geometry['coordinates'] as $polygon) {
            // Dans un MultiPolygon, chaque polygone peut avoir des "trous" (rings)
            // Le premier ring [0] est toujours la bordure extérieure
            if ($this->pointDansPolygone($lat, $lng, $polygon[0])) {
                return true;
            }
        }

        return false;
    }

    private function pointDansPolygone(float $lat, float $lng, array $polygon): bool
    {
        $inside = false;
        $n = count($polygon);

        // Ray Casting Algorithm
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            // $polygon[$i][0] = Longitude, $polygon[$i][1] = Latitude
            $xi = $polygon[$i][0]; $yi = $polygon[$i][1];
            $xj = $polygon[$j][0]; $yj = $polygon[$j][1];

            // On compare $lng avec la Latitude (yi) et $lat avec la Longitude (xi)
            $intersect = (($yi > $lat) != ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}
