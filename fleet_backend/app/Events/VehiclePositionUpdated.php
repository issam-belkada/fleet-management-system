<?php

namespace App\Events;

use App\Models\Vehicule;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Utilisation du temps réel pur
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehiclePositionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $vehicule;

    /**
     * Crée une nouvelle instance d'événement.
     *
     * @param Vehicule $vehicule
     */
    public function __construct(Vehicule $vehicule)
    {
        // On charge les relations nécessaires pour l'affichage de la carte
        // On utilise loadMissing pour éviter de recharger si c'est déjà présent
        $this->vehicule = $vehicule->loadMissing(['conducteur', 'missionActive']);
    }

    /**
     * Définit le canal de diffusion.
     * Pour une flotte, un canal public "fleet-tracking" est idéal pour commencer.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('fleet-tracking'),
        ];
    }

    /**
     * Nom de l'événement tel qu'il sera reçu par Laravel Echo dans React.
     */
    public function broadcastAs(): string
    {
        return 'position.updated';
    }

    /**
     * Données envoyées au format JSON via WebSocket.
     * On formate ici exactement ce dont le composant React a besoin.
     */
    public function broadcastWith(): array
    {
        return [
            'id'              => $this->vehicule->id,
            'immatriculation' => $this->vehicule->immatriculation,
            'marque'          => $this->vehicule->marque,
            'modele'          => $this->vehicule->modele,
            'lat'             => (float) $this->vehicule->last_lat,
            'lng'             => (float) $this->vehicule->last_lng,
            'statut'          => $this->vehicule->statut, // ex: 'disponible', 'en_mission'
            'conducteur'       => $this->vehicule->conducteur ? [
                'nom'    => $this->vehicule->conducteur->nom,
                'prenom' => $this->vehicule->conducteur->prenom,
            ] : null,
            'mission'         => $this->vehicule->missionActive ? [
                'id'  => $this->vehicule->missionActive->id,
                'nom' => $this->vehicule->missionActive->nom,
            ] : null,
            'updated_at'      => now()->toIso8601String(),
        ];
    }
}
