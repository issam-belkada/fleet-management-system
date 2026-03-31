<?php
// app/Http/Controllers/Api/TrackingController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Models\Vehicule;
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

        // On récupère la mission active pour lier la position
        $vehicule = Vehicule::findOrFail($validated['vehicule_id']);
        $mission = $vehicule->missionActive;

        $position = Position::create([
            'vehicule_id' => $validated['vehicule_id'],
            'mission_id'  => $mission ? $mission->id : null,
            'latitude'    => $validated['latitude'],
            'longitude'   => $validated['longitude'],
            'vitesse'     => $request->vitesse ?? 0,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Position enregistrée',
            'phase' => $mission ? $mission->phase : 'no_mission'
        ]);
    }
}
