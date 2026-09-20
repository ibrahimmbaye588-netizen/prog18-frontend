import { Link, useNavigate } from "react-router-dom";
import { supprimerToken } from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

export default function Menu() {
  const navigate = useNavigate();

  function gererDeconnexion() {
    supprimerToken();
    navigate("/");
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>☰ Menu</h1>
      </div>

      <div className="grille-modules">
        <Link to="/devis" className="carte carte-module">
          <span className="icone-module">📄</span>
          <h3>Devis</h3>
          <p className="sous-titre">Créer et suivre les devis clients</p>
        </Link>
        <Link to="/stock" className="carte carte-module">
          <span className="icone-module">📊</span>
          <h3>Stock</h3>
          <p className="sous-titre">Entrées, sorties, historique</p>
        </Link>
        <Link to="/parametres" className="carte carte-module">
          <span className="icone-module">⚙️</span>
          <h3>Paramètres</h3>
          <p className="sous-titre">Infos de l'entreprise, compte</p>
        </Link>
      </div>

      <div className="carte carte-formulaire" style={{ maxWidth: "400px", marginTop: 24 }}>
        <button className="bouton-annuler" onClick={gererDeconnexion}>
          Se déconnecter
        </button>
      </div>

      <BarreNavigation />
    </div>
  );
}
