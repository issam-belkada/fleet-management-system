import React from 'react';
import { 
  Truck, 
  PlayCircle, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  History,
  MoreHorizontal
} from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
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
          <span className="text-slate-400 text-xs flex items-center gap-2">
            <History size={14} /> Dernière mise à jour: 12:45
          </span>
        </div>
      </div>

      <h2 className="text-4xl font-black text-[#0F172A] mb-8">
        94% de la flotte active
      </h2>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Voitures" value="142" icon={<Truck className="text-blue-600" />} />
        <StatCard title="En Mission" value="89" badge="ACTIF" badgeColor="bg-[#1E293B]" icon={null} />
        <StatCard title="Disponibles" value="45" badge="LIBRE" badgeColor="bg-emerald-500" icon={null} />
        <StatCard title="En Maintenance" value="8" badge="ATELIER" badgeColor="bg-slate-500" icon={null} />
      </div>

      {/* Alerts Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl flex items-center gap-6 border-l-4 border-red-500 shadow-sm">
          <div className="bg-red-50 p-4 rounded-xl text-red-500">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium">Alertes Non Lues</p>
            <p className="text-4xl font-bold text-red-600">14</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl flex items-center gap-6 border-l-4 border-amber-500 shadow-sm">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-500">
            <History size={32} />
          </div>
          <div>
            <p className="text-slate-500 font-medium">Alertes Aujourd'hui</p>
            <p className="text-4xl font-bold text-amber-600">32</p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Table & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Missions Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Missions en cours</h3>
            <button className="text-slate-400 text-sm hover:text-blue-600">Voir tout</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-50">
                  <th className="pb-4 font-semibold">Objet</th>
                  <th className="pb-4 font-semibold">Voiture</th>
                  <th className="pb-4 font-semibold">Chauffeur</th>
                  <th className="pb-4 font-semibold">Date Départ</th>
                  <th className="pb-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <TableRow obj="Livraison Express" car="Toyota Hilux (AA-55)" driver="MK" date="12 Oct, 08:30" status="EN ROUTE" statusColor="bg-[#0F172A]" />
                <TableRow obj="Transport Médical" car="Renault Master (BB-22)" driver="AL" date="12 Oct, 09:15" status="URGENT" statusColor="bg-amber-500" />
                <TableRow obj="Logistique Fret" car="Mercedes Actros (CC-88)" driver="SD" date="12 Oct, 06:00" status="TERMINÉ" statusColor="bg-emerald-500" />
                <TableRow obj="Maintenance Terrain" car="Dacia Duster (DD-11)" driver="PR" date="12 Oct, 10:45" status="PLANIFIÉ" statusColor="bg-slate-200 text-slate-600" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Alerts */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Dernières Alertes</h3>
            <MoreHorizontal className="text-slate-400 cursor-pointer" />
          </div>
          <div className="space-y-4">
            <AlertItem id="AA-123-BC" desc="Excès de vitesse détecté" time="il y a 5 min" color="border-red-500" dot="bg-red-500" />
            <AlertItem id="XY-987-ZZ" desc="Niveau carburant bas (< 10%)" time="il y a 12 min" color="border-amber-500" dot="bg-amber-500" />
            <AlertItem id="AB-555-CC" desc="Arrêt non planifié (Zone B)" time="il y a 18 min" color="border-red-500" dot="bg-red-500" />
            <AlertItem id="TR-001-FT" desc="Maintenance prévue demain" time="il y a 45 min" color="border-amber-500" dot="bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const StatCard = ({ title, value, badge, badgeColor, icon }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 relative flex flex-col justify-between h-40">
    <div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-5xl font-bold text-slate-800 mt-2">{value}</p>
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

const TableRow = ({ obj, car, driver, date, status, statusColor }) => (
  <tr className="border-b border-slate-50 last:border-0">
    <td className="py-5 font-bold text-slate-700">{obj}</td>
    <td className="py-5 text-slate-500">{car}</td>
    <td className="py-5">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
        {driver}
      </div>
    </td>
    <td className="py-5 text-slate-500 leading-tight">{date}</td>
    <td className="py-5">
      <span className={`${statusColor} ${!statusColor.includes('text') && 'text-white'} text-[9px] font-black px-2 py-1 rounded-md`}>
        {status}
      </span>
    </td>
  </tr>
);

const AlertItem = ({ id, desc, time, color, dot }) => (
  <div className={`p-4 rounded-xl border-l-4 ${color} bg-slate-50 flex justify-between items-start`}>
    <div className="flex gap-3">
      <span className={`w-2 h-2 rounded-full mt-1 ${dot}`}></span>
      <div>
        <p className="text-xs font-black text-slate-800">{id}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
    </div>
    <span className="text-[10px] text-slate-400 italic whitespace-nowrap">{time}</span>
  </div>
);

export default AdminDashboard;