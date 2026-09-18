import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inscription, connexion, enregistrerToken } from "../api.js";

export default function Inscription() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await inscription({ email, mot_de_passe: motDePasse, nom_entreprise: nomEntreprise });
      // Connexion automatique juste après l'inscription
      const resultat = await connexion({ email, mot_de_passe: motDePasse });
      enregistrerToken(resultat.access_token);
      navigate("/tableau-de-bord");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="page-centree">
      <div className="carte">
        <h1>🔧 PROG 1.8</h1>
        <p className="sous-titre">Crée le compte de ton entreprise</p>

        <form onSubmit={gererSoumission}>
          <label htmlFor="nom-entreprise">Nom de l'entreprise</label>
          <input
            id="nom-entreprise"
            type="text"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="mot-de-passe">Mot de passe</label>
          <input
            id="mot-de-passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            minLength={8}
            required
          />

          {erreur && <div className="erreur">⚠️ {erreur}</div>}

          <button type="submit" disabled={chargement}>
            {chargement ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <Link to="/" className="lien-secondaire">
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </div>
  );
}
