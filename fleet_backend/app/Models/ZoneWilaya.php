<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ZoneWilaya extends Model
{
    protected $table = 'zones_wilayas';

    public $timestamps = false;
    // Seulement created_at, pas updated_at

    protected $fillable = [
        'nom',
        'code_wilaya',
        'polygone',
    ];

    protected function casts(): array
    {
        return [
            'polygone'     => 'array',
            'created_at'   => 'datetime',
        ];
    }

    // Vérifie si un point [lat, lng] est dans cette wilaya
    public function contientPoint(float $lat, float $lng): bool
    {
        $coords = $this->polygone['coordinates'][0] ?? [];
        return $this->pointDansPolygone($lat, $lng, $coords);
    }

    private function pointDansPolygone(float $lat, float $lng, array $polygon): bool
    {
        $inside = false;
        $n = count($polygon);
        $j = $n - 1;
        for ($i = 0; $i < $n; $i++) {
            $xi = $polygon[$i][0]; $yi = $polygon[$i][1];
            $xj = $polygon[$j][0]; $yj = $polygon[$j][1];
            if ((($yi > $lng) !== ($yj > $lng)) &&
                ($lat < ($xj - $xi) * ($lng - $yi) / ($yj - $yi) + $xi)) {
                $inside = !$inside;
            }
            $j = $i;
        }
        return $inside;
    }
}
