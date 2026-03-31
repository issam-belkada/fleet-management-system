<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Conducteur;
use App\Models\Vehicule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ConducteurController extends Controller
{
    // -------------------------------------------------------
    // GET /api/conducteurs
    // Return all conducteurs with optional search
    // Used by : page 6 (liste chauffeurs)
    //           page 9 (mission form dropdown)
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        // Start a query on the Conducteur model
        $query = Conducteur::query();

        // Search by nom OR prenom
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                  ->orWhere('prenom', 'LIKE', "%{$search}%");
            });
        }

        // If the frontend only wants available conducteurs
        // (for the mission creation dropdown)
        if ($request->filled('disponible') && $request->disponible == true) {
            // Only return conducteurs with no active mission
            $query->whereDoesntHave('missions', function ($q) {
                $q->whereIn('statut', ['active', 'en_attente']);
            });
        }

        // Always load the vehicule linked to each conducteur
        $query->with('vehicule');

        // Paginate the results
        $conducteurs = $query->latest()->paginate(10);

        return response()->json($conducteurs);
    }

    // -------------------------------------------------------
    // POST /api/conducteurs
    // Create a new conducteur and assign him to a vehicule
    // Used by : page 6 modal "Ajouter un chauffeur"
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        // Validate the incoming data
        $validated = $request->validate([
            // vehicule_id must exist in vehicules table
            // and must not already have a conducteur
            'vehicule_id'   => [
                'required',
                'exists:vehicules,id',
                Rule::unique('conducteurs', 'vehicule_id'),
            ],
            'nom'           => 'required|string|max:100',
            'prenom'        => 'required|string|max:100',
            'telephone'     => 'required|string|max:20',
            'numero_permis' => 'required|string|max:50|unique:conducteurs,numero_permis',
        ]);

        // Find the vehicule we want to assign this conducteur to
        $vehicule = Vehicule::findOrFail($validated['vehicule_id']);

        // Block assignment if vehicule is en_maintenance
        if ($vehicule->statut === 'en_maintenance') {
            return response()->json([
                'message' => 'Impossible d\'assigner un conducteur à un véhicule en maintenance.',
            ], 422);
        }

        // Create the conducteur in the database
        $conducteur = Conducteur::create($validated);

        // Update vehicule statut to assignee
        // because it now has a conducteur
        $vehicule->update(['statut' => 'assignee']);

        // Return the created conducteur with his vehicule
        return response()->json([
            'message'    => 'Conducteur créé avec succès.',
            'conducteur' => $conducteur->load('vehicule'),
        ], 201);
    }

    // -------------------------------------------------------
    // GET /api/conducteurs/{id}
    // Return one conducteur with his vehicule + missions + stats
    // Used by : page 7 (détail chauffeur)
    // -------------------------------------------------------
    public function show(Conducteur $conducteur): JsonResponse
    {
        // Load the vehicule and the last 10 missions
        $conducteur->load([
            'vehicule',
            'missions' => function ($query) {
                $query->latest()->take(10);
            },
        ]);

        // Calculate stats for the stat cards on page 7
        $stats = [
            // Total number of missions ever assigned to this conducteur
            'total_missions'     => $conducteur->missions()->count(),

            // Number of completed missions
            'missions_cloturees' => $conducteur->missions()
                                               ->where('statut', 'cloturee')
                                               ->count(),

            // Is he currently on a mission ?
            'en_mission'         => $conducteur->missionActive()->exists(),
        ];

        return response()->json([
            'conducteur' => $conducteur,
            'stats'      => $stats,
        ]);
    }

    // -------------------------------------------------------
    // PUT /api/conducteurs/{id}
    // Update conducteur info or reassign to a new vehicule
    // Used by : page 7 edit button
    // -------------------------------------------------------
    public function update(Request $request, Conducteur $conducteur): JsonResponse
    {
        // Validate — use sometimes so only sent fields are validated
        $validated = $request->validate([
            'nom'           => 'sometimes|string|max:100',
            'prenom'        => 'sometimes|string|max:100',
            'telephone'     => 'sometimes|string|max:20',
            // Ignore the conducteur himself when checking
            // uniqueness of numero_permis
            'numero_permis' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('conducteurs', 'numero_permis')
                    ->ignore($conducteur->id),
            ],
            // If changing vehicule, it must exist
            // and must not already have another conducteur
            'vehicule_id'   => [
                'sometimes',
                'exists:vehicules,id',
                Rule::unique('conducteurs', 'vehicule_id')
                    ->ignore($conducteur->id),
            ],
        ]);

        // Handle vehicule reassignment
        // only if a new vehicule_id was sent
        // and it is different from the current one
        if (
            isset($validated['vehicule_id']) &&
            $validated['vehicule_id'] != $conducteur->vehicule_id
        ) {
            // Find the new vehicule
            $newVehicule = Vehicule::findOrFail($validated['vehicule_id']);

            // Block if new vehicule is en_maintenance
            if ($newVehicule->statut === 'en_maintenance') {
                return response()->json([
                    'message' => 'Impossible d\'assigner ce véhicule, il est en maintenance.',
                ], 422);
            }

            // Free the old vehicule back to non_assignee
            $conducteur->vehicule()->update(['statut' => 'non_assignee']);

            // Claim the new vehicule
            $newVehicule->update(['statut' => 'assignee']);
        }

        // Update the conducteur with the validated data
        $conducteur->update($validated);

        return response()->json([
            'message'    => 'Conducteur mis à jour avec succès.',
            'conducteur' => $conducteur->load('vehicule'),
        ]);
    }

    // -------------------------------------------------------
    // DELETE /api/conducteurs/{id}
    // Delete a conducteur
    // Only allowed if he has no active mission
    // -------------------------------------------------------
    public function destroy(Conducteur $conducteur): JsonResponse
    {
        // Cannot delete if conducteur has an active mission
        if ($conducteur->missionActive()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un conducteur avec une mission active.',
            ], 422);
        }

        // Free the vehicule back to non_assignee
        // before deleting the conducteur
        if ($conducteur->vehicule()->exists()) {
            $conducteur->vehicule()->update(['statut' => 'non_assignee']);
        }

        // Delete the conducteur
        $conducteur->delete();

        return response()->json([
            'message' => 'Conducteur supprimé avec succès.',
        ]);
    }
}