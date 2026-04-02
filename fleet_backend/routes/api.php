<?php

use App\Http\Controllers\ConducteurController;
use App\Http\Controllers\AlerteController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\VehiculeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('/login', [App\Http\Controllers\AuthController::class, 'login'])->name('login');


Route::middleware('auth:sanctum')->group(function () {
    // Ajoute ici les routes protégées par authentification
    Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout'])->name('logout');
    Route::get('/vehicules/disponibles', [VehiculeController::class, 'disponibles']);
    Route::get('/vehicules',[VehiculeController::class, 'index']);
    Route::post('/vehicules',[VehiculeController::class, 'store']);
    Route::get('/vehicules/{vehicule}',[VehiculeController::class, 'show']);
    Route::put('/vehicules/{vehicule}',[VehiculeController::class, 'update']);
    Route::delete('/vehicules/{vehicule}',[VehiculeController::class, 'destroy']);

    Route::get('/conducteurs',[ConducteurController::class, 'index']);
    Route::post('/conducteurs',[ConducteurController::class, 'store']);
    Route::get('/conducteurs/{conducteur}',[ConducteurController::class, 'show']);
    Route::put('/conducteurs/{conducteur}',[ConducteurController::class, 'update']);
    Route::delete('/conducteurs/{conducteur}',[ConducteurController::class, 'destroy']);

    Route::get('/missions/disponibles', [MissionController::class, 'disponibles']);
    Route::get('/missions',[MissionController::class, 'index']);
    Route::post('/missions',[MissionController::class, 'store']);
    Route::get('/missions/{mission}',[MissionController::class, 'show']);
    Route::put('/missions/{mission}',[MissionController::class, 'update']);
    Route::delete('/missions/{mission}',[MissionController::class, 'destroy']);

    Route::get('/alertes/count',[AlerteController::class, 'count']);
    Route::put('/alertes/acquitter-toutes',[AlerteController::class, 'acquitterToutes']);
    Route::get('/alertes',[AlerteController::class, 'index']);
    Route::get('/alertes/{alerte}',[AlerteController::class, 'show']);
    Route::put('/alertes/{alerte}',[AlerteController::class, 'update']);

});
