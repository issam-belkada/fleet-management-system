import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { 
    Car, User, Calendar, AlertTriangle, Navigation, 
    ArrowLeft, History, Activity, MapPin, Clock, Gauge, TrendingUp
} from 'lucide-react';
import L from 'leaflet';
import { echo } from '../../../api/echo.js';
import axiosClient from '../../../api/axios.js';

// --- ICÔNE DE POSITION AVEC EFFET DE CHARGEMENT ---
const currentPosIcon = L.divIcon({
    className: 'current-pos-marker',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <div class="relative w-5 h-5 bg-blue-700 border-2 border-white rounded-full shadow-2xl"></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// Contrôleur pour suivre le véhicule sur la carte
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.panTo(center, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function VehiculeDetails() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    const isToday = date === new Date().toISOString().split('T')[0];

    // 1. Chargement des données (API Laravel)
    const fetchData = async (selectedDate) => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/vehicules/${id}?date=${selectedDate}`);
            setData(response.data);
        } catch (err) {
            console.error("Erreur API:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(date);
    }, [id, date]);

    // 2. Écoute Temps Réel (Reverb) pour la Vitesse et Position
    useEffect(() => {
        if (!isToday) return;

        const channel = echo.channel('fleet-tracking')
            .listen('.position.updated', (e) => {
                if (parseInt(e.id) === parseInt(id)) {
                    setData(prev => {
                        if (!prev) return prev;
                        
                        const newVitesse = parseFloat(e.vitesse || 0);
                        const newPos = {
                            latitude: parseFloat(e.lat),
                            longitude: parseFloat(e.lng),
                            vitesse: newVitesse,
                            created_at: new Date().toISOString()
                        };

                        // Mise à jour intelligente des stats en direct
                        const updatedPositions = [...prev.positions, newPos];
                        const newMax = Math.max(prev.stats.vitesse_max, newVitesse);
                        
                        return {
                            ...prev,
                            positions: updatedPositions,
                            stats: { 
                                ...prev.stats, 
                                en_mouvement: true,
                                vitesse_max: newMax,
                                derniere_vitesse: newVitesse
                            }
                        };
                    });
                }
            });

        return () => {
            channel.stopListening('.position.updated');
            echo.leaveChannel('fleet-tracking');
        };
    }, [id, isToday]);

    if (loading && !data) return (
        <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 animate-pulse">
            SYNCHRONISATION DES DONNÉES GPS...
        </div>
    );

    const trackPath = data?.positions.map(p => [p.latitude, p.longitude]) || [];
    const lastPos = trackPath.length > 0 ? trackPath[trackPath.length - 1] : [36.7538, 3.0588];

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans antialiased">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/vehicules" className="p-3 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all text-slate-600">
                        <ArrowLeft size={20}/>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{data?.vehicule.immatriculation}</h1>
                            {data?.stats.en_mouvement && isToday && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-green-200">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                    EN DIRECT
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{data?.vehicule.marque} {data?.vehicule.modele} • {data?.vehicule.couleur}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <History size={18} className="text-slate-400 ml-2"/>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="outline-none text-sm font-black text-slate-700 bg-transparent p-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* COLONNE GAUCHE: STATS VITESSE & INFOS */}
                <div className="space-y-6">
                    {/* Compteur de vitesse actuel */}
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                        <Gauge className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Vitesse Actuelle</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{data?.stats.derniere_vitesse || 0}</span>
                            <span className="text-slate-400 font-bold italic">km/h</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <StatCard label="Vitesse Max" value={`${data?.stats.vitesse_max} km/h`} icon={<TrendingUp size={16}/>} color="amber" />
                        <StatCard label="Vitesse Moyenne" value={`${data?.stats.vitesse_moyenne} km/h`} icon={<Activity size={16}/>} color="blue" />
                        <StatCard label="Alertes" value={data?.stats.nb_alertes_jour} icon={<AlertTriangle size={16}/>} color="red" />
                    </div>

                    {/* Conducteur */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Conducteur Assigné</h3>
                        {data?.vehicule.conducteur ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">{data.vehicule.conducteur.nom[0]}</div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm">{data.vehicule.conducteur.prenom} {data.vehicule.conducteur.nom}</p>
                                    <p className="text-xs text-slate-500 font-bold">{data.vehicule.conducteur.telephone}</p>
                                </div>
                            </div>
                        ) : <p className="text-xs text-slate-400 italic">Aucun chauffeur</p>}
                    </div>
                </div>

                {/* COLONNE MILIEU: CARTE DU TRAJET */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-white h-[600px] relative">
                        <MapContainer center={lastPos} zoom={15} className="h-full w-full rounded-[2.3rem] z-0">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {trackPath.length > 0 && (
                                <>
                                    <Polyline positions={trackPath} pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.5, lineCap: 'round' }} />
                                    <Marker position={trackPath[0]}><Popup>Départ</Popup></Marker>
                                    <Marker position={lastPos} icon={currentPosIcon}>
                                        <Popup>
                                            <div className="text-center font-black">
                                                <p className="text-blue-600 text-lg">{data?.stats.derniere_vitesse} km/h</p>
                                                <p className="text-[10px] text-slate-400 uppercase">Vitesse instantanée</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </>
                            )}
                            <MapController center={lastPos} />
                        </MapContainer>
                    </div>
                </div>

                {/* COLONNE DROITE: ALERTES DU JOUR */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Journal des Alertes</h3>
                        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {data?.alertes.length > 0 ? (
                                data.alertes.map(alerte => (
                                    <div key={alerte.id} className="p-4 bg-red-50/50 border-l-4 border-red-500 rounded-r-2xl">
                                        <p className="text-[9px] font-black text-red-600 uppercase mb-1">{alerte.type_alerte.replace('_', ' ')}</p>
                                        <p className="text-xs font-bold text-slate-700 leading-tight">{alerte.message}</p>
                                        <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-400 font-black">
                                            <Clock size={10}/> {new Date(alerte.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-20">
                                    <Activity size={48} className="mx-auto mb-2 text-slate-400"/>
                                    <p className="text-xs font-black uppercase tracking-tighter">Aucun incident</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sous-composant pour les cartes de stats
function StatCard({ label, value, icon, color }) {
    const colors = {
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-100"
    };

    return (
        <div className={`p-4 rounded-2xl border ${colors[color]} flex items-center justify-between shadow-sm transition-transform hover:scale-[1.02]`}>
            <div>
                <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black">{value}</p>
            </div>
            <div className="opacity-40">{icon}</div>
        </div>
    );
}