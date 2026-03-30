<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'nom' => 'Issam Belkada',
            'email' => 'admin@fleet.dz',
            'mot_de_passe' => Hash::make('password123'), // Change le mot de passe après le premier test
        ]);
    }
}
