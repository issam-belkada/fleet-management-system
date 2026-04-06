<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Vehicule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class VehiculeController extends Controller
{
    // -------------------------------------------------------
    // GET /api/vehicules
    // Return all vehicules with optional search and filters
    // Used by : page 4 (liste vehicules) and mission form
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
{
    $query = Vehicule::query();

    if ($request->filled('search')) {
    $search = trim($request->search); // On enlève les espaces accidentels du début/fin
    
    $query->where(function ($q) use ($search) {
        // On passe tout en minuscule pour ignorer la casse (Case-Insensitive)
        $q->where('immatriculation', 'ILIKE', "%{$search}%")
          ->orWhere('marque', 'ILIKE', "%{$search}%")
          ->orWhere('modele', 'ILIKE', "%{$search}%"); // Ajoute aussi le modèle par sécurité
    });
}

    if ($request->filled('statut')) {
        $query->where('statut', $request->statut);
    }

    $query->with('conducteur');

    // On utilise withQueryString() pour persister les filtres dans la pagination
    $vehicules = $query->latest()->paginate(10)->withQueryString();

    return response()->json($vehicules);
}

    public function allForMap(): JsonResponse
{
    // On charge les relations nécessaires pour calculer l'état
    $vehicules = Vehicule::with([
        'conducteur',
        'missionActive',
        'alertes' => function($query) {
            $query->nonAcquittees(); // Utilise ton scope défini dans Alerte.php
        }
    ])->get([
        'id', 'immatriculation', 'marque', 'modele', 'statut', 'last_lat', 'last_lng'
    ]);

    // On transforme la collection pour ajouter les informations de statut dynamique
    $data = $vehicules->map(function ($v) {
        // Détermination de l'état prioritaire pour la couleur
        $etatMap = 'libre'; // Par défaut (Vert)

        if ($v->alertes->isNotEmpty()) {
            $etatMap = 'alerte'; // Priorité maximale (Rouge)
        } elseif ($v->missionActive) {
            $etatMap = 'en_mission'; // (Bleu)
        }

        return [
            'id' => $v->id,
            'immatriculation' => $v->immatriculation,
            'marque' => $v->marque,
            'modele' => $v->modele,
            'lat' => $v->last_lat,
            'lng' => $v->last_lng,
            'etat_map' => $etatMap, // 'alerte', 'en_mission', ou 'libre'
            'conducteur' => $v->conducteur ? [
                'nom' => $v->conducteur->nom,
                'prenom' => $v->conducteur->prenom,
                'telephone' => $v->conducteur->telephone,
            ] : null,
            'mission_details' => $v->missionActive ? [
                'type' => $v->missionActive->type_mission,
                'destination' => $v->missionActive->destination,
            ] : null,
            'nombre_alertes' => $v->alertes->count(),
        ];
    });

    return response()->json($data);
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
    public function show(Request $request, Vehicule $vehicule)
{
    $date = $request->query('date', Carbon::today()->toDateString());
    // On charge toutes les relations nécessaires
    $vehicule->load(['conducteur', 'missions']);

    // 1. Positions (Logique existante)
    $positions = $vehicule->positions()
        ->whereDate('created_at', $date)
        ->orderBy('created_at', 'asc')
        ->get(['latitude', 'longitude', 'vitesse', 'created_at']);

    $isHistorical = false;
    if ($positions->isEmpty()) {
        $lastKnown = $vehicule->positions()
            ->orderBy('created_at', 'desc')
            ->first(['latitude', 'longitude', 'vitesse', 'created_at']);
        if ($lastKnown) {
            $positions = collect([$lastKnown]);
            $isHistorical = true;
        }
    }

    // 2. ALERTES : Date sélectionnée OU Non acquittées
    $alertes = $vehicule->alertes()
        ->where(function($query) use ($date) {
            $query->whereDate('created_at', $date)
                  ->orWhere('acquittee', false); // Affiche le "reste à faire"
        })
        ->orderBy('acquittee', 'asc') // Les non-acquittées en premier
        ->orderBy('created_at', 'desc')
        ->get();

    // 3. Stats
    $vitesseMax = $positions->max('vitesse') ?? 0;

    $stats = [
        'nb_missions' => $vehicule->missions->count(),
        'nb_alertes_jour' => $alertes->whereBetween('created_at', [Carbon::parse($date)->startOfDay(), Carbon::parse($date)->endOfDay()])->count(),
        'total_non_acquittees' => $vehicule->alertes()->where('acquittee', false)->count(), // Nouveau badge
        'en_mouvement' => $vehicule->positions()->where('created_at', '>', now()->subMinutes(5))->exists(),
        'vitesse_max' => round($vitesseMax, 1),
        'vitesse_moyenne' => round($positions->avg('vitesse') ?? 0, 1),
        'derniere_vitesse' => $positions->last() ? $positions->last()->vitesse : 0,
        'is_historical' => $isHistorical
    ];

    return response()->json([
        'vehicule' => $vehicule,
        'positions' => $positions,
        'alertes' => $alertes,
        'stats' => $stats,
        'date_filtree' => $date
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
