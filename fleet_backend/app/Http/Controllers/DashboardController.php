<?php

namespace App\Http\Controllers;

use App\Models\Vehicule;
use App\Models\Mission;
use App\Models\Alerte;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    // -------------------------------------------------------
    // GET /api/dashboard
    // Returns all data needed for the dashboard page
    // Called once on page load + every 30s polling
    // -------------------------------------------------------
    public function index(): JsonResponse
    {
        // ────────────────────────────────────────
        // VEHICULES STATS
        // One query — group by statut
        // ─────────────────────────────────────────
        $vehiculesParStatut = Vehicule::selectRaw('statut, COUNT(*) as total')
                                      ->groupBy('statut')
                                      ->pluck('total', 'statut');

        $vehiculesStats = [
            'total'          => Vehicule::count(),
            'assignes'       => $vehiculesParStatut['assignee']       ?? 0,
            'non_assignes'   => $vehiculesParStatut['non_assignee']   ?? 0,
            'en_maintenance' => $vehiculesParStatut['en_maintenance'] ?? 0,
        ];

        // ─────────────────────────────────────────
        // ALERTES STATS
        // ─────────────────────────────────────────
        $alertesStats = [
            // For the navbar badge + red card
            'non_acquittees' => Alerte::where('acquittee', false)->count(),
            // For the amber card
            'aujourdhui'     => Alerte::whereDate('created_at', today())->count(),
        ];

        // ─────────────────────────────────────────
        // ACTIVE MISSIONS
        // For the table in the dashboard
        // ─────────────────────────────────────────
        $missionsEnCours = Mission::where('statut', 'active')
            ->with([
                'vehicule:id,immatriculation,marque,modele',
                'conducteur:id,nom,prenom',
            ])
            ->latest('date_debut')
            ->get()
            ->map(function ($mission) {
                return [
                    'id'          => $mission->id,
                    'nom'         => $mission->nom,
                    'statut'      => $mission->statut,
                    'phase'       => $mission->phase,
                    'date_debut'  => $mission->date_debut,
                    'vehicule'    => $mission->vehicule ? [
                        'immatriculation' => $mission->vehicule->immatriculation,
                        'marque'          => $mission->vehicule->marque,
                        'modele'          => $mission->vehicule->modele,
                    ] : null,
                    'conducteur'  => $mission->conducteur ? [
                        // Initials for the avatar circle
                        'initiales' => strtoupper(
                            substr($mission->conducteur->prenom, 0, 1) .
                            substr($mission->conducteur->nom, 0, 1)
                        ),
                        'nom_complet' => $mission->conducteur->prenom . ' ' . $mission->conducteur->nom,
                    ] : null,
                ];
            });

        // ─────────────────────────────────────────
        // LAST 5 ALERTES
        // For the right column list
        // ─────────────────────────────────────────
        $dernieresAlertes = Alerte::with('vehicule:id,immatriculation')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($alerte) {
                return [
                    'id'           => $alerte->id,
                    'type_alerte'  => $alerte->type_alerte,
                    'message'      => $alerte->message,
                    'acquittee'    => $alerte->acquittee,
                    'created_at'   => $alerte->created_at,
                    // Human readable time difference
                    'temps_ecoule' => $alerte->created_at->diffForHumans(),
                    'vehicule'     => $alerte->vehicule ? [
                        'immatriculation' => $alerte->vehicule->immatriculation,
                    ] : null,
                ];
            });

        // ─────────────────────────────────────────
        // BUILD RESPONSE
        // ─────────────────────────────────────────
        return response()->json([
            'vehicules'         => $vehiculesStats,
            'alertes'           => $alertesStats,
            'missions_en_cours' => $missionsEnCours,
            'dernieres_alertes' => $dernieresAlertes,
        ]);
    }
}