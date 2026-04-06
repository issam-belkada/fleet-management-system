import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axios.js";
import {
    Truck, AlertTriangle, Users, MapPin, 
    Navigation, CheckCircle2, Clock, ShieldAlert, 
    Activity, Wrench, ArrowUpRight, Signal, ClipboardList
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const { data } = await axiosClient.get('/dashboard');
            setData(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 font-black text-slate-400 animate-pulse uppercase tracking-[0.2em]">
            Synchronisation Flux Live...
        </div>
    );

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Console Opérationnelle
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mt-2 ml-5">
                        Système de Gestion de Flotte • {new Date().toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-4 px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-slate-200/50">
                    <Signal size={14} className="text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Temps Réel</span>
                </div>
            </div>

            {/* --- TOP ROW: CORE METRICS (Sans barres) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Véhicules" 
                    value={data?.vehicules.total} 
                    icon={<Truck size={20}/>} 
                    color="blue" 
                    trend={`${data?.vehicules.assignes} actuellement assignés`}
                />
                <StatCard 
                    title="Missions" 
                    value={data?.missions.active} 
                    icon={<Navigation size={20}/>} 
                    color="emerald" 
                    trend={`${data?.missions.cloturee} missions terminées`}
                />
                <StatCard 
                    title="Conducteurs" 
                    value={data?.conducteurs.total} 
                    icon={<Users size={20}/>} 
                    color="indigo" 
                    trend={`${data?.conducteurs.en_mission} chauffeur(s) en poste`}
                />
                <StatCard 
                    title="Alertes Urgentes" 
                    value={data?.alertes.non_acquittees} 
                    icon={<ShieldAlert size={20}/>} 
                    color="red" 
                    critical={data?.alertes.non_acquittees > 0}
                    trend={`${data?.alertes.aujourdhui} au total aujourd'hui`}
                />
            </div>

            {/* --- DETAILED STATUS ROW --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                <StatusChip label="En Maintenance" value={data?.vehicules.en_maintenance} icon={<Wrench size={12}/>} color="amber" />
                <StatusChip label="Missions Clôturées" value={data?.missions.cloturee} icon={<CheckCircle2 size={12}/>} color="emerald" />
                <StatusChip label="En Attente" value={data?.missions.en_attente} icon={<Clock size={12}/>} color="blue" />
                <StatusChip label="Non Assignés" value={data?.vehicules.non_assignes} icon={<ClipboardList size={12}/>} color="slate" />
                <StatusChip label="Total Alertes" value={data?.alertes.aujourdhui} icon={<Activity size={12}/>} color="red" />
                <StatusChip label="Véh. Assignés" value={data?.vehicules.assignes} icon={<Truck size={12}/>} color="indigo" />
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* MISSIONS TABLE */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Missions en cours</h3>
                        <button onClick={() => navigate('/admin/missions')} className="group flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:gap-3 transition-all">
                            Historique <ArrowUpRight size={14}/>
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar pr-2">
                        {data?.missions_en_cours.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                                <Navigation size={48} className="mb-2"/>
                                <p className="text-sm font-black uppercase">Aucune mission active</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="text-slate-400 text-[9px] uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-4">Mission / Véhicule</th>
                                        <th className="pb-4">Conducteur</th>
                                        <th className="pb-4">Heure</th>
                                        <th className="pb-4 text-right">Phase</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data?.missions_en_cours.map((mission) => (
                                        <tr key={mission.id} onClick={() => navigate(`/admin/missions/${mission.id}`)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 cursor-pointer group transition-all">
                                            <td className="py-5">
                                                <p className="font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600">{mission.nom}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{mission.vehicule}</p>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[9px] font-black text-white shadow-md">
                                                        {mission.conducteur?.initiales}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600 uppercase">{mission.conducteur?.nom}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-slate-400 text-[10px] font-black uppercase">
                                                {new Date(mission.date_debut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="py-5 text-right">
                                                <PhaseBadge phase={mission.phase} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ALERTS SECTION */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-[600px] flex flex-col">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-8">Journal des alertes</h3>
                    
                    <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                        {data?.dernieres_alertes.map((alerte) => (
                            <div 
                                key={alerte.id} 
                                onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                                className={`p-5 rounded-[2rem] border transition-all cursor-pointer group ${
                                    alerte.acquittee 
                                    ? 'bg-white border-slate-100 opacity-60' 
                                    : 'bg-red-50/50 border-red-100 ring-1 ring-red-100 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${alerte.acquittee ? 'text-slate-400' : 'text-red-600'}`}>
                                        {alerte.type.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase italic">
                                        {alerte.temps}
                                    </span>
                                </div>
                                <p className="text-xs font-black text-slate-800 leading-tight mb-4">{alerte.message}</p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                    <MapPin size={10} className="text-blue-500"/> {alerte.immat}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
        </div>
    );
};

// --- SUBS ---

const StatCard = ({ title, value, icon, color, trend, critical }) => {
    const colorMap = {
        blue: { bg: "bg-blue-50", text: "text-blue-600" },
        indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
        red: { bg: "bg-red-50", text: "text-red-600" }
    };
    const c = colorMap[color];

    return (
        <div className={`bg-white p-6 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-md ${critical ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${c.bg} ${c.text}`}>{icon}</div>
                <div className="text-right">
                    <p className={`text-4xl font-black tracking-tighter tabular-nums ${critical ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    {trend}
                </span>
            </div>
        </div>
    );
};

const StatusChip = ({ label, value, icon, color }) => {
    const colorClasses = {
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        slate: "text-slate-500 bg-slate-50 border-slate-200"
    };
    return (
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-sm transition-transform hover:scale-[1.03] ${colorClasses[color]}`}>
            <div className="flex items-center gap-2">
                <span className="opacity-70">{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
            </div>
            <span className="text-xs font-black tabular-nums">{value}</span>
        </div>
    );
};

const PhaseBadge = ({ phase }) => {
    const configs = {
        en_route:  { label: 'EN ROUTE',  color: 'bg-blue-600 shadow-blue-100' },
        on_site:   { label: 'SUR SITE',  color: 'bg-emerald-500 shadow-emerald-100' },
        en_retour: { label: 'EN RETOUR', color: 'bg-amber-500 shadow-amber-100' },
    };
    const config = configs[phase] || { label: phase, color: 'bg-slate-400 shadow-slate-100' };
    return <span className={`${config.color} text-white text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg`}>{config.label}</span>;
};

export default AdminDashboard;