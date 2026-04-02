import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axios.js";
import {
    Truck, AlertTriangle, History,
    MoreHorizontal, Loader2
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ─────────────────────────────────────────
    // Fetch dashboard data + poll every 30s
    // ─────────────────────────────────────────
    const fetchDashboard = async () => {
        try {
            const { data } = await axiosClient.get('/dashboard');
            setData(data);
        } catch (error) {
            console.error("Erreur dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // First load
        fetchDashboard();

        // Poll every 30 seconds
        const interval = setInterval(fetchDashboard, 30000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">

            {/* ── Header ── */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Tableau de Bord</h1>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">
                        Aperçu opérationnel
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Systèmes OK
                    </span>
                </div>
            </div>

            {/* ── Fleet summary title ── */}
            <h2 className="text-4xl font-black text-[#0F172A] mb-8">
                {data?.vehicules.total} véhicules dans la flotte
            </h2>

            {/* ── Vehicule stat cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Voitures"
                    value={data?.vehicules.total}
                    icon={<Truck className="text-blue-600" />}
                />
                <StatCard
                    title="Assignés"
                    value={data?.vehicules.assignes}
                    badge="ACTIF"
                    badgeColor="bg-[#1E293B]"
                />
                <StatCard
                    title="Disponibles"
                    value={data?.vehicules.non_assignes}
                    badge="LIBRE"
                    badgeColor="bg-emerald-500"
                />
                <StatCard
                    title="En Maintenance"
                    value={data?.vehicules.en_maintenance}
                    badge="ATELIER"
                    badgeColor="bg-slate-500"
                />
            </div>

            {/* ── Alerte stat cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl flex items-center gap-6 border-l-4 border-red-500 shadow-sm">
                    <div className="bg-red-50 p-4 rounded-xl text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-medium">Alertes Non Acquittées</p>
                        <p className="text-4xl font-bold text-red-600">
                            {data?.alertes.non_acquittees}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl flex items-center gap-6 border-l-4 border-amber-500 shadow-sm">
                    <div className="bg-amber-50 p-4 rounded-xl text-amber-500">
                        <History size={32} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-medium">Alertes Aujourd'hui</p>
                        <p className="text-4xl font-bold text-amber-600">
                            {data?.alertes.aujourdhui}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Bottom section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Missions table */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Missions en cours</h3>
                        <button
                            onClick={() => navigate('/admin/missions')}
                            className="text-slate-400 text-sm hover:text-blue-600 transition-colors"
                        >
                            Voir tout
                        </button>
                    </div>

                    {data?.missions_en_cours.length === 0 ? (
                        <p className="text-center text-slate-400 py-10 text-sm">
                            Aucune mission active
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-4 font-semibold">Objet</th>
                                        <th className="pb-4 font-semibold">Voiture</th>
                                        <th className="pb-4 font-semibold">Chauffeur</th>
                                        <th className="pb-4 font-semibold">Date Départ</th>
                                        <th className="pb-4 font-semibold">Phase</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data?.missions_en_cours.map((mission) => (
                                        <tr
                                            key={mission.id}
                                            onClick={() => navigate(`/admin/missions/${mission.id}`)}
                                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-5 font-bold text-slate-700">
                                                {mission.nom}
                                            </td>
                                            <td className="py-5 text-slate-500 text-xs">
                                                {mission.vehicule?.immatriculation}
                                            </td>
                                            <td className="py-5">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {mission.conducteur?.initiales}
                                                </div>
                                            </td>
                                            <td className="py-5 text-slate-500 text-xs">
                                                {mission.date_debut
                                                    ? new Date(mission.date_debut).toLocaleString('fr-DZ', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : '—'
                                                }
                                            </td>
                                            <td className="py-5">
                                                <PhaseBadge phase={mission.phase} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Last 5 alertes */}
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Dernières Alertes</h3>
                        <MoreHorizontal
                            className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate('/admin/alertes')}
                        />
                    </div>

                    {data?.dernieres_alertes.length === 0 ? (
                        <p className="text-center text-slate-400 py-10 text-sm">
                            Aucune alerte
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {data?.dernieres_alertes.map((alerte) => (
                                <div
                                    key={alerte.id}
                                    onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                                    className={`p-4 rounded-xl border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                                        ${alerte.acquittee
                                            ? 'border-slate-300 bg-slate-50'
                                            : 'border-red-500 bg-red-50/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0
                                                ${alerte.acquittee ? 'bg-slate-400' : 'bg-red-500'}`}
                                            />
                                            <div>
                                                <p className="text-xs font-black text-slate-800">
                                                    {alerte.vehicule?.immatriculation || '—'}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {alerte.message}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 italic whitespace-nowrap ml-2">
                                            {alerte.temps_ecoule}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────
// Sub components
// ─────────────────────────────────────────

const StatCard = ({ title, value, badge, badgeColor, icon }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 relative flex flex-col justify-between h-40">
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-5xl font-bold text-slate-800 mt-2">{value ?? '—'}</p>
        </div>
        <div className="flex justify-between items-end">
            {icon ? (
                <div className="bg-blue-50 p-3 rounded-2xl">{icon}</div>
            ) : (
                <span className={`${badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded-md`}>
                    {badge}
                </span>
            )}
        </div>
    </div>
);

const PhaseBadge = ({ phase }) => {
    const configs = {
        en_route:  { label: 'EN ROUTE',  color: 'bg-blue-100 text-blue-700' },
        on_site:   { label: 'SUR SITE',  color: 'bg-emerald-100 text-emerald-700' },
        en_retour: { label: 'EN RETOUR', color: 'bg-amber-100 text-amber-700' },
    };
    const config = configs[phase] || { label: phase, color: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`${config.color} text-[9px] font-black px-2 py-1 rounded-md uppercase`}>
            {config.label}
        </span>
    );
};

export default AdminDashboard;