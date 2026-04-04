import { createBrowserRouter, Navigate } from "react-router-dom";

// Import des Layouts
import AdminLayout from "../layouts/AdminLayout";
import GuestLayout from "../layouts/GuestLayout";
import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Vehicules from "../pages/admin/vehicules/Vehicules";
import Conducteurs from "../pages/admin/chauffeurs/Conducteurs.jsx";
import Missions from "../pages/admin/missions/Missions.jsx";
import Alertes from "../pages/admin/alertes/Alertes.jsx";
import FleetMap from "../pages/admin/FleetMap.jsx";
import ConducteurDetails from "../pages/admin/chauffeurs/ConducteurDetails.jsx";
import VehiculeDetails from "../pages/admin/vehicules/VehiculeDetails.jsx";
import MissionDetails from "../pages/admin/missions/MissionDetails.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <GuestLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Login /> },
    ],
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "carte", element: <FleetMap /> },
      { path: "vehicules", element: <Vehicules /> },
      { path: "vehicules/:id", element: <VehiculeDetails /> },
      { path: "missions", element: <Missions /> },
      { path: "missions/:id", element: <MissionDetails /> },
      { path: "conducteurs", element: <Conducteurs /> },
      { path: "conducteurs/:id", element: <ConducteurDetails /> },
      { path: "alertes", element: <Alertes /> }
      
    ],
  },
])

export default router;