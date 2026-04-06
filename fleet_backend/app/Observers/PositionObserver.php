<?php

namespace App\Observers;

use App\Models\Position;
use App\Models\Mission;
use App\Models\Alerte;
use App\Services\TrackingService;

class PositionObserver
{
    protected $tracking;

    public function __construct(TrackingService $service)
    {
        $this->tracking = $service;
    }

    public function created(Position $position): void
    {
        $vehicule = $position->vehicule;
        $now = now();

        // --- NOUVEAU : VÉRIFICATION EXCES DE VITESSE ---
        if ($position->vitesse > 120) {
            $this->notifierAlerte(
                $position,
                'exces_vitesse',
                "Vitesse détectée: {$position->vitesse} km/h"
            );
        }

        // 1. Détection de la zone permanente (Polygone)
        $estDansZonePermanente = $vehicule->estDansZoneAutorisee($position->latitude, $position->longitude);

        // 2. Recherche de la mission (Active ou En attente pour le créneau actuel)
        $mission = Mission::where('vehicule_id', $position->vehicule_id)
            ->whereIn('statut', ['en_attente', 'active'])
            ->first();

        // --- SCÉNARIO A : PAS DE MISSION OU SORTIE HORS CRÉNEAU ---
        if (!$mission) {
            if (!$estDansZonePermanente) {
                $this->notifierAlerte($position, 'sortie_zone_permanente', "Véhicule hors zone sans mission programmée.");
            }
            return;
        }

        // --- SCÉNARIO B : DÉTECTION DU DÉPART (Passage de en_attente à active) ---
        if ($mission->statut === 'en_attente') {
            // Vérifie si on est dans le créneau horaire prévu
            if ($now->between($mission->date_debut, $mission->date_fin)) {
                if (!$estDansZonePermanente) {
                    $mission->update(['statut' => 'active', 'phase' => 'en_route']);
                }
            } else {
                // Si le véhicule sort de la zone AVANT l'heure de la mission
                if (!$estDansZonePermanente) {
                    $this->notifierAlerte($position, 'sortie_zone_permanente', "Sortie de zone hors créneau de mission.");
                }
                return;
            }
        }

        // --- SCÉNARIO C : MISSION ACTIVE ---
        if ($mission->statut === 'active') {
            $distanceCible = $mission->haversine($position->latitude, $position->longitude, $mission->zone_lat, $mission->zone_lng);
            $estDansCercleMission = $distanceCible <= $mission->zone_rayon_m;

            // --- PHASE : EN ROUTE (ALLER) ---
            if ($mission->phase === 'en_route') {
                if ($estDansCercleMission) {
                    $mission->update(['phase' => 'on_site']);
                } else {
                    // Analyse comportementale (Aller)
                    $this->tracking->analyserComportement($position, $mission);
                }
            }

            // --- PHASE : SUR SITE (ON SITE) ---
            elseif ($mission->phase === 'on_site') {
                if (!$estDansCercleMission) {
                    // Le conducteur quitte la zone : passage en RETOUR
                    $mission->update(['phase' => 'en_retour']);
                }
            }

            // --- PHASE : EN RETOUR (RETOUR VERS CETIC) ---
            elseif ($mission->phase === 'en_retour') {
                if ($estDansZonePermanente) {
                    // Fin de mission : arrivé à Alger / CETIC
                    $mission->update([
                        'statut' => 'cloturee',
                        'date_fin' => $now
                    ]);
                } else {
                    // Analyse comportementale (Retour)
                    $this->tracking->analyserComportement($position, $mission);
                }
            }
        }
    }

    private function notifierAlerte(Position $pos, string $type, string $msg)
{
    $alerteExistante = Alerte::where('vehicule_id', $pos->vehicule_id)
        ->where('type_alerte', $type)
        ->where('acquittee', false)
        ->latest()
        ->first();

    if (!$alerteExistante || $alerteExistante->created_at->diffInMinutes(now()) >= 60) {

        $missionId = Mission::where('vehicule_id', $pos->vehicule_id)
            ->whereIn('statut', ['en_attente', 'active'])
            ->value('id');

        Alerte::create([
            'vehicule_id' => $pos->vehicule_id,
            'mission_id'  => $missionId,
            'type_alerte' => $type,
            'latitude'    => $pos->latitude,
            'longitude'   => $pos->longitude,
            'message'     => $msg,
            'acquittee'   => false
        ]);

    } else {

        $alerteExistante->update([
            'latitude'   => $pos->latitude,
            'longitude'  => $pos->longitude,
            'message'    => $msg,
            'updated_at' => now()
        ]);
    }
}
}
