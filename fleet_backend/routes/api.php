<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('/login', [App\Http\Controllers\AuthController::class, 'login'])->name('login');


Route::middleware('auth:sanctum')->group(function () {
    // Ajoute ici les routes protégées par authentification
    Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout'])->name('logout');

});
