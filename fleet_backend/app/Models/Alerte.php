<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alerte extends Model
{
    protected $table = 'alertes';

    protected $fillable = [
        'vehicule_id',
        'mission_id',
        'type_alerte',
        'latitude',
        'longitude',
        'message',
        'acquittee',
        'acquittee_le',
    ];

    protected function casts(): array
    {
        return [
            'latitude'     => 'float',
            'longitude'    => 'float',
            'acquittee'    => 'boolean',
            'acquittee_le' => 'datetime',
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

    // Acquitter l'alerte
    public function acquitter(): void
    {
        $this->update([
            'acquittee'    => true,
            'acquittee_le' => now(),
        ]);
    }

    // Scopes utiles
    public function scopeNonAcquittees($query)
    {
        return $query->where('acquittee', false);
    }

    public function scopeParType($query, string $type)
    {
        return $query->where('type_alerte', $type);
    }

    protected static function booted()
    {
        static::created(function ($alerte) {
            event(new \App\Events\AlerteCreated($alerte));
        });
    }
}