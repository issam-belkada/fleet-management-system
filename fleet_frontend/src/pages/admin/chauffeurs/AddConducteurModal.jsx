import React, { useState, useEffect } from 'react';
import { X, Loader2, Phone, User, CreditCard, Car, ShieldCheck } from 'lucide-react';
import axiosClient from '../../../api/axios';

export default function AddConducteurModal({ isOpen, onClose, onRefresh, conducteur }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [vehiculesDisponibles, setVehiculesDisponibles] = useState([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    numero_permis: '',
    vehicule_id: ''
  });

  // Charger uniquement les véhicules libres via la nouvelle route
  useEffect(() => {
    if (isOpen) {
      const fetchDispos = async () => {
        try {
          const { data } = await axiosClient.get('/vehicules/disponibles');
          
          // Si on modifie un chauffeur, on réinjecte son véhicule actuel dans la liste
          if (conducteur && conducteur.vehicule) {
            const currentVehicule = conducteur.vehicule;
            if (!data.find(v => v.id === currentVehicule.id)) {
              data.unshift(currentVehicule); 
            }
          }
          setVehiculesDisponibles(data);
        } catch (error) {
          console.error("Erreur chargement véhicules:", error);
        }
      };
      fetchDispos();
    }
  }, [isOpen, conducteur]);

  // Initialisation des champs du formulaire
  useEffect(() => {
    if (conducteur) {
      setFormData({
        nom: conducteur.nom,
        prenom: conducteur.prenom,
        telephone: conducteur.telephone,
        numero_permis: conducteur.numero_permis,
        vehicule_id: conducteur.vehicule_id,
      });
    } else {
      setFormData({ nom: '', prenom: '', telephone: '', numero_permis: '', vehicule_id: '' });
    }
  }, [conducteur, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);

    try {
      if (conducteur) {
        await axiosClient.put(`/conducteurs/${conducteur.id}`, formData);
      } else {
        await axiosClient.post('/conducteurs', formData);
      }
      onRefresh(); 
      onClose();   
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {conducteur ? "Modifier Chauffeur" : "Nouveau Chauffeur"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nom</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.nom}
                onChange={e => setFormData({...formData, nom: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Prénom</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.prenom}
                onChange={e => setFormData({...formData, prenom: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 text-slate-300" size={18} />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Permis */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">N° Permis</label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 text-slate-300" size={18} />
              <input
                type="text"
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors?.numero_permis ? 'border-red-300' : 'border-slate-200'} rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20`}
                value={formData.numero_permis}
                onChange={e => setFormData({...formData, numero_permis: e.target.value})}
                required
              />
            </div>
            {errors?.numero_permis && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.numero_permis[0]}</p>}
          </div>

          {/* Select Véhicule */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Véhicule à assigner</label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3 text-slate-300" size={18} />
              <select
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors?.vehicule_id ? 'border-red-300' : 'border-slate-200'} rounded-xl outline-none text-sm font-medium appearance-none cursor-pointer`}
                value={formData.vehicule_id}
                onChange={e => setFormData({...formData, vehicule_id: e.target.value})}
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehiculesDisponibles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.immatriculation} — {v.marque} {v.modele}
                  </option>
                ))}
              </select>
            </div>
            {errors?.vehicule_id && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.vehicule_id[0]}</p>}
          </div>

          {/* Info Badge */}
          <div className="p-3.5 bg-blue-50 rounded-2xl flex items-start gap-3 border border-blue-100">
            <ShieldCheck className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] text-blue-700 leading-normal">
              L'assignation d'un véhicule changera son statut en <b>Assigné</b>. S'il était déjà assigné à un autre véhicule, l'ancien redeviendra <b>Disponible</b>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-blue-300 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}