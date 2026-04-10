# Fleet Management System - CETIC SPA

![Laravel](https://img.shields.io/badge/laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 📌 Présentation du Projet
Développé dans le cadre d'un stage au sein du **CETIC (Groupe DIVINDUS)**, ce système de gestion de flotte est une solution complète de suivi en temps réel et de surveillance intelligente des véhicules. 

Le projet ne se contente pas d'afficher des positions GPS ; il intègre un moteur d'analyse comportementale capable de détecter des anomalies de trajet et des sorties de zones autorisées (Geofencing).

## 🚀 Fonctionnalités Clés
- **Suivi Temps Réel** : Visualisation en direct des véhicules sur une carte interactive via WebSockets (Laravel Reverb).
- **Moteur d'Alertes Intelligent** :
    - Détection d'excès de vitesse (>120 km/h).
    - Sortie de zone permanente (Wilayas autorisées par polygone).
    - Détection de déviation latérale (Calcul de distance point-ligne).
    - Analyse de progression (Vérification si le véhicule s'éloigne de sa cible).
    - Détection d'immobilité prolongée.
- **Gestion des Missions** : Cycle de vie complet (En attente -> En route -> Sur site -> En retour -> Clôturée).
- **Simulation de Trajet Haute Résolution** : Commandes Artisan permettant de simuler des trajets réels (Alger-Chlef, Alger-Médéa) via l'API OSRM avec interpolation de points pour une fluidité maximale.
- **Administration** : Gestion des chauffeurs, des véhicules et des affectations.

## 🛠 Stack Technique
- **Backend** : Laravel 13 , PHP 8.2+
- **Frontend** : React 18, Vite, Tailwind CSS, Lucide React
- **Base de données** : PostgreSQL (avec support JSON pour les zones géographiques)
- **Real-time** : Laravel Reverb (WebSockets)
- **Cartographie** : Leaflet.js / OpenStreetMap & OSRM API

## ⚙️ Installation

1. **Cloner le projet** :
   ```bash
   git clone [https://github.com/issam-belkada/fleet-management-system.git](https://github.com/issam-belkada/fleet-management-system.git)
   cd fleet-management-system

## Configuration Backend : 
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```
**Lancer le server** : 
```bash
php artisan serve
```
**Lancer les WebSockets** : 
```bash
php artisan reverb:start
```

## Configuration Frontend :
```bash
npm install
npm run dev
```

## Simulation de test :
**Simuler un trajet -> Chlef (4000 points, 0.5s d'intervalle)**
```bash
php artisan fleet:chlef {vehicle_id}
```
**Simuler un trajet -> Médéa (2000 points, détection de déviation)**
```bash
php artisan fleet:medea {vehicle_id}
```
