<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class WilayaZoneSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/map.geojson');

        if (!File::exists($path)) {
            $this->command->error("Fichier introuvable : $path");
            return;
        }

        $data = json_decode(File::get($path), true);

        // Mapping des noms du fichier GeoJSON vers les codes officiels
        $wilayaMapping = [
            'Alger'     => 16,
            'Blida'     => 9,
            'Boumerdes' => 35,
            'Tipaza'    => 42,
        ];

        $count = 0;

        foreach ($data['features'] as $feature) {
            $nameInFile = $feature['properties']['adm1_name'];

            // On vérifie si le nom dans le fichier existe dans notre mapping
            if (array_key_exists($nameInFile, $wilayaMapping)) {

                DB::table('zones_wilayas')->insert([
                    'nom'         => $nameInFile,
                    'code_wilaya' => $wilayaMapping[$nameInFile], // Utilise le code manuel
                    'polygone'    => json_encode($feature['geometry']),
                    'created_at'  => now(),
                ]);

                $count++;
            }
        }

        $this->command->info("Seeder terminé : $count wilayas insérées avec les codes officiels.");
    }
}
