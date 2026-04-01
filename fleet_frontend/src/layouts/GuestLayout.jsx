import { Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider";
import { ShieldCheck } from "lucide-react";

export default function GuestLayout() {
  const { user, loading } = useStateContext();

  // 1. Protection inverse : si l'utilisateur est déjà connecté, 
  // on le redirige directement vers l'admin s'il essaie d'aller sur /login
  if (!loading && user) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-blue-100">
      {/* Décoration d'arrière-plan (optionnel, pour le style) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-100 blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo et Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            CETIC <span className="text-blue-600">SPA</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Système de Gestion de Flotte
          </p>
        </div>

        {/* Card Blanche (Contenu du Login) */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500 delay-150">
          {/* C'est ici que Login.jsx sera injecté */}
          <Outlet />
        </div>

        {/* Footer simple */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Centre de Recherche en Technologies Industrielles
        </div>
      </div>
    </div>
  );
}