import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenirUtilisateurCourant, mettreAJourProfil, supprimerToken } from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

export default function Parametres() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    obtenirUtilisateurCourant()
      .then((u) => {
        setUtilisateur(u);
        setNomEntreprise(u.nom_entreprise || "");
      })
      .catch(() => {
        supprimerToken();
        navigate("/");
      });
  }, [navigate]);

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");
    setSucces(false);
    try {
      const maj = await mettreAJourProfil({ nom_entreprise: nomEntreprise });
      setUtilisateur(maj);
      setSucces(true);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function gererDeconnexion() {
    supprimerToken();
    navigate("/");
  }

  if (!utilisateur) {
    return <div className="page-centree">Chargement...</div>;
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>⚙️ Paramètres</h1>
      </div>

      <div className="carte carte-formulaire" style={{ maxWidth: "480px" }}>
        <h3>Entreprise</h3>
        <form onSubmit={gererSoumission}>
          <label htmlFor="email">Email du compte</label>
          <input id="email" type="email" value={utilisateur.email} disabled />

          <label htmlFor="nom_entreprise">Nom de l'entreprise</label>
          <input
            id="nom_entreprise"
            type="text"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
          />

          {erreur && <div className="erreur">⚠️ {erreur}</div>}
          {succes && <div className="succes">✓ Modifications enregistrées</div>}

          <button type="submit" disabled={envoiEnCours}>
            {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="carte carte-formulaire" style={{ maxWidth: "480px" }}>
        <h3>Compte</h3>
        <p className="sous-titre" style={{ marginBottom: 16 }}>
          Membre depuis le {new Date(utilisateur.cree_le).toLocaleDateString("fr-FR")}
        </p>
        <button className="bouton-annuler" onClick={gererDeconnexion}>
          Se déconnecter
        </button>
      </div>

      <BarreNavigation />
    </div>
  );
}
