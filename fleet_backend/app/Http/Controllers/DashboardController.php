<?php

namespace App\Http\Controllers;

use App\Models\Vehicule;
use App\Models\Mission;
use App\Models\Alerte;
use App\Models\Conducteur;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Stats Véhicules
        $vehiculesParStatut = Vehicule::selectRaw('statut, COUNT(*) as total')
                                      ->groupBy('statut')
                                      ->pluck('total', 'statut');

        // Stats Missions
        $missionsStats = [
            'active' => Mission::where('statut', 'active')->count(),
            'cloturee' => Mission::where('statut', 'cloturee')->count(),
            'en_attente' => Mission::where('statut', 'en_attente')->count(),
        ];

        // Stats Globales
        $data = [
            'vehicules' => [
                'total'          => Vehicule::count(),
                'assignes'       => $vehiculesParStatut['assignee']       ?? 0,
                'non_assignes'   => $vehiculesParStatut['non_assignee']   ?? 0,
                'en_maintenance' => $vehiculesParStatut['en_maintenance'] ?? 0,
            ],
            'alertes' => [
                'non_acquittees' => Alerte::where('acquittee', false)->count(),
                'aujourdhui'     => Alerte::whereDate('created_at', today())->count(),
            ],
            'conducteurs' => [
                'total' => Conducteur::count(),
                'en_mission' => Mission::where('statut', 'active')->distinct('conducteur_id')->count(),
            ],
            'missions' => $missionsStats
        ];

        // Liste Missions Active (Limitée pour le dashboard mais complète dans l'objet)
        $data['missions_en_cours'] = Mission::where('statut', 'active')
            ->with(['vehicule:id,immatriculation,marque,modele', 'conducteur:id,nom,prenom'])
            ->latest()
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'nom' => $m->nom,
                'phase' => $m->phase,
                'date_debut' => $m->date_debut,
                'vehicule' => $m->vehicule?->immatriculation,
                'conducteur' => $m->conducteur ? [
                    'nom' => "{$m->conducteur->prenom} {$m->conducteur->nom}",
                    'initiales' => strtoupper(substr($m->conducteur->prenom, 0, 1) . substr($m->conducteur->nom, 0, 1))
                ] : null,
            ]);

        // Dernières Alertes (On en prend 10 pour le scroll)
        $data['dernieres_alertes'] = Alerte::with('vehicule:id,immatriculation')
            ->latest()
            ->take(15)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'message' => $a->message,
                'type' => $a->type_alerte,
                'acquittee' => $a->acquittee,
                'temps' => $a->created_at->diffForHumans(),
                'immat' => $a->vehicule?->immatriculation
            ]);

        return response()->json($data);
    }
}