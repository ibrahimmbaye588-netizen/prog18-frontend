import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { connexion, enregistrerToken } from "../api.js";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
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
        <p className="sous-titre">Connecte-toi à ton entreprise</p>

        <form onSubmit={gererSoumission}>
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
            required
          />

          {erreur && <div className="erreur">⚠️ {erreur}</div>}

          <button type="submit" disabled={chargement}>
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <Link to="/inscription" className="lien-secondaire">
          Pas encore de compte ? En créer un
        </Link>

        <div className="api-info">
          API : {import.meta.env.VITE_API_URL || "https://prog18-backend.onrender.com"}
        </div>
      </div>
    </div>
  );
}
