import React, { useState, useEffect } from 'react';
import { X, Loader2, Palette, Hash, ShieldCheck, Car, Wrench } from 'lucide-react';
import axiosClient from '../../../api/axios';

export default function AddVehiculeModal({ isOpen, onClose, onRefresh, vehicule }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  
  const [formData, setFormData] = useState({
    immatriculation: '',
    marque: '',
    modele: '',
    couleur: '',
    en_maintenance: false, // Ajout du champ maintenance
  });

  // Remplit le formulaire si on édite un véhicule
  useEffect(() => {
    if (vehicule) {
      setFormData({
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        couleur: vehicule.couleur,
        en_maintenance: vehicule.statut === 'en_maintenance', // Initialise selon le statut actuel
      });
    } else {
      setFormData({ immatriculation: '', marque: '', modele: '', couleur: '', en_maintenance: false });
    }
  }, [vehicule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    try {
      if (vehicule) {
        // Mode Mise à jour (PUT ou PATCH)
        await axiosClient.put(`/vehicules/${vehicule.id}`, formData);
      } else {
        // Mode Création (POST)
        await axiosClient.post('/vehicules', formData);
      }
      
      onRefresh();
      onClose();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Car size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {vehicule ? "Modifier le Véhicule" : "Nouveau Véhicule"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Immatriculation</label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-3 text-slate-300" size={18} />
              <input
                type="text"
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors?.immatriculation ? 'border-red-300' : 'border-slate-200'} rounded-xl outline-none text-sm font-semibold uppercase`}
                value={formData.immatriculation}
                onChange={e => setFormData({...formData, immatriculation: e.target.value})}
                required
              />
            </div>
            {errors?.immatriculation && <p className="text-[10px] text-red-500 mt-1">{errors.immatriculation[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Marque</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                value={formData.marque}
                onChange={e => setFormData({...formData, marque: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Modèle</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                value={formData.modele}
                onChange={e => setFormData({...formData, modele: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Couleur</label>
            <div className="relative">
              <Palette className="absolute left-3.5 top-3 text-slate-300" size={18} />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                value={formData.couleur}
                onChange={e => setFormData({...formData, couleur: e.target.value})}
                required
              />
            </div>
          </div>

          {/* CHECKBOX MAINTENANCE : Uniquement en mode modification */}
          {vehicule && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-orange-700">
                <Wrench size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Mettre en maintenance</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.en_maintenance}
                  onChange={e => setFormData({...formData, en_maintenance: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          )}

          {!vehicule && (
            <div className="p-3.5 bg-blue-50 rounded-2xl flex items-start gap-3 border border-blue-100">
              <ShieldCheck className="text-blue-500 mt-0.5" size={18} />
              <p className="text-[11px] text-blue-700 leading-normal">
                <strong>Info :</strong> Statut <b>Disponible</b> et zones 1-4 automatiques.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : (vehicule ? "Mettre à jour" : "Confirmer")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}