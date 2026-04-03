import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { Search, Info, ChevronRight, Navigation, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.marker.slideto'; // <--- IMPORTANT: Import du plugin
import { echo } from '../../api/echo.js';
import axiosClient from '../../api/axios.js';

// --- CONFIGURATION DES ICÔNES ---
const createCustomIcon = (status) => {
    const config = {
        'alerte': { color: '#ef4444', label: 'ALERTE', pulse: 'animate-ping' },
        'en_mission': { color: '#3b82f6', label: 'MISSION', pulse: '' },
        'libre': { color: '#22c55e', label: 'LIBRE', pulse: '' }
    };
    
    const { color, label, pulse } = config[status] || { color: '#64748b', label: 'INCONNU', pulse: '' };

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="flex flex-col items-center group">
                <div class="mb-1 px-2 py-0.5 bg-white rounded-md shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span class="text-[9px] font-black text-slate-700 uppercase leading-none">${label}</span>
                </div>
                <div class="relative flex items-center justify-center">
                    ${status === 'alerte' ? `<div class="absolute inset-0 rounded-full bg-red-400 ${pulse} opacity-75"></div>` : ''}
                    <div class="relative w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                    </div>
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

// --- COMPOSANT MARQUEUR ANIMÉ ---
// Ce composant gère la transition fluide entre deux points
function AnimatedMarker({ vehicle }) {
    const markerRef = useRef(null);
    const position = [parseFloat(vehicle.lat), parseFloat(vehicle.lng)];

    useEffect(() => {
        if (markerRef.current) {
            // .slideTo est fourni par leaflet-marker-slideto
            // 2000ms correspond au 'sleep(2)' de ton seeder Laravel
            markerRef.current.slideTo(position, {
                duration: 2000,
                keepAtCenter: false
            });
        }
    }, [vehicle.lat, vehicle.lng]); // Se déclenche quand les coords changent

    return (
        <Marker 
            ref={markerRef} 
            position={position} 
            icon={createCustomIcon(vehicle.etat_map)}
        >
            <Popup className="custom-popup" closeButton={false}>
                {/* ... Ton contenu de Popup identique ... */}
                <div className="w-72 bg-white rounded-3xl overflow-hidden shadow-2xl border-none">
                    <div className="p-5 bg-slate-900 text-white">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-black tracking-tight">{vehicle.immatriculation}</h3>
                            <StatusBadge status={vehicle.etat_map} inverted />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{vehicle.marque} • {vehicle.modele}</p>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-800 border border-slate-100">
                                {vehicle.conducteur?.nom?.[0]}{vehicle.conducteur?.prenom?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Chauffeur</p>
                                <p className="text-sm font-black text-slate-800">
                                    {vehicle.conducteur ? `${vehicle.conducteur.nom} ${vehicle.conducteur.prenom}` : 'Non assigné'}
                                </p>
                            </div>
                            {vehicle.conducteur?.telephone && (
                                <a href={`tel:${vehicle.conducteur.telephone}`} className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-all">
                                    <Phone size={18}/>
                                </a>
                            )}
                        </div>

                        {vehicle.mission_details && (
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Navigation size={14} className="text-blue-500 fill-blue-500/20"/>
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Mission Active</span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                    {vehicle.mission_details.type} <span className="text-blue-400 mx-1">→</span> {vehicle.mission_details.destination}
                                </p>
                            </div>
                        )}
                        
                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">
                            Voir le rapport détaillé <ChevronRight size={14}/>
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

// Composant pour recentrer la carte
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
}

export default function FleetMap() {
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tous');
    const [selectedPos, setSelectedPos] = useState(null);

    // Fetch initial
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const { data } = await axiosClient.get('/vehicules-map');
                setVehicles(data);
            } catch (err) {
                console.error("Error loading fleet:", err);
            }
        };
        fetchVehicles();
    }, []);

    // Reverb Real-time
    useEffect(() => {
        const channel = echo.channel('fleet-tracking')
            .listen('.position.updated', (e) => {
                setVehicles(prev => {
                    const currentList = Array.isArray(prev) ? prev : [];
                    const index = currentList.findIndex(v => v.id === e.id);
                    if (index !== -1) {
                        const newVehicles = [...currentList];
                        newVehicles[index] = { ...newVehicles[index], ...e };
                        return newVehicles;
                    }
                    return [...currentList, e];
                });
            });
        return () => {
            channel.stopListening('.position.updated');
            echo.leaveChannel('fleet-tracking');
        };
    }, []);

    const filteredVehicles = useMemo(() => {
        return (Array.isArray(vehicles) ? vehicles : []).filter(v => {
            const matchesSearch = v.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'Tous' || v.etat_map === filterStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [vehicles, searchTerm, filterStatus]);

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased">
            
            {/* Sidebar */}
            <div className="w-85 bg-white border-r border-slate-200 flex flex-col z-[1001] shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                        <Navigation className="text-blue-600 fill-blue-600/20" size={24}/>
                        Suivi Temps Réel
                    </h1>
                    
                    <div className="space-y-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Immatriculation..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                            {['Tous', 'Libre', 'Mission', 'Alerte'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                        filterStatus === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {filteredVehicles.map(v => (
                        <div 
                            key={v.id} 
                            onClick={() => setSelectedPos([parseFloat(v.lat), parseFloat(v.lng)])}
                            className="p-4 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-white group"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded-md uppercase tracking-widest">
                                    {v.immatriculation}
                                </span>
                                <StatusBadge status={v.etat_map} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 mb-3">{v.marque} {v.modele}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                                        <Info size={12} className="text-blue-500"/>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                                        {v.conducteur ? v.conducteur.nom : 'Inconnu'}
                                    </span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform"/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Carte */}
            <div className="flex-1 relative">
                <MapContainer 
                    center={[36.7538, 3.0588]} 
                    zoom={12} 
                    zoomControl={false}
                    className="h-full w-full"
                >
                    <TileLayer 
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    />
                    <ZoomControl position="bottomright" />
                    <RecenterMap position={selectedPos} />
                    
                    {filteredVehicles.map(v => (
                        <AnimatedMarker key={v.id} vehicle={v} />
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

function StatusBadge({ status, inverted = false }) {
    const config = {
        'alerte': { bg: 'bg-red-500', text: 'text-red-500', icon: <AlertTriangle size={12}/>, label: 'Alerte' },
        'en_mission': { bg: 'bg-blue-600', text: 'text-blue-600', icon: <Navigation size={12}/>, label: 'En Mission' },
        'libre': { bg: 'bg-green-500', text: 'text-green-500', icon: <CheckCircle2 size={12}/>, label: 'Disponible' }
    };
    const current = config[status] || config['libre'];
    
    if (inverted) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider">
                <span className={`w-2 h-2 rounded-full ${current.bg} animate-pulse`}></span>
                {current.label}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${current.text} bg-current/10 text-[10px] font-black uppercase tracking-tight`}>
            {current.icon} {current.label}
        </div>
    );
}