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
                    ->where('statut', 'active');
    }


    // Vérifie si le véhicule est dans ses zones autorisées
    public function estDansZoneAutorisee(float $lat, float $lng): bool
{
    $zonesAutorisees = $this->zones_autorisees;

    // 1. Si c'est une chaîne JSON "[1,2,3,4]", on la décode en tableau PHP
    if (is_string($zonesAutorisees)) {
        $zonesAutorisees = json_decode($zonesAutorisees, true);
    }

    // 2. Sécurité : Si le décodage échoue ou si c'est vide
    if (!is_array($zonesAutorisees) || empty($zonesAutorisees)) {
        return false;
    }

    // 3. Récupérer les polygones par ID (puisque tu utilises les IDs 1, 2, 3, 4)
    $zones = ZoneWilaya::whereIn('id', $zonesAutorisees)->get();

    foreach ($zones as $zone) {
        if ($zone->contientPoint($lat, $lng)) {
            return true;
        }
    }

    return false;
}
}
