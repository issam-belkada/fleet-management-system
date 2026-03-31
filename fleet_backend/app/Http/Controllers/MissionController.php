<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Vehicule;
use App\Models\Conducteur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MissionController extends Controller
{
    // -------------------------------------------------------
    // GET /api/missions
    // Return all missions with filters
    // Used by : page 8 (liste missions)
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Mission::query();

        // Search by mission name
        if ($request->filled('search')) {
            $query->where('nom', 'LIKE', "%{$request->search}%");
        }

        // Filter by statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('date_debut', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_debut', '<=', $request->date_to);
        }

        // Load conducteur and vehicule for each mission row
        $query->with(['conducteur', 'vehicule']);

        $missions = $query->latest()->paginate(10);

        return response()->json($missions);
    }

    // -------------------------------------------------------
    // POST /api/missions
    // Create a new mission
    // Used by : page 9 (créer mission)
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conducteur_id'      => 'required|exists:conducteurs,id',
            'vehicule_id'        => 'required|exists:vehicules,id',
            'nom'                => 'required|string|max:150',
            'description'        => 'nullable|string',
            'zone_lat'           => 'required|numeric|between:-90,90',
            'zone_lng'           => 'required|numeric|between:-180,180',
            'zone_rayon_m'       => 'required|integer|min:100',
            'wilaya_destination' => 'required|string|max:100',
        ]);

        // Find the vehicule and conducteur
        $vehicule   = Vehicule::findOrFail($validated['vehicule_id']);
        $conducteur = Conducteur::findOrFail($validated['conducteur_id']);

        // Block if vehicule already has an active mission
        if ($vehicule->missionActive()->exists()) {
            return response()->json([
                'message' => 'Ce véhicule a déjà une mission active.',
            ], 422);
        }

        // Block if conducteur already has an active mission
        if (!$conducteur->estDisponible()) {
            return response()->json([
                'message' => 'Ce conducteur a déjà une mission active.',
            ], 422);
        }

        // Block if vehicule is en_maintenance
        if ($vehicule->statut === 'en_maintenance') {
            return response()->json([
                'message' => 'Ce véhicule est en maintenance.',
            ], 422);
        }

        // Add who created this mission
        // auth()->id() returns the logged in user id
        $validated['cree_par'] = auth()->id();

        // Default statut is en_attente
        // chef must activate it manually
        $validated['statut'] = 'en_attente';

        // Create the mission
        $mission = Mission::create($validated);

        return response()->json([
            'message' => 'Mission créée avec succès.',
            'mission' => $mission->load(['conducteur', 'vehicule']),
        ], 201);
    }

    // -------------------------------------------------------
    // GET /api/missions/{id}
    // Return one mission with all details
    // Used by : page 9 (détail mission)
    // -------------------------------------------------------
    public function show(Mission $mission): JsonResponse
    {
        // Load everything related to this mission
        $mission->load([
            'conducteur',
            'vehicule',
            'positions' => function ($query) {
                // Last 50 positions for the map
                $query->latest()->take(50);
            },
            'alertes' => function ($query) {
                // Most recent alerts first
                $query->latest();
            },
        ]);

        return response()->json($mission);
    }

    // -------------------------------------------------------
    // PUT /api/missions/{id}
    // Update mission statut
    // Used by : page 9 statut buttons
    //           (activate / cloture a mission)
    // -------------------------------------------------------
    public function update(Request $request, Mission $mission): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,active,cloturee',
        ]);

        $newStatut = $validated['statut'];

        // Cannot reopen a cloturee mission
        if ($mission->statut === 'cloturee') {
            return response()->json([
                'message' => 'Une mission clôturée ne peut pas être modifiée.',
            ], 422);
        }

        // When activating a mission
        // record the start time
        if ($newStatut === 'active' && $mission->statut === 'en_attente') {
            $mission->date_debut = now();
        }

        // When closing a mission
        // record the end time
        // and free the vehicule and conducteur
        if ($newStatut === 'cloturee') {
            $mission->date_fin = now();

            // Free the vehicule back to non_assignee
            $mission->vehicule()->update(['statut' => 'non_assignee']);
        }

        // Save the new statut
        $mission->statut = $newStatut;
        $mission->save();

        return response()->json([
            'message' => 'Statut de la mission mis à jour.',
            'mission' => $mission->load(['conducteur', 'vehicule']),
        ]);
    }

    // -------------------------------------------------------
    // DELETE /api/missions/{id}
    // Delete a mission
    // Only allowed if statut is en_attente
    // -------------------------------------------------------
    public function destroy(Mission $mission): JsonResponse
    {
        // Cannot delete an active or cloturee mission
        if ($mission->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Seules les missions en attente peuvent être supprimées.',
            ], 422);
        }

        // Delete the mission
        $mission->delete();

        return response()->json([
            'message' => 'Mission supprimée avec succès.',
        ]);
    }
}