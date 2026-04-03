<?php

namespace Database\Seeders;

use App\Models\Vehicule;
use Illuminate\Database\Seeder;

class VehiculeSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'immatriculation' => '00123-122-16',
                'marque' => 'Toyota',
                'modele' => 'Hilux',
                'couleur' => 'Blanc',
                'statut' => 'assignee',
                'zones_autorisees' => json_encode([1, 2, 3, 4]), // Alger, Tipaza, Blida
                'last_lat' => 36.7538,
                'last_lng' => 3.0588,
            ],
            [
                'immatriculation' => '05541-115-31',
                'marque' => 'Dacia',
                'modele' => 'Duster',
                'couleur' => 'Gris Cassiopée',
                'statut' => 'assignee',
                'zones_autorisees' => json_encode([1, 2, 3, 4]), // Oran, SBA, Tlemcen
                'last_lat' => 35.6987,
                'last_lng' => -0.6359,
            ],
            [
                'immatriculation' => '09872-120-19',
                'marque' => 'Renault',
                'modele' => 'Master',
                'couleur' => 'Blanc',
                'statut' => 'en_mission', // Will map to 'assignee' in your enum or custom logic
                'statut' => 'assignee',
                'zones_autorisees' => json_encode([1, 2, 3, 4]), // Setif, Constantine, Batna
                'last_lat' => 36.1898,
                'last_lng' => 5.4108,
            ],
            [
                'immatriculation' => '11223-123-16',
                'marque' => 'Volkswagen',
                'modele' => 'Golf 8',
                'couleur' => 'Noir',
                'statut' => 'non_assignee',
                'zones_autorisees' => json_encode([1, 2, 3, 4]),
                'last_lat' => 36.7000,
                'last_lng' => 3.2100,
            ],
            [
                'immatriculation' => '00456-118-16',
                'marque' => 'Peugeot',
                'modele' => 'Partner',
                'couleur' => 'Bleu',
                'statut' => 'en_maintenance',
                'zones_autorisees' => json_encode([1, 2, 3, 4]),
                'last_lat' => 36.7322,
                'last_lng' => 3.0871,
            ],
        ];

        foreach ($data as $item) {
            Vehicule::create($item);
        }
    }
}
