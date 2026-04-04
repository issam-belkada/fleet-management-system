<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('fleet-tracking', function () {
    return true; // À sécuriser plus tard avec auth()->check()
});

Broadcast::channel('mission.{id}', function ($user, $id) {
    return true;
});

Broadcast::channel('admin-notifications', function () {
    return true;
});