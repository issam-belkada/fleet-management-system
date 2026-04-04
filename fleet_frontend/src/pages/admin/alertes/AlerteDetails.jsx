import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import { 
    AlertOctagon, ArrowLeft, MapPin, Gauge, 
    Calendar, Truck, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import L from 'leaflet';
import axiosClient from '../../../api/axios.js';

// Marker personnalisé pour le lieu de l'incident
const alertIcon = L.divIcon({
    className: 'alert-marker',
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div class="relative w-8 h-8 bg-red-600 border-4 border-white rounded-full shadow-xl flex items-center justify-center">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

export default function AlerteDetails() {
    const { id } = useParams();
    const [alerte, setAlerte] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosClient.get(`/alertes/${id}`)
            .then(res => setAlerte(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading || !alerte) return <div className="p-20 text-center font-bold animate-pulse uppercase tracking-widest text-slate-400">Analyse de l'incident...</div>;

    const incidentPos = [alerte.latitude, alerte.longitude];
    
    // Logique pour déterminer quelle zone afficher sur la carte
    const renderZone = () => {
        if (alerte.type_alerte === 'sortie_zone_mission' && alerte.mission) {
            return (
                <Circle 
                    center={[alerte.mission.zone_lat, alerte.mission.zone_lng]} 
                    radius={alerte.mission.zone_rayon_m} 
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} 
                />
            );
        }
        // Ajoute ici la zone permanente si elle est définie dans ton modèle Véhicule ou Mission
        return null;
    };

    return (
        <div className="p-8 bg-[#fcfcfc] min-h-screen font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <Link to={-1} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                        <ArrowLeft size={20} className="text-slate-600"/>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Détails de l'Alerte</h1>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${alerte.acquittee ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                                {alerte.acquittee ? 'Traitée' : 'Critique'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} className="text-red-500"/> Réf: ALRT-{alerte.id} • {new Date(alerte.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Cartes d'infos (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Diagnostic Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Diagnostic Système</p>
                            <h2 className="text-xl font-black text-slate-800 mb-4 leading-tight">
                                {alerte.type_alerte.replace(/_/g, ' ')}
                            </h2>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600">
                                "{alerte.message}"
                            </div>
                        </div>
                        <AlertOctagon className="absolute -right-6 -bottom-6 text-slate-50" size={140} />
                    </div>

                    {/* Données de l'incident */}
                    <div className="grid grid-cols-1 gap-4">
                        <InfoBox 
                            icon={<Truck size={18}/>} 
                            label="Véhicule" 
                            value={alerte.vehicule.immatriculation} 
                            sub={alerte.vehicule.marque} 
                        />
                        {alerte.type_alerte === 'exces_vitesse' && (
                             <InfoBox 
                                icon={<Gauge size={18}/>} 
                                label="Vitesse Détectée" 
                                value={`${extractVitesse(alerte.message)} km/h`} 
                                sub="Limite autorisée dépassée" 
                                color="red"
                            />
                        )}
                        <InfoBox 
                            icon={<MapPin size={18}/>} 
                            label="Localisation" 
                            value="Coordonnées GPS" 
                            sub={`${alerte.latitude.toFixed(4)}, ${alerte.longitude.toFixed(4)}`} 
                        />
                    </div>
                </div>

                {/* Map (8 cols) */}
                <div className="lg:col-span-8 bg-white p-3 rounded-[3rem] shadow-xl border border-white h-[600px] relative">
                    <MapContainer center={incidentPos} zoom={15} className="h-full w-full rounded-[2.6rem]">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {/* Zone de l'incident (Cercle de mission ou périmètre) */}
                        {renderZone()}

                        {/* Position de l'alerte */}
                        <Marker position={incidentPos} icon={alertIcon}>
                            <Popup>
                                <div className="text-center font-bold text-xs p-1">Lieu de l'incident</div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

// Helper pour extraire la vitesse du message (si stockée dedans)
function extractVitesse(message) {
    const match = message.match(/(\d+)\s*km\/h/);
    return match ? match[1] : "N/A";
}

function InfoBox({ icon, label, value, sub, color = "slate" }) {
    const colors = {
        slate: "bg-slate-50 text-slate-600",
        red: "bg-red-50 text-red-600",
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-5">
            <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-base font-black text-slate-800">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{sub}</p>
            </div>
        </div>
    );
}