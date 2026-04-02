<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\Conducteur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

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
    // 1. Validation : on s'assure que la date de fin est présente et après le début
    $request->validate([
        'date_debut' => 'required',
        'date_fin'   => 'required', 
    ]);

    try {
        // 2. Nettoyage des dates avec Carbon pour le format SQL
        $debut = Carbon::parse($request->date_debut)->format('Y-m-d H:i:s');
        $fin = Carbon::parse($request->date_fin)->format('Y-m-d H:i:s');

        $conducteurs = Conducteur::query()
            ->whereNotNull('vehicule_id')
            ->whereHas('vehicule', function ($q) {
                // Le véhicule doit être opérationnel
                $q->where('statut', '!=', 'en_maintenance');
            })
            ->whereDoesntHave('missions', function ($q) use ($debut, $fin) {
                // On cherche s'il existe une mission qui chevauche le créneau [début, fin]
                $q->where(function ($query) use ($debut, $fin) {
                    $query->whereBetween('date_debut', [$debut, $fin])
                          ->orWhereBetween('date_fin', [$debut, $fin])
                          ->orWhere(function ($sub) use ($debut, $fin) {
                              $sub->where('date_debut', '<=', $debut)
                                  ->where('date_fin', '>=', $fin);
                          });
                })
                // On ne compte pas les missions déjà terminées
                ->where('statut', '!=', 'cloturee');
            })
            ->with('vehicule:id,immatriculation,marque,modele')
            ->get();

        return response()->json($conducteurs);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la vérification des disponibilités',
            'error' => $e->getMessage()
        ], 500);
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
            'date_fin'           => 'required|date|after:date_debut'
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


        public function update(Request $request, $id)
        {
            $mission = Mission::findOrFail($id);
        
            // Sécurité : On ne peut modifier une mission que si elle est encore "en attente"
            if ($mission->statut !== 'en_attente') {
                return response()->json([
                    'message' => 'Seules les missions en attente peuvent être modifiées.'
                ], 403);
            }
        
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'conducteur_id' => 'required|exists:users,id',
                'date_debut' => 'required|date|after_or_equal:now',
                'date_fin' => 'required|date|after:date_debut',
                'zone_lat' => 'required|numeric',
                'zone_lng' => 'required|numeric',
                'zone_rayon_m' => 'required|integer|min:100',
                'wilaya_destination' => 'required|string',
            ], [
                'date_fin.after' => 'La date de fin doit être postérieure à la date de départ.',
                'date_debut.after_or_equal' => 'La date de début ne peut pas être dans le passé.'
            ]);
        
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
        
            // Mise à jour des données
            $mission->update([
                'nom' => $request->nom,
                'conducteur_id' => $request->conducteur_id,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'zone_lat' => $request->zone_lat,
                'zone_lng' => $request->zone_lng,
                'zone_rayon_m' => $request->zone_rayon_m,
                'wilaya_destination' => $request->wilaya_destination,
                'description' => $request->description,
            ]);
        
            return response()->json([
                'message' => 'Mission mise à jour avec succès',
                'data' => $mission->load('conducteur', 'vehicule')
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
