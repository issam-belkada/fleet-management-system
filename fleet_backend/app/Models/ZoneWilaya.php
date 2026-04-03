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

    // Structure MultiPolygon : coordinates[PolygonIndex][RingIndex][PointIndex]
    foreach ($geometry['coordinates'] as $polygon) {
        if (!isset($polygon[0]) || !is_array($polygon[0])) continue;

        // On teste le Ring extérieur (index 0)
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

    for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
        // VERIFICATION DE SECURITÉ : On s'assure que $polygon[$i] est bien un tableau
        if (!is_array($polygon[$i]) || !is_array($polygon[$j])) {
            continue;
        }

        // GeoJSON stocke [longitude, latitude]
        $xi = $polygon[$i][0]; // Longitude
        $yi = $polygon[$i][1]; // Latitude

        $xj = $polygon[$j][0]; // Longitude
        $yj = $polygon[$j][1]; // Latitude

        // Algorithme Ray Casting
        // On vérifie si le point (lat, lng) intersecte le segment
        $intersect = (($yi > $lat) != ($yj > $lat))
            && ($lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi);

        if ($intersect) {
            $inside = !$inside;
        }
    }

    return $inside;
}
}
