import { Routes, Route, Navigate } from "react-router-dom";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import TableauDeBord from "./pages/TableauDeBord.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Devis from "./pages/Devis.jsx";
import ImpressionDevis from "./pages/ImpressionDevis.jsx";
import Stock from "./pages/Stock.jsx";
import Parametres from "./pages/Parametres.jsx";
import Ventes from "./pages/Ventes.jsx";
import Clients from "./pages/Clients.jsx";
import Menu from "./pages/Menu.jsx";
import { obtenirToken } from "./api.js";

function RouteProtegee({ enfant }) {
  return obtenirToken() ? enfant : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route
        path="/tableau-de-bord"
        element={<RouteProtegee enfant={<TableauDeBord />} />}
      />
      <Route
        path="/ventes"
        element={<RouteProtegee enfant={<Ventes />} />}
      />
      <Route
        path="/clients"
        element={<RouteProtegee enfant={<Clients />} />}
      />
      <Route
        path="/menu"
        element={<RouteProtegee enfant={<Menu />} />}
      />
      <Route
        path="/catalogue"
        element={<RouteProtegee enfant={<Catalogue />} />}
      />
      <Route
        path="/devis"
        element={<RouteProtegee enfant={<Devis />} />}
      />
      <Route
        path="/devis/:id/imprimer"
        element={<RouteProtegee enfant={<ImpressionDevis />} />}
      />
      <Route
        path="/stock"
        element={<RouteProtegee enfant={<Stock />} />}
      />
      <Route
        path="/parametres"
        element={<RouteProtegee enfant={<Parametres />} />}
      />
    </Routes>
  );
}
