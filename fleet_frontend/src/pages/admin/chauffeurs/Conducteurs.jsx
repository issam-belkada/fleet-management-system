import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axios.js';
import AddConducteurModal from './AddConducteurModal';
import { 
  User, Search, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Loader2, Phone, CreditCard, Car, Eye
} from 'lucide-react';

export default function Conducteurs() {
  const navigate = useNavigate();
  const [conducteurs, setConducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConducteur, setSelectedConducteur] = useState(null);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchConducteurs = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/conducteurs`, {
        params: { page: pageNumber, search }
      });
      setConducteurs(data.data || []);
      setMeta(data);
      setPage(pageNumber);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce chauffeur ? (Impossible s'il a une mission active)")) {
      try {
        await axiosClient.delete(`/conducteurs/${id}`);
        fetchConducteurs(page);
      } catch (error) {
        alert(error.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => fetchConducteurs(1), 300);
    return () => clearTimeout(handler);
  }, [fetchConducteurs]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Chauffeurs</h1>
          <p className="text-sm text-slate-500 font-medium">{meta?.total || 0} conducteurs enregistrés</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un nom..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedConducteur(null); setIsModalOpen(true); }}
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
              <th className="px-6 py-5">Chauffeur</th>
              <th className="px-6 py-5 text-center">Contact</th>
              <th className="px-6 py-5">Véhicule Assigné</th>
              <th className="px-6 py-5 text-right pr-10">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="py-24 text-center"><Loader2 className="animate-spin inline text-blue-600" size={32} /></td></tr>
            ) : conducteurs.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => navigate(`/admin/conducteurs/${c.id}`)}
                className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <User size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800 uppercase tracking-tighter">
                        {c.nom} {c.prenom}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                        <CreditCard size={10} /> {c.numero_permis}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                    <Phone size={14} className="text-slate-300" />
                    {c.telephone}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {c.vehicule ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-bold text-slate-700">{c.vehicule.immatriculation}</span>
                      <span className="text-[11px] text-slate-400 uppercase">({c.vehicule.marque})</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Aucun véhicule</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right pr-10">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/admin/conducteurs/${c.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => { setSelectedConducteur(c); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && (
          <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500 font-bold uppercase">
            <span>{meta.from}-{meta.to} sur {meta.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => fetchConducteurs(page - 1)} className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button disabled={page === meta.last_page} onClick={() => fetchConducteurs(page + 1)} className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      <AddConducteurModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedConducteur(null); }} 
        onRefresh={() => fetchConducteurs(page)} 
        conducteur={selectedConducteur}
      />
    </div>
  );
}