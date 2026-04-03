<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicule extends Model
{
    protected $table = 'vehicules';

    protected $fillable = [
        'immatriculation',
        'marque',
        'modele',
        'couleur',
        'statut',
        'zones_autorisees',
        'last_lat',
        'last_lng',
    ];

    protected function casts(): array
    {
        return [
            'zones_autorisees' => 'array',
        ];
    }

    // Relation 1-1 : un véhicule a un seul conducteur
    public function conducteur(): HasOne
    {
        return $this->hasOne(Conducteur::class, 'vehicule_id');
    }

    // Toutes les positions GPS de ce véhicule
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'vehicule_id');
    }

    // Toutes les missions de ce véhicule
    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'vehicule_id');
    }

    // Toutes les alertes de ce véhicule
    public function alertes(): HasMany
    {
        return $this->hasMany(Alerte::class, 'vehicule_id');
    }

    // Mission active en cours
    public function missionActive(): HasOne
    {
        return $this->hasOne(Mission::class, 'vehicule_id')
                    ->whereIn('statut', ['active', 'en_attente']);
    }

    // Vérifie si le véhicule est dans ses zones autorisées
    public function estDansZoneAutorisee(float $lat, float $lng): bool
    {
        $zones = ZoneWilaya::whereIn('id', $this->zones_autorisees)->get();
        foreach ($zones as $zone) {
            if ($zone->contientPoint($lat, $lng)) return true;
        }
        return false;
    }
}