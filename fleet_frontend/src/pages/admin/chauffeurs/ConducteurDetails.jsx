import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    User, Car, MapPin, AlertCircle, Calendar, 
    ChevronRight, Phone, ShieldCheck, Clock,
    Activity, CheckCircle2, AlertTriangle, ArrowLeft, ExternalLink
} from 'lucide-react';
import axiosClient from '../../../api/axios.js';

export default function ConducteurDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
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
        <div className="flex items-center justify-center h-screen bg-slate-50 uppercase font-black text-slate-400 animate-pulse">
            Chargement du dossier...
        </div>
    );

    if (!driver) return <div className="p-10 text-center font-bold">Chauffeur introuvable.</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans antialiased">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin/conducteurs" className="p-3 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all text-slate-600">
                        <ArrowLeft size={20}/>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dossier Chauffeur</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ID Personnel: #{driver.id}</p>
                    </div>
                </div>
                {driver.stats.en_mission && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 animate-pulse">
                        <Activity size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">En Mission</span>
                    </div>
                )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Missions Totales" value={driver.stats.total_missions} icon={<Activity size={20}/>} color="blue" />
                <StatCard label="Missions Clôturées" value={driver.stats.missions_cloturees} icon={<CheckCircle2 size={20}/>} color="green" />
                <StatCard label="Alertes (Total)" value={driver.stats.total_alertes} icon={<AlertTriangle size={20}/>} color="amber" />
                <StatCard label="Alertes Actives" value={driver.stats.alertes_non_acquittees} icon={<AlertCircle size={20}/>} color="red" critical={driver.stats.alertes_non_acquittees > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* COLONNE GAUCHE: PROFIL & VÉHICULE */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Profil Conducteur</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-xl">
                                {driver.nom[0]}{driver.prenom[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">{driver.prenom} {driver.nom}</h2>
                                <p className="text-[10px] font-black text-slate-400 flex items-center gap-1 mt-1 uppercase">
                                    <ShieldCheck size={12} className="text-blue-500"/> Permis: {driver.numero_permis}
                                </p>
                            </div>
                        </div>
                        <a href={`tel:${driver.telephone}`} className="w-full py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 text-slate-700 font-black text-sm hover:bg-slate-900 hover:text-white transition-all group">
                            <Phone size={16} className="group-hover:animate-bounce"/> {driver.telephone}
                        </a>
                    </div>

                    {/* VÉHICULE ASSIGNÉ (CLIQUABLE) */}
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Véhicule Assigné</h3>
                        {driver.vehicule ? (
                            <div 
                                onClick={() => navigate(`/admin/vehicules/${driver.vehicule.id}`)}
                                className="group cursor-pointer space-y-4 p-4 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-500 hover:bg-white transition-all shadow-sm hover:shadow-xl"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg group-hover:bg-blue-600 transition-colors">
                                        {driver.vehicule.immatriculation}
                                    </span>
                                    <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">{driver.vehicule.marque} {driver.vehicule.modele}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest italic">{driver.vehicule.couleur}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                <p className="text-xs font-black text-slate-300 uppercase tracking-tighter">Aucun véhicule rattaché</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNE CENTRE: MISSIONS (SCROLLABLE) */}
                <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600"/> Historique Missions
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                            {driver.missions.length}
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                        {driver.missions.length > 0 ? driver.missions.map(mission => (
                            <div 
                                key={mission.id} 
                                onClick={() => navigate(`/admin/missions/${mission.id}`)}
                                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-black text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                        {mission.nom}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        mission.statut === 'cloturee' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 shadow-sm'
                                    }`}>
                                        {mission.statut}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-500"/> {mission.wilaya_destination}</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(mission.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-300 font-black uppercase text-[10px]">
                                Aucune mission
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNE DROITE: ALERTES (SCROLLABLE) */}
                <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-600"/> Alertes Sécurité
                        </h3>
                    </div>

                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                        {driver.vehicule?.alertes?.length > 0 ? (
                            driver.vehicule.alertes.map(alerte => (
                                <div 
                                    key={alerte.id} 
                                    onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                                    className={`p-5 rounded-3xl border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                                        alerte.acquittee 
                                        ? 'bg-white border-slate-100 opacity-60' 
                                        : 'bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100/50'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                                            {alerte.type_alerte.replace(/_/g, ' ')}
                                        </span>
                                        {alerte.mission_id ? (
                                            <span className="text-[8px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">En Mission</span>
                                        ) : (
                                            <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Hors-Mission</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 leading-snug mb-3">{alerte.message}</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                                        <span className="text-[9px] text-slate-400 font-black uppercase">{new Date(alerte.created_at).toLocaleDateString()}</span>
                                        <span className="text-[9px] text-slate-400 font-black">{new Date(alerte.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400 opacity-50"/>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zéro incident</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* CSS pour la scrollbar (à mettre dans ton index.css idéalement) */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
}

function StatCard({ label, value, icon, color, critical = false }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50 shadow-blue-100",
        green: "text-green-600 bg-green-50 shadow-green-100",
        amber: "text-amber-600 bg-amber-50 shadow-amber-100",
        red: "text-red-600 bg-red-50 shadow-red-100"
    };

    return (
        <div className={`p-6 bg-white rounded-[2rem] border shadow-sm transition-all ${
            critical ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-100'
        }`}>
            <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-2xl shadow-inner ${colors[color]}`}>
                    {icon}
                </div>
                <span className={`text-3xl font-black tabular-nums ${critical ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                    {value}
                </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
        </div>
    );
}