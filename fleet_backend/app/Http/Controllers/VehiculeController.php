<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Vehicule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class VehiculeController extends Controller
{
    // -------------------------------------------------------
    // GET /api/vehicules
    // Return all vehicules with optional search and filters
    // Used by : page 4 (liste vehicules) and mission form
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        // Start a query on the Vehicule model
        $query = Vehicule::query();


        // search by immatriculation OR marque
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('immatriculation', 'LIKE', "%{$search}%")
                  ->orWhere('marque', 'LIKE', "%{$search}%");
            });
        }


        // filter by statut (assignee / non_assignee / en_maintenance)
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        // Load the conducteur linked to each vehicule
        // so the frontend gets driver info in the same response
        $query->with('conducteur');

        // Return paginated results — 10 per page
        $vehicules = $query->latest()->paginate(10);

        return response()->json($vehicules);
    }



    public function disponibles(): JsonResponse
        {
            // On récupère les véhicules qui n'ont pas de chauffeur
            // ET qui ne sont pas en maintenance
            $vehicules = Vehicule::where('statut', 'non_assignee')
                ->orderBy('immatriculation', 'asc')
                ->get(['id', 'immatriculation', 'marque', 'modele']); // On ne prend que le nécessaire

            return response()->json($vehicules);
        }

    // -------------------------------------------------------
    // POST /api/vehicules
    // Create a new vehicule
    // Used by : page 4 modal "Ajouter une voiture"
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
        {
            $validated = $request->validate([
                'immatriculation'  => 'required|string|max:20|unique:vehicules,immatriculation',
                'marque'           => 'required|string|max:50',
                'modele'           => 'required|string|max:50',
                'couleur'          => 'required|string|max:30',
            ]);

            // On force les zones 1, 2, 3, 4 par défaut
            $validated['zones_autorisees'] = [1, 2, 3, 4];

            $vehicule = Vehicule::create($validated);

            return response()->json([
                'message'  => 'Véhicule créé avec succès.',
                'vehicule' => $vehicule,
            ], 201);
        }
    // -------------------------------------------------------
    // GET /api/vehicules/{id}
    // Return one vehicule with all its details
    // Used by : page 5 (détail voiture)
    // -------------------------------------------------------
    public function show(Vehicule $vehicule): JsonResponse
    {
        // Load the conducteur and the active mission
        // and the last 10 positions for the map
        $vehicule->load([
            'conducteur',
            'missionActive',
            'positions' => function ($query) {
                // Only get the 10 most recent positions
                $query->latest()->take(10);
            },
        ]);

        // Count how many missions this vehicule has had
        $totalMissions = $vehicule->missions()->count();

        return response()->json([
            'vehicule'      => $vehicule,
            'total_missions' => $totalMissions,
        ]);
    }

    // -------------------------------------------------------
    // PUT /api/vehicules/{id}
    // Update a vehicule
    // Used by : page 5 edit button
    // -------------------------------------------------------
    public function update(Request $request, Vehicule $vehicule): JsonResponse
    {
        // Use sometimes — only validate fields that were sent
        $validated = $request->validate([
            // ignore current vehicule when checking uniqueness
            'immatriculation'  => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('vehicules', 'immatriculation')->ignore($vehicule->id),
            ],
            'marque'           => 'sometimes|string|max:50',
            'modele'           => 'sometimes|string|max:50',
            'couleur'          => 'sometimes|string|max:30',
            'statut'           => 'sometimes|in:assignee,non_assignee,en_maintenance',
            'zones_autorisees' => 'sometimes|array',
            'zones_autorisees.*' => 'exists:zones_wilayas,id',
        ]);

        // Block putting a vehicule in maintenance
        // if it has an active mission
        if (
            isset($validated['statut']) &&
            $validated['statut'] === 'en_maintenance' &&
            $vehicule->missionActive()->exists()
        ) {
            return response()->json([
                'message' => 'Impossible de mettre ce véhicule en maintenance, il a une mission active.',
            ], 422);
        }

        // Update the vehicule with the new data
        $vehicule->update($validated);

        return response()->json([
            'message'  => 'Véhicule mis à jour avec succès.',
            'vehicule' => $vehicule->load('conducteur'),
        ]);
    }

    // -------------------------------------------------------
    // DELETE /api/vehicules/{id}
    // Delete a vehicule
    // Only allowed if no active mission and no conducteur
    // -------------------------------------------------------
    public function destroy(Vehicule $vehicule): JsonResponse
    {
        // Cannot delete if there is an active mission
        if ($vehicule->missionActive()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce véhicule, il a une mission active.',
            ], 422);
        }

        // Cannot delete if a conducteur is still assigned
        if ($vehicule->conducteur()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce véhicule, un conducteur lui est encore assigné.',
            ], 422);
        }

        // Delete the vehicule
        $vehicule->delete();

        return response()->json([
            'message' => 'Véhicule supprimé avec succès.',
        ]);
    }
}
