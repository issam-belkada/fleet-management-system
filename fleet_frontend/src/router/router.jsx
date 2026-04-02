import { createBrowserRouter, Navigate } from "react-router-dom";

// Import des Layouts
import AdminLayout from "../layouts/AdminLayout";
import GuestLayout from "../layouts/GuestLayout";
import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Vehicules from "../pages/admin/vehicules/Vehicules";
import Conducteurs from "../pages/admin/chauffeurs/Conducteurs.jsx";
import Alertes from "../pages/admin/alertes/Alertes.jsx";

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
      { path: "vehicules", element: <Vehicules /> },
      { path: "conducteurs", element: <Conducteurs /> },
      { path: "alertes", element: <Alertes /> }
      
    ],
  },
])

export default router;