<?php

namespace Database\Seeders;

use App\Models\Conducteur;
use App\Models\Vehicule;
use Illuminate\Database\Seeder;

class ConducteurSeeder extends Seeder
{
    public function run(): void
    {
        // We only assign drivers to vehicles with 'assignee' status
        $vehiculeIds = Vehicule::where('statut', 'assignee')->pluck('id');

        $conducteurs = [
            [
                'nom' => 'Brahimi',
                'prenom' => 'Mohamed',
                'telephone' => '0550123456',
                'numero_permis' => '16/12345',
            ],
            [
                'nom' => 'Mansouri',
                'prenom' => 'Amine',
                'telephone' => '0661987654',
                'numero_permis' => '31/54321',
            ],
            [
                'nom' => 'Kaddour',
                'prenom' => 'Yacine',
                'telephone' => '0770456123',
                'numero_permis' => '19/00998',
            ],
        ];

        foreach ($conducteurs as $index => $data) {
            if (isset($vehiculeIds[$index])) {
                $data['vehicule_id'] = $vehiculeIds[$index];
                Conducteur::create($data);
            }
        }
    }
}