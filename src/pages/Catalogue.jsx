import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  obtenirUtilisateurCourant,
  obtenirResumeTableauDeBord,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

export default function TableauDeBord() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [resume, setResume] = useState(null);
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
    obtenirResumeTableauDeBord()
      .then(setResume)
      .catch((err) => setErreur(err.message));
  }, [navigate]);

  if (erreur && !utilisateur) {
    return <div className="page-centree">{erreur}</div>;
  }

  if (!utilisateur) {
    return <div className="page-centree">Chargement...</div>;
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <div>
          <h1>🔧 {utilisateur.nom_entreprise || "PROG 1.8"}</h1>
          <p className="sous-titre" style={{ margin: 0 }}>{utilisateur.email}</p>
        </div>
        <Link to="/parametres" className="bouton-icone" title="Paramètres">
          ⚙️
        </Link>
      </div>

      {erreur && <div className="erreur">⚠️ {erreur}</div>}

      {!resume && !erreur && <p className="sous-titre">Chargement des statistiques...</p>}

      {resume && (
        <>
          <div className="carte-ca">
            <p className="libelle-ca">Chiffre d'affaires (aujourd'hui)</p>
            <p className="montant-ca">{formaterMontant(resume.chiffre_affaires_jour)}</p>
          </div>

          <div className="grille-stats">
            <div className="carte-stat carte-stat-bleue">
              <p className="valeur-stat">{resume.ventes_jour}</p>
              <p className="libelle-stat">Ventes du jour</p>
            </div>
            <div className="carte-stat carte-stat-verte">
              <p className="valeur-stat">{formaterMontant(resume.benefice_estime_jour)}</p>
              <p className="libelle-stat">Bénéfice estimé</p>
            </div>
            <div className="carte-stat carte-stat-orange">
              <p className="valeur-stat">{resume.nombre_produits}</p>
              <p className="libelle-stat">Produits au catalogue</p>
            </div>
            <div className="carte-stat carte-stat-violette">
              <p className="valeur-stat">{resume.nombre_clients}</p>
              <p className="libelle-stat">Clients</p>
            </div>
          </div>

          {resume.produits_presque_epuises.length > 0 && (
            <>
              <h3 className="titre-section">Produits presque épuisés</h3>
              <div className="carte" style={{ maxWidth: "100%" }}>
                {resume.produits_presque_epuises.map((a) => (
                  <div key={a.id} className="ligne-alerte-stock">
                    <span>{a.nom}</span>
                    <span className="badge-statut badge-statut-refuse">Stock : {a.quantite_stock}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="grille-modules" style={{ marginTop: 32 }}>
        <Link to="/ventes" className="carte carte-module">
          <span className="icone-module">🛒</span>
          <h3>Nouvelle vente</h3>
          <p className="sous-titre">Encaisser une vente au comptoir</p>
        </Link>
        <Link to="/devis" className="carte carte-module">
          <span className="icone-module">📄</span>
          <h3>Devis</h3>
          <p className="sous-titre">Créer et suivre les devis clients</p>
        </Link>
        <Link to="/stock" className="carte carte-module">
          <span className="icone-module">📊</span>
          <h3>Stock</h3>
          <p className="sous-titre">Suivre les entrées et sorties</p>
        </Link>
      </div>

      <BarreNavigation />
    </div>
  );
}
