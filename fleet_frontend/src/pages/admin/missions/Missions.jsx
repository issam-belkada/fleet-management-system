import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axios.js';
import AddMissionModal from './AddMissionModal';
import { 
  Briefcase, Search, Plus, Trash2, Calendar, MapPin, 
  ChevronLeft, ChevronRight, Loader2, Eye, Clock, CheckCircle2, Edit3
} from 'lucide-react';

export default function Missions() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missionToEdit, setMissionToEdit] = useState(null); // État pour la mission à modifier
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchMissions = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/missions`, {
        params: { page: pageNumber, search, statut: statutFilter }
      });
      setMissions(data.data || []);
      setMeta(data);
      setPage(pageNumber);
    } catch (error) {
      console.error("Erreur missions:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statutFilter]);

  // Ouvrir le modal en mode "Création"
  const handleCreateNew = () => {
    setMissionToEdit(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal en mode "Modification"
  const handleEdit = (mission) => {
    setMissionToEdit(mission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMissionToEdit(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette mission en attente ?")) {
      try {
        await axiosClient.delete(`/missions/${id}`);
        fetchMissions(page);
      } catch (error) {
        alert(error.response?.data?.message || "Erreur de suppression");
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchMissions(1), 300);
    return () => clearTimeout(handler);
  }, [fetchMissions]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* HEADER & FILTRES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suivi des Missions</h1>
          <p className="text-sm text-slate-500 font-medium">{meta?.total || 0} missions au total</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Nom de la mission..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm shadow-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none text-slate-600 font-bold cursor-pointer shadow-sm"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="active">En cours</option>
            <option value="cloturee">Clôturées</option>
          </select>

          <button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Plus size={18} /> Créer une mission
          </button>
        </div>
      </div>

      {/* TABLEAU DES MISSIONS */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100 font-black">
              <th className="px-6 py-5">Mission & Destination</th>
              <th className="px-6 py-5">Chauffeur / Véhicule</th>
              <th className="px-6 py-5 text-center">Statut</th>
              <th className="px-6 py-5 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-24 text-center">
                  <Loader2 className="animate-spin inline text-blue-600" size={32} />
                </td>
              </tr>
            ) : missions.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-20 text-center text-slate-400 font-bold italic">
                  Aucune mission trouvée
                </td>
              </tr>
            ) : (
              missions.map((m) => (
                <tr 
                  key={m.id} 
                  onClick={() => navigate(`/admin/missions/${m.id}`)}
                  className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Briefcase size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 uppercase tracking-tighter">{m.nom}</span>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                          <MapPin size={10} /> {m.wilaya_destination}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 uppercase">{m.conducteur?.nom} {m.conducteur?.prenom}</span>
                      <span className="text-[11px] text-slate-400 font-bold">{m.vehicule?.immatriculation || 'Aucun véhicule'}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <MissionStatusBadge status={m.statut} />
                  </td>

                  <td className="px-6 py-4 text-right pr-10">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      
                      {/* BOUTON ÉDITER (Uniquement si en attente) */}
                      {m.statut === 'en_attente' && (
                        <button 
                          onClick={() => handleEdit(m)} 
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}

                      <button onClick={() => navigate(`/admin/missions/${m.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Eye size={16} />
                      </button>

                      {m.statut === 'en_attente' && (
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION SIMPLE */}
        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Page {page} sur {meta.last_page}</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => fetchMissions(page - 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={page === meta.last_page}
                onClick={() => fetchMissions(page + 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL (CREATION OU EDITION) */}
      <AddMissionModal 
        isOpen={isModalOpen} 
        missionToEdit={missionToEdit}
        onClose={handleCloseModal} 
        onRefresh={() => fetchMissions(page)} 
      />
    </div>
  );
}

const MissionStatusBadge = ({ status }) => {
  const configs = {
    en_attente: { label: 'En attente', color: 'bg-slate-100 text-slate-600', icon: <Clock size={10}/> },
    active: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: <Loader2 size={10} className="animate-spin"/> },
    cloturee: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={10}/> },
  };
  const config = configs[status] || configs.en_attente;
  return (
    <span className={`${config.color} text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tight inline-flex items-center gap-1.5 min-w-[110px] justify-center`}>
      {config.icon} {config.label}
    </span>
  );
};