import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    User, Car, MapPin, AlertCircle, Calendar, 
    ChevronRight, Phone, ShieldCheck, Clock,
    Activity, CheckCircle2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import axiosClient from '../../../api/axios.js';

export default function ConducteurDetails() {
    const { id } = useParams();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDriverData = async () => {
            try {
                const { data } = await axiosClient.get(`/conducteurs/${id}`);
                setDriver(data);
            } catch (err) {
                console.error("Erreur lors du chargement du chauffeur:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDriverData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!driver) return <div className="p-10 text-center font-bold">Chauffeur introuvable.</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans antialiased">
            
            {/* Header avec bouton retour */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin/conducteurs" className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={20} className="text-slate-600"/>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dossier Chauffeur</h1>
                        <p className="text-slate-500 text-sm font-bold">ID Personnel: #{driver.id}</p>
                    </div>
                </div>
                {driver.stats.en_mission && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl animate-pulse">
                        <Activity size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">En Mission Actuellement</span>
                    </div>
                )}
            </div>

            {/* BARRE DE STATISTIQUES (Basée sur ton nouveau contrôleur) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Missions Totales" value={driver.stats.total_missions} icon={<Activity size={20}/>} color="blue" />
                <StatCard label="Missions Clôturées" value={driver.stats.missions_cloturees} icon={<CheckCircle2 size={20}/>} color="green" />
                <StatCard label="Alertes (Total)" value={driver.stats.total_alertes} icon={<AlertTriangle size={20}/>} color="amber" />
                <StatCard label="Alertes Actives" value={driver.stats.alertes_non_acquittees} icon={<AlertCircle size={20}/>} color="red" critical={driver.stats.alertes_non_acquittees > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLONNE GAUCHE: INFOS PRO & VÉHICULE */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Profil Conducteur</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                {driver.nom[0]}{driver.prenom[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{driver.prenom} {driver.nom}</h2>
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
                                    <ShieldCheck size={14} className="text-blue-500"/> Permis: {driver.numero_permis}
                                </p>
                            </div>
                        </div>
                        <a href={`tel:${driver.telephone}`} className="w-full py-3 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-slate-700 font-bold hover:bg-slate-100 transition-colors">
                            <Phone size={16}/> {driver.telephone}
                        </a>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Véhicule Assigné</h3>
                        {driver.vehicule ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg">{driver.vehicule.immatriculation}</span>
                                    <span className="text-xs font-black text-slate-400 uppercase">{driver.vehicule.statut}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-sm font-black text-slate-800">{driver.vehicule.marque} {driver.vehicule.modele}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Couleur: {driver.vehicule.couleur}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">Aucun véhicule rattaché.</p>
                        )}
                    </div>
                </div>

                {/* COLONNE CENTRE: HISTORIQUE MISSIONS */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600"/> Missions
                    </h3>
                    <div className="space-y-4">
                        {driver.missions.map(mission => (
                            <div key={mission.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-black text-slate-900 leading-tight">{mission.nom}</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                        mission.statut === 'cloturee' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {mission.statut}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                                    <span className="flex items-center gap-1"><MapPin size={10}/> {mission.wilaya_destination}</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(mission.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLONNE DROITE: TOUTES LES ALERTES DU VÉHICULE */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-600"/> Alertes Véhicule
                    </h3>
                    <div className="space-y-3">
                        {driver.vehicule?.alertes?.length > 0 ? (
                            driver.vehicule.alertes.map(alerte => (
                                <div key={alerte.id} className={`p-4 rounded-2xl border transition-all ${
                                    alerte.acquittee ? 'bg-white border-slate-100 opacity-60' : 'bg-red-50 border-red-100 shadow-sm'
                                }`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-red-600">
                                            {alerte.type_alerte.replace('_', ' ')}
                                        </span>
                                        {alerte.mission_id ? (
                                            <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Mission</span>
                                        ) : (
                                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">Hors-Mission</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 leading-snug">{alerte.message}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 font-black">{new Date(alerte.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
                                <p className="text-sm font-bold text-slate-400">Aucune alerte enregistrée.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Composant réutilisable pour les statistiques
function StatCard({ label, value, icon, color, critical = false }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        amber: "text-amber-600 bg-amber-50",
        red: "text-red-600 bg-red-50"
    };

    return (
        <div className={`p-5 bg-white rounded-3xl border shadow-sm transition-transform hover:scale-[1.02] ${
            critical ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <div className={`p-2 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <span className={`text-2xl font-black ${critical ? 'text-red-600' : 'text-slate-900'}`}>
                    {value}
                </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}