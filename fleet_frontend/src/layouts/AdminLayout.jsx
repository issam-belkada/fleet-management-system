import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";
import Sidebar from "../components/Sidebar";
import { Bell, User, LogOut, Search } from "lucide-react";
import axiosClient from "../api/axios";

export default function AdminLayout() {
  const { user, setUser, loading } = useStateContext();
  const location = useLocation();

  // 1. Gestion de la déconnexion
  const onLogout = async (ev) => {
    ev.preventDefault();
    try {
      await axiosClient.post('/logout');
      setUser(null); // On vide l'utilisateur du contexte
    } catch (err) {
      console.error("Erreur lors de la déconnexion", err);
    }
  };

  // 2. Protection de la route
  if (loading) return null; // Attendre la fin du check auth du ContextProvider

  if (!user) {
    return <Navigate to="/login" />;
  }

  // 3. Titre dynamique basé sur l'URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return "Tableau de Bord";
    if (path.includes('vehicules')) return "Gestion de la Flotte";
    if (path.includes('missions')) return "Suivi des Missions";
    if (path.includes('alertes')) return "Journal des Alertes";
    return "Administration";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar Fixe */}
      <Sidebar />

      {/* Contenu Principal */}
      <div className="flex-1 ml-64 flex flex-col">
        
        {/* Navbar Supérieure */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Barre de recherche rapide */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un véhicule..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-cetic-blue outline-none w-64 transition-all"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profil Utilisateur */}
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role || 'Gestionnaire'}</p>
              </div>
              <div className="group relative">
                <button className="w-10 h-10 bg-cetic-blue text-white rounded-full flex items-center justify-center font-bold hover:bg-blue-700 transition-colors">
                  {user.name?.charAt(0).toUpperCase()}
                </button>
                
                {/* Menu déroulant au survol/clic */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/admin/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User size={16} /> Mon Profil
                  </Link>
                  <hr className="my-1 border-gray-100" />
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

        {/* Zone de contenu dynamique (Pages) */}
        <main className="p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}