import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStateContext } from "../context/ContextProvider";
import Sidebar from "../components/Sidebar";
import { Bell, User, LogOut, AlertTriangle, CheckCircle } from "lucide-react";
import axiosClient from "../api/axios";
import { echo } from "../api/echo";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLayout() {
  const { user, setUser, loading } = useStateContext();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);

  const unreadCount = alerts.filter(a => !a.acquittee).length;

  useEffect(() => {
    if (user) {
      fetchInitialAlerts();
      listenForAlerts();
    }
    return () => {
      echo.leaveChannel('admin-notifications');
    };
  }, [user]);

  const fetchInitialAlerts = async () => {
    try {
      const { data } = await axiosClient.get('/alertes-non_acquittees'); 
      setAlerts(data);
    } catch (err) {
      console.error("Erreur chargement alertes", err);
    }
  };

  const listenForAlerts = () => {
    // Nettoyage préventif du canal pour éviter les listeners multiples
    echo.leaveChannel('admin-notifications');

    echo.channel('admin-notifications')
      .listen('.alerte.new', (e) => {
        setAlerts(prev => {
          // Empêche l'ajout si l'alerte existe déjà dans la liste (doublon Echo)
          if (prev.some(a => a.id === e.alerte.id)) return prev;
          return [e.alerte, ...prev].slice(0, 10);
        });

        // Utilisation de l'ID de l'alerte pour le toast (évite les doubles popups)
        toast.error(`Nouvelle Alerte : ${e.alerte.vehicule?.immatriculation}`, {
          id: `toast-alerte-${e.alerte.id}`, 
          position: 'top-right'
        });
      });
  };

  const handleAcquitter = async (e, alerteId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axiosClient.patch(`/alertes/${alerteId}/acquitter`);
      setAlerts(prev => prev.map(a => 
        a.id === alerteId ? { ...a, acquittee: true } : a
      ));
      toast.success("Alerte traitée");
    } catch (err) {
      toast.error("Erreur lors de l'acquittement");
    }
  };

  const onLogout = async (ev) => {
    ev.preventDefault();
    try {
      await axiosClient.post('/logout');
      setUser(null);
      localStorage.removeItem('ACCESS_TOKEN');
    } catch (err) {
      console.error("Erreur déconnexion", err);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return "Tableau de Bord";
    if (path.includes('carte')) return "Carte de Flotte";
    if (path.includes('vehicules')) return "Gestion de la Flotte";
    if (path.includes('conducteurs')) return "Gestion des Conducteurs";
    if (path.includes('missions')) return "Suivi des Missions";
    if (path.includes('alertes')) return "Journal des Alertes";
    return "Administration";
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      <Toaster />
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="group relative">
              <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 pb-2 border-b border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-400">Alertes Récentes</span>
                  <Link to="/admin/alertes" className="text-[10px] text-blue-600 font-bold hover:underline">Voir tout</Link>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-400 italic">Aucune alerte récente</p>
                  ) : (
                    alerts.map(alerte => (
                      <div key={alerte.id} className="relative group/item">
                        <Link 
                          to={`/admin/alertes/${alerte.id}`}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                            alerte.acquittee ? 'hover:bg-green-50' : 'hover:bg-red-50'
                          }`}
                        >
                          <div className={`mt-1 p-2 rounded-lg ${
                            alerte.acquittee ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {alerte.acquittee ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-[11px] font-bold text-gray-900 leading-tight truncate pr-2">
                                {alerte.vehicule?.immatriculation}
                              </p>
                              {!alerte.acquittee && (
                                <button 
                                  onClick={(e) => handleAcquitter(e, alerte.id)}
                                  className="flex-shrink-0 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                  Acquitter
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                              {alerte.type_alerte.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role || 'Admin'}</p>
              </div>
              <div className="group relative">
                <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold hover:bg-blue-700 transition-colors">
                  {user.name?.charAt(0).toUpperCase()}
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}