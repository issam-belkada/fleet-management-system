import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, MapPin, Target, ClipboardList, Send, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import axiosClient from '../../../api/axios';
import osmClient from '../../../api/osmClient'; // Ton nouveau client OSM
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function AddMissionModal({ isOpen, onClose, onRefresh, missionToEdit = null }) {
    const [loading, setLoading] = useState(false);
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [errors, setErrors] = useState(null);
    const [conducteursLibres, setConducteursLibres] = useState([]);

    const [formData, setFormData] = useState({
        conducteur_id: '',
        nom: '',
        description: '',
        zone_lat: 36.7538,
        zone_lng: 3.0588,
        zone_rayon_m: 1000,
        wilaya_destination: '',
        date_debut: new Date().toISOString().slice(0, 16),
        date_fin: '', 
    });

    useEffect(() => {
        if (isOpen) {
            if (missionToEdit) {
                setFormData({
                    conducteur_id: missionToEdit.conducteur_id || '',
                    nom: missionToEdit.nom || '',
                    description: missionToEdit.description || '',
                    zone_lat: parseFloat(missionToEdit.zone_lat) || 36.7538,
                    zone_lng: parseFloat(missionToEdit.zone_lng) || 3.0588,
                    zone_rayon_m: parseInt(missionToEdit.zone_rayon_m) || 1000,
                    wilaya_destination: missionToEdit.wilaya_destination || '',
                    date_debut: missionToEdit.date_debut ? missionToEdit.date_debut.slice(0, 16) : '',
                    date_fin: missionToEdit.date_fin ? missionToEdit.date_fin.slice(0, 16) : '',
                });
            } else {
                setFormData({
                    conducteur_id: '',
                    nom: '',
                    description: '',
                    zone_lat: 36.7538,
                    zone_lng: 3.0588,
                    zone_rayon_m: 1000,
                    wilaya_destination: '',
                    date_debut: new Date().toISOString().slice(0, 16),
                    date_fin: '',
                });
            }
            setErrors(null);
            setAddressInput('');
        }
    }, [isOpen, missionToEdit]);

    const formatWilaya = (address) => {
        const rawWilaya = address.state || address.province || address.county || address.city || '';
        return rawWilaya.replace('Province ', '').replace(' Wilaya', '').trim();
    };

    const handleSearchAddress = async (e) => {
        if (e) e.preventDefault();
        if (!addressInput.trim()) return;
        setSearchingAddress(true);
        try {
            // Utilisation du osmClient pour gérer le User-Agent et le CORS
            const { data } = await osmClient.get('/search', {
                params: {
                    q: addressInput,
                    format: 'json',
                    addressdetails: 1,
                    limit: 1,
                    email: 'aissamaissam527@gmail.com' // Ajoute ton email ici pour t'identifier proprement
                }
            });

            if (data && data.length > 0) {
                const result = data[0];
                setFormData(prev => ({
                    ...prev,
                    zone_lat: parseFloat(result.lat),
                    zone_lng: parseFloat(result.lon),
                    wilaya_destination: formatWilaya(result.address) || prev.wilaya_destination
                }));
                setAddressInput(result.display_name);
            }
        } catch (err) { 
            console.error("Erreur de recherche:", err); 
        } finally { 
            setSearchingAddress(false); 
        }
    };

    const handleMapClick = async (lat, lng) => {
        setFormData(prev => ({ ...prev, zone_lat: lat, zone_lng: lng }));
        try {
            const { data } = await osmClient.get('/reverse', {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                    addressdetails: 1,
                    email: 'aissamaissam527@gmail.com' // Identifie-toi aussi ici
                }
            });
    
            if (data && data.address) {
                setFormData(prev => ({ 
                    ...prev, 
                    wilaya_destination: formatWilaya(data.address) || prev.wilaya_destination 
                }));
                setAddressInput(data.display_name);
            }
        } catch (err) { 
            console.error("Erreur Reverse Geocoding:", err); 
        }
    };

    const fetchConducteurs = useCallback(async (debut, fin) => {
        if (!debut || !fin) return;
        try {
            const { data } = await axiosClient.get('/missions/disponibles', { params: { date_debut: debut, date_fin: fin } });
            setConducteursLibres(data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        if (isOpen && formData.date_debut && formData.date_fin) {
            fetchConducteurs(formData.date_debut, formData.date_fin);
        }
    }, [isOpen, formData.date_debut, formData.date_fin, fetchConducteurs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const debut = new Date(formData.date_debut);
        const fin = new Date(formData.date_fin);
        if (debut >= fin) {
            setErrors({ date_fin: ["La date de fin doit être après la date de début."] });
            return;
        }

        setLoading(true);
        setErrors(null);
        try {
            if (missionToEdit) {
                await axiosClient.put(`/missions/${missionToEdit.id}`, formData);
            } else {
                await axiosClient.post('/missions', formData);
            }
            onRefresh();
            onClose();
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data.errors);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in zoom-in duration-200">
                <div className="w-full md:w-5/12 p-8 overflow-y-auto border-r border-slate-50 bg-white">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{missionToEdit ? 'Modifier la Mission' : 'Nouvelle Mission'}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuration de l'ordre de route</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 md:hidden"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Désignation</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-3.5 top-3 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors?.nom ? 'border-red-300' : 'border-slate-200'} rounded-2xl outline-none text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all`}
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Départ</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold"
                                    value={formData.date_debut}
                                    onChange={e => setFormData({ ...formData, date_debut: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 block">Fin prévue</label>
                                <input
                                    type="datetime-local"
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors?.date_fin ? 'border-red-400' : 'border-slate-200'} rounded-2xl outline-none text-xs font-bold`}
                                    value={formData.date_fin}
                                    min={formData.date_debut}
                                    onChange={e => setFormData({ ...formData, date_fin: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        {errors?.date_fin && <p className="text-[10px] text-red-500 font-bold mt-[-10px] italic">{errors.date_fin[0]}</p>}

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block italic">Wilaya Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 text-red-500" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl outline-none text-sm font-black text-blue-700"
                                        value={formData.wilaya_destination}
                                        onChange={e => setFormData({ ...formData, wilaya_destination: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Conducteur</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer"
                                    value={formData.conducteur_id}
                                    onChange={e => setFormData({ ...formData, conducteur_id: e.target.value })}
                                    required
                                >
                                    <option value="">{!formData.date_fin ? "Fixez une date de fin d'abord" : "Choisir un agent"}</option>
                                    {conducteursLibres.map(c => (
                                        <option key={c.id} value={c.id}>{c.nom} {c.prenom} — [{c.vehicule?.immatriculation}]</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rayon: {formData.zone_rayon_m}m</label>
                            <input
                                type="range" min="100" max="100000" step="100"
                                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg"
                                value={formData.zone_rayon_m}
                                onChange={e => setFormData({ ...formData, zone_rayon_m: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 text-slate-500 font-bold text-[11px] uppercase rounded-2xl hover:bg-slate-50">Annuler</button>
                            <button
                                type="submit"
                                disabled={loading || !formData.conducteur_id}
                                className="flex-[2] px-4 py-4 bg-slate-900 text-white font-bold rounded-2xl text-[11px] uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-black"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : (missionToEdit ? <><Send size={16} /> Mettre à jour</> : <><Send size={16} /> Confirmer</>)}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="w-full md:w-7/12 relative bg-slate-100">
                    <div className="absolute top-6 left-6 right-6 z-[1001] pointer-events-none">
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-3xl shadow-2xl border border-white/20 pointer-events-auto">
                            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><Target size={20} /></div>
                            <input 
                                type="text" placeholder="Rechercher une adresse..." className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-800"
                                value={addressInput} onChange={(e) => setAddressInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress(e)}
                            />
                            <button onClick={handleSearchAddress} className="p-2 hover:bg-slate-100 rounded-full text-blue-600">
                                {searchingAddress ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            </button>
                        </div>
                    </div>
                    <MapContainer center={[formData.zone_lat, formData.zone_lng]} zoom={12} className="h-full w-full">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapRecenter lat={formData.zone_lat} lng={formData.zone_lng} />
                        <LocationPicker onLocationSelect={handleMapClick} />
                        <Marker position={[formData.zone_lat, formData.zone_lng]} />
                        <Circle center={[formData.zone_lat, formData.zone_lng]} radius={formData.zone_rayon_m} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }} />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}