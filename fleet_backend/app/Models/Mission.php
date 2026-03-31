<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class Mission extends Model
{
    protected $table = 'missions';

    protected $fillable = [
        'conducteur_id',
        'vehicule_id',
        'cree_par',
        'nom',
        'description',
        'statut',
        'phase',
        'zone_lat',
        'zone_lng',
        'zone_rayon_m',
        'wilaya_destination',
        'date_debut',
        'date_fin',
    ];

    protected function casts(): array
    {
        return [
            'zone_lat'    => 'float',
            'zone_lng'    => 'float',
            'date_debut'  => 'datetime',
            'date_fin'    => 'datetime',
        ];
    }

    // Relations BelongsTo
    public function conducteur(): BelongsTo
    {
        return $this->belongsTo(Conducteur::class, 'conducteur_id');
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    // Positions enregistrées pendant cette mission
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'mission_id');
    }

    // Alertes déclenchées pendant cette mission
    public function alertes(): HasMany
    {
        return $this->hasMany(Alerte::class, 'mission_id');
    }

    // Durée totale en minutes
    public function getDureeMinutesAttribute(): ?int
    {
        if (!$this->date_debut || !$this->date_fin) return null;
        return $this->date_debut->diffInMinutes($this->date_fin);
    }

    // Vérifie si une position est dans la zone d'arrivée
    public function estDansZone(float $lat, float $lng): bool
    {
        $d = $this->haversine($lat, $lng, $this->zone_lat, $this->zone_lng);
        return $d <= $this->zone_rayon_m;
    }

    public function haversine(float $lat1, float $lng1,
                                float $lat2, float $lng2): float
    {
        $R = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat/2)**2 +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng/2)**2;
        return $R * 2 * atan2(sqrt($a), sqrt(1-$a));
    }
}
