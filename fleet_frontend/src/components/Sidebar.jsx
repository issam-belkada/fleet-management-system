import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Truck, 
  Map as MapIcon, 
  AlertOctagon, 
  Users, 
  Settings,
  ShieldCheck
} from "lucide-react";

const Sidebar = () => {
  // Liste des liens de navigation
  const menuItems = [
    { 
      path: "/admin/dashboard", 
      icon: <LayoutDashboard size={22} />, 
      label: "Tableau de bord" 
    },
    {
      path: "/admin/carte",
      icon: <MapIcon size={22} />,
      label: "Carte"
    },
    { 
      path: "/admin/vehicules", 
      icon: <Truck size={22} />, 
      label: "Véhicules" 
    },
    { 
      path: "/admin/conducteurs", 
      icon: <Users size={22} />, 
      label: "Chauffeurs" 
    },
    { 
      path: "/admin/missions", 
      icon: <MapIcon size={22} />, 
      label: "Missions" 
    },
    { 
      path: "/admin/alertes", 
      icon: <AlertOctagon size={22} />, 
      label: "Alertes" 
    },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0f172a] text-slate-300 flex flex-col fixed left-0 top-0 z-40 border-r border-white/5">
      {/* Logo & Branding */}
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CETIC</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Fleet Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-blue-600/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]" 
                  : "hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Sidebar (Paramètres / Version) */}
      <div className="p-4 mt-auto border-t border-white/5">
        <NavLink
            to="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
            <Settings size={20} />
            <span className="text-sm font-medium">Paramètres</span>
        </NavLink>
        <div className="mt-4 px-4 py-3 bg-white/5 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Système v1.0.4</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Dernière MAJ: Aujourd'hui</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;