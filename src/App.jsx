import { Routes, Route, Navigate } from "react-router-dom";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import TableauDeBord from "./pages/TableauDeBord.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Devis from "./pages/Devis.jsx";
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
        path="/catalogue"
        element={<RouteProtegee enfant={<Catalogue />} />}
      />
      <Route
        path="/devis"
        element={<RouteProtegee enfant={<Devis />} />}
      />
    </Routes>
  );
}
