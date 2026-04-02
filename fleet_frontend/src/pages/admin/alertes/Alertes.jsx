import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axios.js';
import {
  AlertTriangle, Search, CheckCheck, Eye,
  ChevronLeft, ChevronRight, Loader2, Check, Clock
} from 'lucide-react';

export default function Alertes() {
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [nonAcquittees, setNonAcquittees] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  // ─────────────────────────────────────────
  // Fetch alertes from API
  // ─────────────────────────────────────────
  const fetchAlertes = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/alertes', {
        params: {
          page: pageNumber,
          search,
          type: filterType,
          date: filterDate,
        }
      });
      setAlertes(data.alertes.data || []);
      setMeta(data.alertes);
      setNonAcquittees(data.non_acquittees);
      setPage(pageNumber);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterDate]);

  // ─────────────────────────────────────────
  // Debounce — wait 300ms after typing
  // ─────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => fetchAlertes(1), 300);
    return () => clearTimeout(handler);
  }, [fetchAlertes]);

  // ─────────────────────────────────────────
  // Mark all alertes as acquittee
  // ─────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (!window.confirm("Marquer toutes les alertes comme acquittées ?")) return;
    setMarkingAll(true);
    try {
      await axiosClient.put('/alertes/acquitter-toutes');
      fetchAlertes(page);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  // ─────────────────────────────────────────
  // Mark one alerte as acquittee
  // ─────────────────────────────────────────
  const handleAcquitter = async (e, id) => {
    // Stop row click from firing (which would navigate to detail)
    e.stopPropagation();
    try {
      await axiosClient.put(`/alertes/${id}`);
      fetchAlertes(page);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Journal des Alertes
            </h1>
            {/* Non acquittees badge */}
            {nonAcquittees > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                {nonAcquittees} non acquittées
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {meta?.total || 0} alertes enregistrées
          </p>
        </div>

        {/* Mark all button */}
        <button
          onClick={handleMarkAllRead}
          disabled={markingAll || nonAcquittees === 0}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
        >
          {markingAll
            ? <Loader2 size={16} className="animate-spin" />
            : <CheckCheck size={16} />
          }
          Tout acquitter
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search by vehicule immatriculation */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par immatriculation..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-72 text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter by type */}
        <select
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none text-slate-600 font-medium cursor-pointer shadow-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tous les types</option>
          <option value="sortie_zone_permanente">Sortie Zone Permanente</option>
          <option value="sortie_zone_mission">Sortie Zone Mission</option>
          <option value="exces_vitesse">Excès de Vitesse</option>
        </select>

        {/* Filter by date */}
        <input
          type="date"
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none text-slate-600 font-medium cursor-pointer shadow-sm"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        {/* Clear filters */}
        {(search || filterType || filterDate) && (
          <button
            onClick={() => { setSearch(""); setFilterType(""); setFilterDate(""); }}
            className="text-xs text-slate-400 hover:text-red-500 font-bold underline transition-colors"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100 font-black">
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Véhicule</th>
              <th className="px-6 py-5">Mission</th>
              <th className="px-6 py-5">Message</th>
              <th className="px-6 py-5 text-center">Statut</th>
              <th className="px-6 py-5 text-center">Horodatage</th>
              <th className="px-6 py-5 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-24 text-center">
                  <Loader2 className="animate-spin inline text-blue-600" size={32} />
                </td>
              </tr>
            ) : alertes.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-24 text-center text-slate-400 font-medium">
                  Aucune alerte trouvée
                </td>
              </tr>
            ) : alertes.map((alerte) => (
              <tr
                key={alerte.id}
                onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                className={`hover:bg-slate-50/40 transition-colors group cursor-pointer
                  ${!alerte.acquittee ? 'bg-red-50/30' : ''}`}
              >
                {/* Type badge */}
                <td className="px-6 py-4">
                  <AlerteTypeBadge type={alerte.type_alerte} />
                </td>

                {/* Vehicule */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <AlertTriangle size={14} />
                    </div>
                    <span className="font-extrabold text-slate-800 uppercase tracking-tighter">
                      {alerte.vehicule?.immatriculation || '—'}
                    </span>
                  </div>
                </td>

                {/* Mission */}
                <td className="px-6 py-4 text-slate-500">
                  {alerte.mission?.nom || (
                    <span className="text-slate-300 italic text-xs">Hors mission</span>
                  )}
                </td>

                {/* Message */}
                <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">
                  {alerte.message}
                </td>

                {/* Acquittee status */}
                <td className="px-6 py-4 text-center">
                  {alerte.acquittee ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                      <Check size={10} /> Acquittée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                      <Clock size={10} /> En attente
                    </span>
                  )}
                </td>

                {/* Timestamp */}
                <td className="px-6 py-4 text-center text-xs text-slate-400 font-medium">
                  {new Date(alerte.created_at).toLocaleString('fr-DZ', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right pr-10">
                  <div
                    className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View detail */}
                    <button
                      onClick={() => navigate(`/admin/alertes/${alerte.id}`)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Acquitter if not already done */}
                    {!alerte.acquittee && (
                      <button
                        onClick={(e) => handleAcquitter(e, alerte.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Acquitter cette alerte"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {meta && (
          <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {meta.from}-{meta.to} sur {meta.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => fetchAlertes(page - 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page === meta.last_page}
                onClick={() => fetchAlertes(page + 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// AlerteTypeBadge component
// ─────────────────────────────────────────
const AlerteTypeBadge = ({ type }) => {
  const configs = {
    sortie_zone_permanente: {
      label: 'Zone Permanente',
      color: 'bg-red-100 text-red-700'
    },
    sortie_zone_mission: {
      label: 'Zone Mission',
      color: 'bg-orange-100 text-orange-700'
    },
    exces_vitesse: {
      label: 'Excès Vitesse',
      color: 'bg-amber-100 text-amber-700'
    },
  };

  const config = configs[type] || {
    label: type,
    color: 'bg-slate-100 text-slate-600'
  };

  return (
    <span className={`${config.color} text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tight inline-block`}>
      {config.label}
    </span>
  );
};