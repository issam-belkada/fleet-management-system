<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AlerteController extends Controller
{
    // -------------------------------------------------------
    // GET /api/alertes
    // Return all alertes with filters
    // Used by : page 10 (liste alertes)
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Alerte::query();

        // Filter by type_alerte
        if ($request->filled('type')) {
            $query->where('type_alerte', $request->type);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Search by vehicule immatriculation
        if ($request->filled('search')) {
            $query->whereHas('vehicule', function ($q) use ($request) {
                $q->where('immatriculation', 'LIKE', "%{$request->search}%");
            });
        }

        // Show non acquittees first
        // then order by most recent
        $query->orderBy('acquittee', 'asc')
              ->latest();

        // Load vehicule and mission for each alerte
        $query->with(['vehicule', 'mission']);

        $alertes = $query->paginate(10);

        // Also return the count of non acquittees
        // for the badge in the navbar
        $nonAcquittees = Alerte::nonAcquittees()->count();

        return response()->json([
            'alertes'        => $alertes,
            'non_acquittees' => $nonAcquittees,
        ]);
    }

public function show($id)
{
    $alerte = Alerte::with([
        'mission',
        'vehicule.conducteur'
    ])->findOrFail($id);

    return response()->json($alerte);
}

    public function non_acquittees(): JsonResponse
    {
        $alertes = Alerte::nonAcquittees()->with(['vehicule', 'mission'])->latest()->limit(10)->get();

        return response()->json($alertes);
    }

    public function update(Alerte $alerte): JsonResponse
    {
        // Use the acquitter() method we defined in the model
        // it sets acquittee = true and records the timestamp
        $alerte->acquitter();

        return response()->json([
            'message' => 'Alerte acquittée avec succès.',
            'alerte'  => $alerte,
        ]);
    }

    // -------------------------------------------------------
    // PUT /api/alertes/acquitter-toutes
    // Acquit ALL non acquittees alertes at once
    // Used by : page 10 "Tout marquer comme lu" button
    // -------------------------------------------------------
    public function acquitterToutes(): JsonResponse
    {
        // Update all non acquittees alertes in one query
        // much faster than looping and calling acquitter()
        Alerte::nonAcquittees()->update([
            'acquittee'    => true,
            'acquittee_le' => now(),
        ]);

        return response()->json([
            'message' => 'Toutes les alertes ont été acquittées.',
        ]);
    }

    
    public function acquitter(Alerte $alerte): JsonResponse
    {
        $alerte->acquitter();

        return response()->json([
            'message' => 'Alerte acquittée avec succès.',
            'alerte'  => $alerte,
        ]);
    }
    
    public function count(): JsonResponse
    {
        $count = Alerte::nonAcquittees()->count();

        return response()->json([
            'non_acquittees' => $count,
        ]);
    }

    // Alertes are created automatically by GeofencingService
    // the chef never creates or deletes them manually
    // so store() and destroy() are not needed
}
