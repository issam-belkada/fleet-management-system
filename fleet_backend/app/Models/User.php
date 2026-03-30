<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Indispensable pour ton API React

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Les attributs assignables en masse.
     */
    protected $fillable = [
        'nom',
        'email',
        'mot_de_passe',
    ];

    /**
     * Les attributs cachés pour les retours API (JSON).
     */
    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    /**
     * Casts pour les types de données.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mot_de_passe' => 'hashed', // Gère le hachage automatique
        ];
    }

    /**
     * CRITIQUE : Dit à Laravel que le mot de passe s'appelle 'mot_de_passe'
     * sans cela, l'authentification cherchera la colonne 'password' et échouera.
     */
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }
}
