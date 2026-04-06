<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Models\Vehicule;
use App\Events\VehiclePositionUpdated; // Importe l'événement
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicule_id' => 'required|exists:vehicules,id',
            'latitude'    => 'required|numeric',
            'longitude'   => 'required|numeric',
            'vitesse'     => 'nullable|numeric',
        ]);

        $vehicule = Vehicule::findOrFail($validated['vehicule_id']);
        $mission = $vehicule->missionActive;

        // 1. Création de l'historique de position
        $position = Position::create([
            'vehicule_id' => $validated['vehicule_id'],
            'mission_id'  => $mission ? $mission->id : null,
            'latitude'    => $validated['latitude'],
            'longitude'   => $validated['longitude'],
            'vitesse'     => $request->vitesse ?? 0,
            'phase'       => $mission ? $mission->phase : null,
        ]);

        // 2. Mise à jour de la position actuelle sur le véhicule
        // (Optionnel mais recommandé pour charger la carte plus vite au rafraîchissement)
        $vehicule->update([
            'last_lat' => $validated['latitude'],
            'last_lng' => $validated['longitude'],
        ]);

        // 3. DÉCLENCHEMENT DE L'ÉVÉNEMENT REVERB
        broadcast(new VehiclePositionUpdated($vehicule))->toOthers();

        return response()->json([
            'status' => 'success',
            'message' => 'Position enregistrée et diffusée',
            'data' => $position
        ]);
    }
}
