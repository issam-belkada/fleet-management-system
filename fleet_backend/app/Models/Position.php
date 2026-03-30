<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends Model
{
    protected $table = 'positions';

    // Pas d'updated_at pour cette table
    const UPDATED_AT = null;

    protected $fillable = [
        'vehicule_id',
        'mission_id',
        'latitude',
        'longitude',
        'vitesse',
        'phase',
    ];

    protected function casts(): array
    {
        return [
            'latitude'   => 'float',
            'longitude'  => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function vehicule(): BelongsTo
    {
        return $this->belongsTo(Vehicule::class, 'vehicule_id');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }
}