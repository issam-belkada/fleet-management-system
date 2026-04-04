import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { 
    AlertOctagon, ArrowLeft, MapPin, Gauge, 
    User, Truck, ShieldAlert, Construction, 
    Calendar, Briefcase, Phone, CreditCard, CheckCircle2
} from 'lucide-react';
import L from 'leaflet';
import axiosClient from '../../../api/axios.js';
import toast from 'react-hot-toast';

const alertIcon = L.divIcon({
    className: 'alert-marker',
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-red-600 rounded-full animate-ping opacity-20"></div>
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
    const [address, setAddress] = useState("Localisation de l'adresse...");
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const json = await res.json();
            setAddress(json.display_name || `${lat}, ${lng}`);
        } catch (err) {
            setAddress("Service de localisation indisponible");
        }
    };

    const fetchAlerte = () => {
        axiosClient.get(`/alertes/${id}`)
            .then(res => {
                setAlerte(res.data);
                fetchAddress(res.data.latitude, res.data.longitude);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAlerte();
    }, [id]);

    const handleAcquitter = async () => {
        setIsProcessing(true);
        try {
            await axiosClient.put(`/alertes/${id}/acquitter`);
            toast.success("Alerte acquittée avec succès");
            fetchAlerte(); // Rafraîchir les données
        } catch (err) {
            toast.error("Erreur lors de l'acquittement");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading || !alerte) return (
        <div className="h-screen flex items-center justify-center bg-white uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
            Analyse de l'incident...
        </div>
    );

    const incidentPos = [alerte.latitude, alerte.longitude];
    const chauffeur = alerte.mission?.conducteur || alerte.vehicule?.conducteur;

    return (
        <div className="p-8 bg-[#fdfdfd] min-h-screen font-sans antialiased text-slate-900">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div className="flex items-center gap-6">
                    <Link to={-1} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <ArrowLeft size={20} className="text-slate-600"/>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Rapport d'Incident</h1>
                            <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase ${alerte.acquittee ? 'bg-green-100 text-green-700' : 'bg-red-600 text-white animate-pulse'}`}>
                                {alerte.acquittee ? 'Traité' : 'Alerte Critique'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} className="text-red-500"/> ID-SYSTEM: {alerte.id} • Signalé le {new Date(alerte.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {!alerte.acquittee && (
                    <button 
                        onClick={handleAcquitter}
                        disabled={isProcessing}
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                        <CheckCircle2 size={18} />
                        {isProcessing ? 'Traitement...' : 'Marquer comme traité'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- COLONNE GAUCHE (6 COLS) --- */}
                <div className="lg:col-span-6 space-y-6">
                    
                    {/* Alerte & Localisation */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <AlertOctagon className="absolute -right-6 -bottom-6 text-white/5 group-hover:rotate-12 transition-transform duration-1000" size={180} />
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 font-mono">Status: {alerte.type_alerte}</p>
                        <h2 className="text-2xl font-black mb-6 leading-tight uppercase">
                            {alerte.type_alerte.replace(/_/g, ' ')}
                        </h2>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-start gap-4 bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <MapPin className="text-red-500 shrink-0" size={24}/>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Position détectée lors de l'alerte</p>
                                    <p className="text-sm font-medium leading-relaxed italic">"{address}"</p>
                                </div>
                            </div>

                            {alerte.type_alerte === 'sortie_zone_permanente' && (
                                <div className="flex items-start gap-4 bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30">
                                    <Construction className="text-amber-500 shrink-0" size={20}/>
                                    <div>
                                        <p className="text-[9px] font-bold text-amber-500 uppercase">Avis de Restriction</p>
                                        <p className="text-xs font-black text-amber-100">Zone autorisée : Alger, Tipaza, Boumerdès, Blida</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Chauffeur & Véhicule */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <User size={20}/>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Conducteur</p>
                                    <p className="text-sm font-black text-slate-800">{chauffeur?.nom} {chauffeur?.prenom}</p>
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-slate-50 pt-4">
                                <p className="text-[10px] flex items-center gap-2 font-bold text-slate-500"><Phone size={12}/> {chauffeur?.telephone || 'N/A'}</p>
                                <p className="text-[10px] flex items-center gap-2 font-bold text-slate-500"><CreditCard size={12}/> Permis: {chauffeur?.numero_permis || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                                    <Truck size={20}/>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Véhicule</p>
                                    <p className="text-sm font-black text-slate-800">{alerte.vehicule?.immatriculation}</p>
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-slate-50 pt-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{alerte.vehicule?.marque} {alerte.vehicule?.modele}</p>
                                <p className="text-[10px] font-bold text-slate-400 italic">Couleur: {alerte.vehicule?.couleur || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Détails Mission */}
                    {alerte.mission_id && (
                        <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 border-dashed">
                            <div className="flex items-center gap-3 mb-6">
                                <Briefcase className="text-blue-600" size={20}/>
                                <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Mission Associée</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Nom Mission</p>
                                    <p className="text-sm font-bold text-slate-800">{alerte.mission?.nom}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Destination</p>
                                    <p className="text-sm font-bold text-slate-800">{alerte.mission?.wilaya_destination}</p>
                                </div>
                                <div className="col-span-2 flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100">
                                    <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><Calendar size={14}/> Début: {new Date(alerte.mission?.date_debut).toLocaleDateString()}</p>
                                    <Link to={`/admin/missions/${alerte.mission_id}`} className="text-[10px] font-black text-blue-600 hover:underline">DÉTAILS →</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- CARTE --- */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white p-3 rounded-[3rem] shadow-xl border border-slate-50 h-[650px] relative overflow-hidden">
                        <MapContainer center={incidentPos} zoom={15} className="h-full w-full rounded-[2.6rem]">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {alerte.mission && (
                                <Circle 
                                    center={[alerte.mission.zone_lat, alerte.mission.zone_lng]} 
                                    radius={alerte.mission.zone_rayon_m} 
                                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '8, 8' }} 
                                />
                            )}
                            <Marker position={incidentPos} icon={alertIcon}>
                                <Popup><div className="text-center font-bold text-xs p-1">Lieu de l'incident</div></Popup>
                            </Marker>
                        </MapContainer>
                    </div>

                    {/* Info Acquittement */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center italic font-serif">i</div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[250px]">
                                {alerte.acquittee 
                                    ? `Acquittée le ${new Date(alerte.acquittee_le).toLocaleString()}` 
                                    : "En attente d'intervention de l'administrateur"}
                            </p>
                         </div>
                         {alerte.type_alerte === 'exces_vitesse' && (
                             <div className="text-right">
                                 <p className="text-[10px] font-black text-red-500 uppercase italic mb-1 flex items-center gap-1"><Gauge size={12}/> Vitesse relevée</p>
                                 <p className="text-xl font-black text-slate-800">85 <span className="text-xs text-slate-400">km/h</span></p>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}