import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icône personnalisée pour les alertes (Rouge)
const alerteIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const RecenterMap = ({ position }) => {
    const map = useMap();
    if (position) map.setView(position, 15, { animate: true });
    return null;
};

const MissionDetails = ({ data }) => {
    const [mapFocus, setMapFocus] = useState(null);

    // Guard Clause
    if (!data || !data.mission) {
        return <div className="p-10 text-center font-sans text-slate-500">Chargement de la mission...</div>;
    }

    const { mission, positions = [] } = data;
    const path = positions.map(p => [p.latitude, p.longitude]);
    
    // Position de la zone de destination
    const destinationCoords = [mission.zone_lat, mission.zone_lng];
    
    // Centre de la carte : soit la destination, soit le début du trajet
    const centerMap = path.length > 0 ? path[0] : destinationCoords;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-50 p-4 gap-4 font-sans text-slate-900">
            
            {/* Sidebar Gauche */}
            <div className="lg:w-1/3 flex flex-col gap-4 overflow-hidden">
                
                {/* Header Mission */}
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Mission ID: #{mission.id}</span>
                            <h2 className="text-xl font-black text-slate-800">{mission.nom}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                mission.statut === 'terminee' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {mission.statut}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono italic">{mission.phase}</span>
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{mission.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Véhicule</p>
                            <p className="text-xs font-bold">{mission.vehicule?.marque} {mission.vehicule?.modele}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Destination</p>
                            <p className="text-xs font-bold text-blue-600">{mission.wilaya_destination}</p>
                        </div>
                    </div>
                </div>

                {/* Liste des Alertes / Erreurs */}
                <div className="bg-white rounded-2xl shadow-sm p-5 flex-grow border border-slate-200 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Alertes & Incidents
                    </h3>
                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {mission.alertes && mission.alertes.length > 0 ? (
                            mission.alertes.map((alerte, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setMapFocus([alerte.latitude, alerte.longitude])}
                                    className="p-3 rounded-xl border border-red-50 bg-red-50/30 hover:bg-red-50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-red-700">{alerte.type || "Violation de zone"}</p>
                                        <span className="text-[9px] text-red-400">{new Date(alerte.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">{alerte.message || "Position hors périmètre autorisé."}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 text-xs py-10 italic">Aucune alerte enregistrée</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Carte à droite */}
            <div className="lg:flex-grow h-[500px] lg:h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative">
                <MapContainer center={centerMap} zoom={12} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <RecenterMap position={mapFocus} />

                    {/* Le trajet parcouru */}
                    <Polyline positions={path} color="#3b82f6" weight={5} opacity={0.7} />

                    {/* Zone de destination (Cercle de géofencing) */}
                    <Circle 
                        center={destinationCoords} 
                        radius={mission.zone_rayon_m || 500} 
                        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                    >
                        <Popup>Zone d'arrivée : {mission.wilaya_destination}</Popup>
                    </Circle>

                    {/* Marqueurs pour les Alertes */}
                    {mission.alertes?.map((alerte, idx) => (
                        <Marker 
                            key={idx} 
                            position={[alerte.latitude, alerte.longitude]} 
                            icon={alerteIcon}
                        >
                            <Popup>
                                <div className="text-xs">
                                    <strong className="text-red-600">{alerte.type}</strong><br/>
                                    {alerte.message}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Point actuel du véhicule (Dernière position connue) */}
                    {path.length > 0 && (
                        <Marker position={path[path.length - 1]}>
                            <Popup>Position actuelle du véhicule</Popup>
                        </Marker>
                    )}
                </MapContainer>
                
                {/* Overlay légende carte */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] shadow-sm border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                        <div className="w-4 h-1 bg-blue-600"></div> Trajet parcouru
                    </div>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <div className="w-3 h-3 rounded-full border-2 border-green-600 bg-green-200/50"></div> Zone d'arrivée
                    </div>
                    <div className="flex items-center gap-2 text-red-600 font-bold">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div> Alerte d'incident
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionDetails;