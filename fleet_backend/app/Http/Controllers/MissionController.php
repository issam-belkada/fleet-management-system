<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\Conducteur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Carbon\Carbon;

class MissionController extends Controller
{
    /**
     * Liste des missions avec filtres (Page 8)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Mission::query();

        if ($request->filled('search')) {
            $query->where('nom', 'LIKE', "%{$request->search}%");
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date_debut', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date_debut', '<=', $request->date_to);
        }

        $missions = $query->with(['conducteur', 'vehicule'])
                          ->latest()
                          ->paginate(10);

        return response()->json($missions);
    }

    /**
     * Récupérer les conducteurs éligibles pour une période donnée
     */
    public function disponibles(Request $request): JsonResponse
    {
        $request->validate([
            'date_debut' => 'required', // On accepte le format ISO du JS
        ]);

        try {
            // Nettoyage de la date pour SQL (ex: 2026-04-02 07:31:00)
            $debut = Carbon::parse($request->date_debut)->format('Y-m-d H:i:s');
            $fin = Carbon::parse($debut)->addHours(24)->format('Y-m-d H:i:s');

            $conducteurs = Conducteur::query()
                ->whereNotNull('vehicule_id')
                ->whereHas('vehicule', function ($q) {
                    $q->where('statut', '!=', 'en_maintenance');
                })
                ->whereDoesntHave('missions', function ($q) use ($debut, $fin) {
                    $q->where(function ($query) use ($debut, $fin) {
                        $query->whereBetween('date_debut', [$debut, $fin])
                              ->orWhereBetween('date_fin', [$debut, $fin])
                              ->orWhere(function ($sub) use ($debut, $fin) {
                                  $sub->where('date_debut', '<=', $debut)
                                      ->where('date_fin', '>=', $fin);
                              });
                    })->where('statut', '!=', 'cloturee');
                })
                ->with('vehicule:id,immatriculation,marque,modele')
                ->get();

            return response()->json($conducteurs);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur format date', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conducteur_id'      => 'required|exists:conducteurs,id',
            'nom'                => 'required|string|max:150',
            'description'        => 'nullable|string',
            'zone_lat'           => 'required|numeric',
            'zone_lng'           => 'required|numeric',
            'zone_rayon_m'       => 'required|integer|min:100',
            'wilaya_destination' => 'required|string|max:100',
            'date_debut'         => 'required|date',
        ]);

        $conducteur = Conducteur::with('vehicule')->findOrFail($validated['conducteur_id']);

        if (!$conducteur->vehicule || $conducteur->vehicule->statut === 'en_maintenance') {
            return response()->json(['message' => 'Véhicule indisponible ou en maintenance.'], 422);
        }

        $validated['vehicule_id'] = $conducteur->vehicule_id;
        $validated['cree_par'] = auth()->id();
        $validated['statut'] = 'en_attente';

        $mission = Mission::create($validated);

        return response()->json([
            'message' => "Mission créée avec succès",
            'mission' => $mission->load(['conducteur', 'vehicule']),
        ], 201);
    }

    /**
     * Détails d'une mission
     */
    public function show(Mission $mission): JsonResponse
    {
        $mission->load([
            'conducteur',
            'vehicule',
            'positions' => fn($q) => $q->latest()->take(50),
            'alertes' => fn($q) => $q->latest()
        ]);
        return response()->json($mission);
    }

    /**
     * Mise à jour du statut (Activation / Clôture)
     */
    public function update(Request $request, Mission $mission): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:en_attente,active,cloturee',
        ]);

        if ($mission->statut === 'cloturee') {
            return response()->json(['message' => 'Mission déjà clôturée.'], 422);
        }

        if ($validated['statut'] === 'active' && $mission->statut === 'en_attente') {
            $mission->date_debut = now();
        }

        if ($validated['statut'] === 'cloturee') {
            $mission->date_fin = now();
            // Optionnel : On peut décider de libérer le véhicule ici
            // $mission->vehicule()->update(['statut' => 'non_assignee']);
        }

        $mission->update(['statut' => $validated['statut']]);

        return response()->json([
            'message' => 'Statut mis à jour.',
            'mission' => $mission->load(['conducteur', 'vehicule'])
        ]);
    }

    /**
     * Supprimer une mission (si en attente uniquement)
     */
    public function destroy(Mission $mission): JsonResponse
    {
        if ($mission->statut !== 'en_attente') {
            return response()->json(['message' => 'Suppression impossible (mission déjà commencée).'], 422);
        }

        $mission->delete();
        return response()->json(['message' => 'Mission supprimée.']);
    }
}
