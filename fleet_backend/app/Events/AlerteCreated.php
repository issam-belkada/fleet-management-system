<?php
namespace App\Events;

use App\Models\Alerte;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlerteCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $alerte;

    public function __construct(Alerte $alerte)
    {
        // On charge les relations pour avoir le nom du chauffeur/véhicule dans la notification
        $this->alerte = $alerte->load(['vehicule.conducteur', 'mission']);
    }

    public function broadcastOn(): array
    {
        // Un canal unique pour toutes les alertes de l'admin
        return [new Channel('admin-notifications')];
    }

    public function broadcastAs(): string
    {
        return 'alerte.new';
    }
}