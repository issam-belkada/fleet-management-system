<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conducteur extends Model
{
    protected $table = 'conducteurs';

    protected $fillable = [
        'vehicule_id',
        'nom',
        'prenom',
        'telephone',
        'numero_permis',
    ];

    // Relation 1-1 inverse : le conducteur appartient à un véhicule
    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_id');
    }

    // Toutes les missions du conducteur
    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'conducteur_id');
    }

    // Mission active en cours (1 seule à la fois)
    public function missionActive(): HasOne
    {
        return $this->hasOne(Mission::class, 'conducteur_id')
                    ->where('statut', 'active');
    }

    // Nom complet
    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    // Vérifie si le conducteur est disponible
    public function estDisponible(): bool
    {
        return !$this->missionActive()->exists();
    }
}
