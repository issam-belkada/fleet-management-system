import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { 
    Car, User, Calendar, AlertTriangle, Navigation, 
    ArrowLeft, History, Activity, MapPin, Clock, Gauge, 
    TrendingUp, Info, CheckCircle2, AlertCircle 
} from 'lucide-react';
import L from 'leaflet';
import { echo } from '../../../api/echo.js';
import axiosClient from '../../../api/axios.js';

// --- CONFIGURATION ICÔNE GPS ---
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

// Contrôleur pour centrer la carte dynamiquement
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center?.[0] && center?.[1]) map.panTo(center, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function VehiculeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    const isToday = date === new Date().toISOString().split('T')[0];

    // Récupération des données (Positions du jour + Alertes Hybrides)
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

    // WebSocket : Mise à jour en temps réel via Laravel Reverb
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

                        return {
                            ...prev,
                            positions: [...prev.positions, newPos],
                            stats: { 
                                ...prev.stats, 
                                en_mouvement: true,
                                vitesse_max: Math.max(prev.stats.vitesse_max, newVitesse),
                                derniere_vitesse: newVitesse,
                                is_historical: false 
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
        <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400 animate-pulse uppercase tracking-widest">
            Synchronisation du flux GPS...
        </div>
    );

    const trackPath = data?.positions.map(p => [p.latitude, p.longitude]) || [];
    const lastPos = trackPath.length > 0 ? trackPath[trackPath.length - 1] : [36.7538, 3.0588];

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans antialiased">
            
            {/* HEADER SECTION */}
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
                                    LIVE
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{data?.vehicule.marque} {data?.vehicule.modele}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <History size={18} className="text-slate-400 ml-2"/>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="outline-none text-sm font-black text-slate-700 bg-transparent p-2 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                <div className="space-y-6">
                    <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <Gauge className="absolute -right-6 -bottom-6 text-white/5" size={140} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Vitesse Actuelle</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tabular-nums">{data?.stats.derniere_vitesse || 0}</span>
                            <span className="text-slate-500 font-bold italic text-sm uppercase">km/h</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <StatCard label="Vitesse Max" value={`${data?.stats.vitesse_max} km/h`} icon={<TrendingUp size={16}/>} color="amber" />
                        <StatCard label="Moyenne" value={`${data?.stats.vitesse_moyenne} km/h`} icon={<Activity size={16}/>} color="blue" />
                        <StatCard 
                            label="À Traiter" 
                            value={data?.stats.total_non_acquittees} 
                            icon={<AlertTriangle size={16}/>} 
                            color={data?.stats.total_non_acquittees > 0 ? "red" : "blue"} 
                        />
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Conducteur</h3>
                        {data?.vehicule.conducteur ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
                                    {data.vehicule.conducteur.nom[0]}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none mb-1">
                                        {data.vehicule.conducteur.prenom} {data.vehicule.conducteur.nom}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold">{data.vehicule.conducteur.telephone}</p>
                                </div>
                            </div>
                        ) : <p className="text-xs text-slate-400 italic">Non assigné</p>}
                    </div>
                </div>

                {/* MAP COL */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-2 rounded-[3rem] shadow-2xl border border-white h-[620px] relative">
                        {data?.stats.is_historical && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black shadow-2xl flex items-center gap-2 border-2 border-white animate-bounce">
                                <Clock size={14}/>
                                ARCHIVES : DERNIÈRE POSITION DU {new Date(data.positions[0].created_at).toLocaleDateString()}
                            </div>
                        )}

                        <MapContainer center={lastPos} zoom={15} className="h-full w-full rounded-[2.8rem] z-0">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {trackPath.length > 0 && (
                                <>
                                    {trackPath.length > 1 && !data?.stats.is_historical && (
                                        <Polyline positions={trackPath} pathOptions={{ color: '#2532eb', weight: 6, opacity: 0.8, lineCap: 'round' }} />
                                    )}
                                    <Marker position={lastPos} icon={currentPosIcon}>
                                        <Popup>
                                            <div className="current-pos-marker">
                                                <p className="font-black text-blue-600 text-lg">{data?.stats.derniere_vitesse} km/h</p>
                                                <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">
                                                    {data?.stats.is_historical ? "Dernière vue" : "Vitesse actuelle"}
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </>
                            )}
                            <MapController center={lastPos} />
                        </MapContainer>
                    </div>
                </div>

                {/* ALERTS COL */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Journal d'Alertes</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Status & Historique</p>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                data?.stats.total_non_acquittees > 0 
                                ? "bg-red-500 text-white animate-pulse" 
                                : "bg-slate-100 text-slate-500"
                            }`}>
                                {data?.alertes.length}
                            </span>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[520px] pr-2 custom-scrollbar">
                            {data?.alertes.length > 0 ? (
                                data.alertes.map(alerte => (
                                    <div 
                                        key={alerte.id} 
                                        onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                                        className={`p-4 border-l-4 transition-all cursor-pointer hover:bg-slate-50 rounded-r-2xl border-y border-r border-slate-50 ${
                                            alerte.acquittee 
                                            ? "bg-white border-l-slate-200 opacity-60" 
                                            : "bg-red-50/50 border-l-red-500 shadow-sm ring-1 ring-red-100/50"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className={`text-[9px] font-black uppercase tracking-tight ${
                                                    alerte.acquittee ? "text-slate-400" : "text-red-600"
                                                }`}>
                                                    {alerte.type_alerte.replace(/_/g, ' ')}
                                                </p>
                                                {new Date(alerte.created_at).toDateString() !== new Date().toDateString() && (
                                                    <span className="text-[8px] font-black text-slate-400 italic">
                                                        📅 {new Date(alerte.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            {alerte.acquittee ? (
                                                <CheckCircle2 size={12} className="text-blue-500" />
                                            ) : (
                                                <AlertCircle size={12} className="text-red-500 animate-pulse" />
                                            )}
                                        </div>

                                        <p className={`text-xs font-bold leading-tight mb-3 ${
                                            alerte.acquittee ? "text-slate-500" : "text-slate-800"
                                        }`}>
                                            {alerte.message}
                                        </p>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black">
                                                <Clock size={10}/> 
                                                {new Date(alerte.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase ${
                                                alerte.acquittee ? "text-slate-300" : "text-red-500"
                                            }`}>
                                                {alerte.acquittee ? "Archivé" : "Urgente"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-20">
                                    <Activity size={48} className="mx-auto mb-2 text-slate-400"/>
                                    <p className="text-xs font-black uppercase tracking-tighter">Aucun incident détecté</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Composant pour les cartes de statistiques
function StatCard({ label, value, icon, color }) {
    const colors = {
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-500 shadow-red-50"
    };

    return (
        <div className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] flex items-center justify-between shadow-sm ${colors[color]}`}>
            <div>
                <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black tabular-nums">{value}</p>
            </div>
            <div className="opacity-40">{icon}</div>
        </div>
    );
}