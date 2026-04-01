import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axios.js';
import AddVehiculeModal from './AddVehiculeModal';
import { 
  Truck, Search, Plus, Edit2, Trash2,
  ChevronLeft, ChevronRight, Loader2, MapPin, Palette, Eye
} from 'lucide-react';

export default function Vehicules() {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState(null); // Pour l'édition
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchVehicules = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/vehicules`, {
        params: { page: pageNumber, search, statut: filter }
      });
      setVehicules(data.data || []);
      setMeta(data);
      setPage(pageNumber);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce véhicule ?")) {
      try {
        await axiosClient.delete(`/vehicules/${id}`);
        fetchVehicules(page);
      } catch (error) {
        console.error("Erreur suppression:", error);
      }
    }
  };

  const openEditModal = (vehicule) => {
    setSelectedVehicule(vehicule);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchVehicules(1), 300);
    return () => clearTimeout(handler);
  }, [fetchVehicules]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion de la Flotte</h1>
          <p className="text-sm text-slate-500 font-medium">{meta?.total || 0} véhicules répertoriés</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Immatriculation, marque..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none text-slate-600 font-medium cursor-pointer shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="non_assignee">Disponible</option>
            <option value="assignee">Assignee</option>
            <option value="en_maintenance">À l'Atelier</option>
          </select>

          <button 
            onClick={() => { setSelectedVehicule(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100 font-black">
              <th className="px-6 py-5">Immatriculation</th>
              <th className="px-6 py-5">Marque & Modèle</th>
              <th className="px-6 py-5 text-center">Couleur</th>
              <th className="px-6 py-5 text-center">Statut</th>
              <th className="px-6 py-5 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-24 text-center">
                   <Loader2 className="animate-spin inline text-blue-600" size={32} />
                </td>
              </tr>
            ) : vehicules.map((v) => (
              <tr 
                key={v.id} 
                onClick={() => navigate(`/admin/vehicules/${v.id}`)}
                className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Truck size={18} />
                    </div>
                    <span className="font-extrabold text-slate-800 uppercase tracking-tighter text-base">
                      {v.immatriculation}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 uppercase">{v.marque}</span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">{v.modele}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Palette size={14} className="text-slate-300" />
                    <span className="text-xs font-semibold text-slate-600 capitalize">{v.couleur}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={v.statut} />
                </td>
                <td className="px-6 py-4 text-right pr-10">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/admin/vehicules/${v.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openEditModal(v)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination inchangée */}
        {meta && (
          <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {meta.from}-{meta.to} sur {meta.total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => fetchVehicules(page - 1)} className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              <button disabled={page === meta.last_page} onClick={() => fetchVehicules(page + 1)} className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddVehiculeModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedVehicule(null); }} 
        onRefresh={() => fetchVehicules(page)} 
        vehicule={selectedVehicule} // On passe le véhicule pour l'édition
      />
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const configs = {
    non_assignee: { label: 'non_assignee', color: 'bg-emerald-100 text-emerald-700' },
    assignee: { label: 'assignee', color: 'bg-slate-900 text-white' },
    en_maintenance: { label: 'en_maintenance', color: 'bg-orange-100 text-orange-700' },
  };
  const config = configs[status] || { label: status, color: 'bg-slate-200 text-slate-600' };
  return (
    <span className={`${config.color} text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tight inline-block min-w-[100px]`}>
      {config.label}
    </span>
  );
};