import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, MapPin, Target, Calendar, ClipboardList, Send, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import axiosClient from '../../../api/axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet dans React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Composant pour capturer le clic sur la carte
function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function AddMissionModal({ isOpen, onClose, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const [conducteursLibres, setConducteursLibres] = useState([]);

    const [formData, setFormData] = useState({
        conducteur_id: '',
        nom: '',
        description: '',
        zone_lat: 36.7538, // Alger par défaut
        zone_lng: 3.0588,
        zone_rayon_m: 1000, // Rayon plus grand par défaut (1km)
        wilaya_destination: '',
        date_debut: new Date().toISOString().slice(0, 16),
    });

    // Charger les conducteurs disponibles selon la date choisie
    const fetchConducteurs = useCallback(async (date) => {
        try {
            const { data } = await axiosClient.get('/missions/disponibles', {
                params: { date_debut: date }
            });
            setConducteursLibres(data);
        } catch (err) {
            console.error("Erreur conducteurs:", err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchConducteurs(formData.date_debut);
    }, [isOpen, formData.date_debut, fetchConducteurs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);

        try {
            await axiosClient.post('/missions', formData);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in zoom-in duration-200">
                
                {/* --- PANNEAU GAUCHE : FORMULAIRE --- */}
                <div className="w-full md:w-5/12 p-8 overflow-y-auto border-r border-slate-50 bg-white">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nouvelle Mission</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuration de l'ordre de route</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 md:hidden">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nom de la mission */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Désignation de la mission</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-3.5 top-3 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Ex: Livraison Matériel Médical"
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors?.nom ? 'border-red-300' : 'border-slate-200'} rounded-2xl outline-none text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all`}
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Date et Wilaya */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Date de départ</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-3 text-blue-500" size={18} />
                                    <input
                                        type="datetime-local"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                                        value={formData.date_debut}
                                        onChange={e => setFormData({ ...formData, date_debut: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Wilaya Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 text-red-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ex: Oran"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                                        value={formData.wilaya_destination}
                                        onChange={e => setFormData({ ...formData, wilaya_destination: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Conducteur */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Conducteur & Véhicule</label>
                            <div className="relative">
                                <Navigation className="absolute left-3.5 top-3 text-slate-300" size={18} />
                                <select
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors?.conducteur_id ? 'border-red-300' : 'border-slate-200'} rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer`}
                                    value={formData.conducteur_id}
                                    onChange={e => setFormData({ ...formData, conducteur_id: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner un agent libre</option>
                                    {conducteursLibres.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nom} {c.prenom} — [{c.vehicule?.immatriculation}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Rayon d'arrivée (Modifié pour être plus grand) */}
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rayon de validation</label>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black italic">{formData.zone_rayon_m}m</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="10000" // Augmenté à 10km max
                                step="100"
                                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                value={formData.zone_rayon_m}
                                onChange={e => setFormData({ ...formData, zone_rayon_m: parseInt(e.target.value) })}
                            />
                            <p className="text-[9px] text-slate-400 mt-2 font-medium italic">Le périmètre dans lequel la mission sera considérée comme "Arrivée".</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Instructions (Optionnel)</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium h-20 resize-none"
                                placeholder="Détails supplémentaires..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.conducteur_id}
                                className="flex-[2] px-4 py-4 bg-slate-900 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:bg-black transition-all disabled:bg-slate-300"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Confirmer la mission</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- PANNEAU DROIT : CARTE --- */}
                <div className="w-full md:w-7/12 relative bg-slate-100">
                    <div className="absolute top-6 left-6 z-[1001] bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20">
                        <div className="flex items-center gap-3 text-blue-600">
                            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                                <Target size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight">Point de livraison</h3>
                                <p className="text-[10px] text-slate-500 font-bold">Cliquez sur la carte pour définir l'arrivée</p>
                            </div>
                        </div>
                    </div>

                    <MapContainer center={[formData.zone_lat, formData.zone_lng]} zoom={12} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker onLocationSelect={(lat, lng) => setFormData({ ...formData, zone_lat: lat, zone_lng: lng })} />
                        <Marker position={[formData.zone_lat, formData.zone_lng]} />
                        <Circle
                            center={[formData.zone_lat, formData.zone_lng]}
                            radius={formData.zone_rayon_m}
                            pathOptions={{
                                color: '#2563eb',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.2,
                                weight: 2,
                                dashArray: '5, 10'
                            }}
                        />
                    </MapContainer>

                    {/* Coordonnées en badge */}
                    <div className="absolute bottom-6 right-6 z-[1001] bg-slate-900/80 text-white px-4 py-2 rounded-full text-[10px] font-black backdrop-blur-md border border-white/10">
                        {formData.zone_lat.toFixed(5)} , {formData.zone_lng.toFixed(5)}
                    </div>
                </div>
            </div>
        </div>
    );
}