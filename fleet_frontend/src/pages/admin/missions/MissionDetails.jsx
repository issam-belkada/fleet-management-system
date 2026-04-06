import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { 
    Flag, User, Calendar, AlertTriangle, Navigation, 
    ArrowLeft, Activity, MapPin, ShieldCheck, 
    Target, Truck, Hash, Timer, Info, Map as MapIcon
} from 'lucide-react';
import L from 'leaflet';
import { echo } from '../../../api/echo.js';
import axiosClient from '../../../api/axios.js';

// --- CUSTOM MARKERS ---
const currentPosIcon = L.divIcon({
    className: 'current-pos-marker',
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <div class="relative w-6 h-6 bg-blue-600 border-4 border-white rounded-full shadow-2xl"></div>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

const destinationIcon = L.divIcon({
    className: 'dest-marker',
    html: `<div class="bg-slate-900 p-2 rounded-xl border-2 border-white shadow-lg">
            <Flag size={16} stroke="white" fill="white" />
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center?.[0] && center?.[1]) map.panTo(center, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function MissionDetails() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapFocus, setMapFocus] = useState(null);
    const [address, setAddress] = useState("Recherche de l'adresse...");

    // Fonction pour récupérer l'adresse textuelle via Nominatim
    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const json = await res.json();
            setAddress(json.display_name || "Adresse inconnue");
        } catch (err) {
            setAddress("Erreur de localisation");
        }
    };

    const fetchData = async () => {
        try {
            const response = await axiosClient.get(`/missions/${id}`);
            setData(response.data);
            // On cherche l'adresse dès qu'on a les coordonnées de destination
            if (response.data.mission) {
                fetchAddress(response.data.mission.zone_lat, response.data.mission.zone_lng);
            }
        } catch (err) {
            console.error("API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    useEffect(() => {
        if (!data || data.mission.statut !== 'active') return;
        console.log('data', data);
        const channel = echo.channel(`mission.${id}`)
            .listen('.position.updated', (e) => {
                const newPos = {
                    latitude: parseFloat(e.lat),
                    longitude: parseFloat(e.lng),
                    created_at: e.updated_at
                };
                console.log('Received position update via Echo:',newPos);
                setData(prev => ({ ...prev, positions: [...prev.positions, newPos] }));
                console.log("Position mise à jour reçue via Echo:", newPos);
                setMapFocus([newPos.latitude, newPos.longitude]);
            });
        return () => echo.leaveChannel(`mission.${id}`);
    }, [id, data?.mission.statut]);

    if (loading && !data) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Activity size={20} className="text-blue-600 animate-pulse"/></div>
            </div>
            <p className="font-bold text-slate-400 text-[10px] tracking-[0.4em] uppercase">Fleet OS Intelligence</p>
        </div>
    );

    if (!data?.mission) return <div className="p-20 text-center font-black text-red-500 uppercase">Mission Introuvable</div>;

    const { mission, positions } = data;
    const trackPath = positions.map(p => [p.latitude, p.longitude]);
    const destination = [mission.zone_lat, mission.zone_lng];
    const isActive = mission.statut === 'active';
    const lastPos = trackPath.length > 0 
        ? trackPath[trackPath.length - 1] 
        : [parseFloat(mission.vehicule.last_lat) || 0, parseFloat(mission.vehicule.last_lng) || 0];

    return (
        <div className="p-8 bg-[#fdfdfd] min-h-screen font-sans text-slate-900 overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-6">
                    <Link to="/admin/missions" className="p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <ArrowLeft size={20} className="text-slate-600"/>
                    </Link>
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <h1 className="text-3xl font-black tracking-tight text-slate-800">{mission.nom}</h1>
                            <StatusBadge status={mission.statut} />
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            {isActive && (
                                <>
                                    <span className="flex items-center gap-1.5"><Hash size={13} className="text-blue-500"/> {mission.id}</span>
                                    <span className="flex items-center gap-1.5"><Activity size={13} className="text-blue-500"/> {mission.phase.replace('_', ' ')}</span>
                                </>
                            )}
                            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-blue-500"/> {mission.wilaya_destination}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase">Sync Status</p>
                        <p className="text-xs font-bold text-slate-600">{new Date(mission.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Info size={18}/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- SIDEBAR --- */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Destination Address Card */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <MapIcon className="absolute -right-8 -bottom-8 text-white/5 group-hover:rotate-12 transition-transform duration-1000" size={200} />
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Adresse de Destination</p>
                        <h2 className="text-xl font-bold leading-tight mb-6 relative z-10">
                            {address.split(',').slice(0, 3).join(',')}
                        </h2>
                        <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/5 inline-flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg"><Target size={16}/></div>
                            <div>
                                <p className="text-[9px] font-bold text-blue-300 uppercase">Rayon de zone</p>
                                <p className="text-sm font-black">{mission.zone_rayon_m / 1000} KM</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SmallStat icon={<Truck size={18}/>} label="Véhicule" value={mission.vehicule.immatriculation} sub={mission.vehicule.marque} color="blue" />
                        <SmallStat icon={<User size={18}/>} label="Conducteur" value={mission.conducteur.nom} sub={mission.conducteur.telephone} color="indigo" />
                        <SmallStat icon={<Calendar size={18}/>} label="Début" value={new Date(mission.date_debut).toLocaleDateString()} sub={new Date(mission.date_debut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} color="amber" />
                        <SmallStat icon={<AlertTriangle size={18}/>} label="Alertes" value={mission.alertes.length} sub="Log système" color="red" />
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Timer size={16}/></div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Planification</h3>
                        </div>
                        <div className="space-y-6 ml-2">
                            <div className="relative pl-6 border-l-2 border-slate-50">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Départ Prévu</p>
                                <p className="text-sm font-bold text-slate-700">{new Date(mission.date_debut).toLocaleString([], {dateStyle:'medium', timeStyle:'short'})}</p>
                            </div>
                            <div className="relative pl-6 border-l-2 border-slate-50">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-4 border-slate-200 rounded-full"></div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Arrivée Estimée</p>
                                <p className="text-sm font-bold text-slate-700">{new Date(mission.date_fin).toLocaleString([], {dateStyle:'medium', timeStyle:'short'})}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAP --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-3 rounded-[3rem] shadow-xl border border-slate-50 h-[650px] relative">
                        <MapContainer center={lastPos} zoom={13} className="h-full w-full rounded-[2.6rem] z-0">
                            <TileLayer 
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                            />
                            
                            <Polyline positions={trackPath} pathOptions={{ color: '#2563eb', weight: 5, opacity: 1, lineCap: 'round' }} />
                            <Circle center={destination} radius={mission.zone_rayon_m} pathOptions={{ color: '#103db9', fillColor: '#103db9', fillOpacity: 0.3, weight: 2, dashArray: '10, 10' }} />

                            <Marker position={destination} icon={destinationIcon}>
                                <Popup>
                                    <div className="p-2 text-center">
                                        <p className="font-black text-[10px] uppercase text-blue-600 mb-1">Cible</p>
                                        <p className="text-xs font-bold">{mission.wilaya_destination}</p>
                                    </div>
                                </Popup>
                            </Marker>

                            <Marker position={lastPos} icon={currentPosIcon} />
                            <MapController center={mapFocus || lastPos} />
                        </MapContainer>

                        <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-3">
                            <button onClick={() => setMapFocus(lastPos)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all group">
                                <Navigation size={20} className="group-hover:rotate-12 transition-transform"/>
                            </button>
                            <button onClick={() => setMapFocus(destination)} className="p-4 bg-white text-slate-600 rounded-2xl shadow-2xl hover:bg-slate-50 transition-all">
                                <Flag size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Alerts Horizontal Slider */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"><AlertTriangle size={20}/></div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Journal des Alertes</h3>
                            </div>
                            <div className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase italic">
                                {mission.alertes.length} Active events
                            </div>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {mission.alertes.length > 0 ? (
                                mission.alertes.map(alerte => (
                                    <div key={alerte.id} className="min-w-[320px] p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:border-red-200 transition-all group">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(alerte.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{alerte.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full flex items-center justify-center py-10 text-slate-300 gap-4 italic font-medium">
                                    <ShieldCheck size={24} className="text-green-500"/> Analyse système : Aucun incident critique
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- HELPERS ---

function StatusBadge({ status }) {
    const config = {
        en_attente: "bg-slate-100 text-slate-600",
        active: "bg-blue-600 text-white shadow-lg shadow-blue-200 animate-pulse",
        terminee: "bg-green-500 text-white",
        annulee: "bg-red-50 text-red-600"
    };
    return (
        <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] ${config[status]}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function SmallStat({ icon, label, value, sub, color }) {
    const themes = {
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
        indigo: "bg-indigo-50 text-indigo-600",
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-50 hover:shadow-xl transition-all duration-300">
            <div className={`w-10 h-10 ${themes[color]} rounded-2xl flex items-center justify-center mb-5`}>
                {icon}
            </div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-slate-800 truncate">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
        </div>
    );
}