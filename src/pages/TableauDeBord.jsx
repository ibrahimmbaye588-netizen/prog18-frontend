import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        // Token invalide ou expiré : retour à la connexion
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
        <p className="sous-titre" style={{ marginTop: 24 }}>
          Le catalogue, les devis et le stock arriveront ici prochainement.
        </p>
      </div>
    </div>
  );
}
