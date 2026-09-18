import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenirUtilisateurCourant, supprimerToken } from "../api.js";

export default function TableauDeBord() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    obtenirUtilisateurCourant()
      .then(setUtilisateur)
      .catch((err) => {
        setErreur(err.message);
        supprimerToken();
        navigate("/");
      });
  }, [navigate]);

  function gererDeconnexion() {
    supprimerToken();
    navigate("/");
  }

  if (erreur) {
    return <div className="page-centree">{erreur}</div>;
  }

  if (!utilisateur) {
    return <div className="page-centree">Chargement...</div>;
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>🔧 PROG 1.8</h1>
        <button className="bouton-deconnexion" onClick={gererDeconnexion}>
          Se déconnecter
        </button>
      </div>

      <div className="carte" style={{ maxWidth: "100%" }}>
        <p className="sous-titre">Connecté en tant que</p>
        <p>
          <strong>{utilisateur.email}</strong>
          {utilisateur.nom_entreprise && ` — ${utilisateur.nom_entreprise}`}
        </p>
      </div>

      <div className="grille-modules">
        <Link to="/catalogue" className="carte carte-module">
          <span className="icone-module">📦</span>
          <h3>Catalogue</h3>
          <p className="sous-titre">Gérer les articles et leur stock</p>
        </Link>

        <Link to="/devis" className="carte carte-module">
          <span className="icone-module">📄</span>
          <h3>Devis</h3>
          <p className="sous-titre">Créer et suivre les devis clients</p>
        </Link>

        <div className="carte carte-module carte-module-desactivee">
          <span className="icone-module">📊</span>
          <h3>Stock</h3>
          <p className="sous-titre">Bientôt disponible</p>
        </div>
      </div>
    </div>
  );
}
