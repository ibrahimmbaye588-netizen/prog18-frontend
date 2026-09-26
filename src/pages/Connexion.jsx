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
    <div className="ecran-connexion">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .ecran-connexion {
          --bg: #14171c;
          --panel: #1a1e24;
          --card: #20242b;
          --ligne: #2b303a;
          --texte: #f2f1ed;
          --texte-att: #9aa3af;
          --accent: #e8933a;
          --accent-sombre: #b9722a;
          --erreur: #e2574c;

          min-height: 100vh;
          display: flex;
          background: var(--bg);
          color: var(--texte);
          font-family: 'IBM Plex Sans', -apple-system, "Segoe UI", Arial, sans-serif;
        }

        .ecran-connexion .volet-identite {
          position: relative;
          flex: 1 1 46%;
          display: none;
          flex-direction: column;
          justify-content: center;
          padding: 64px;
          background: var(--panel);
          overflow: hidden;
        }

        .ecran-connexion .volet-identite::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image:
            repeating-linear-gradient(0deg, #6b7686 0, #6b7686 1px, transparent 1px, transparent 48px),
            repeating-linear-gradient(90deg, #6b7686 0, #6b7686 1px, transparent 1px, transparent 48px);
        }

        .ecran-connexion .reperes span {
          position: absolute;
          width: 18px;
          height: 18px;
          border: 2px solid var(--accent);
        }
        .ecran-connexion .reperes span:nth-child(1) { top: 48px; left: 48px; border-right: none; border-bottom: none; }
        .ecran-connexion .reperes span:nth-child(2) { bottom: 48px; right: 48px; border-left: none; border-top: none; }

        .ecran-connexion .marque {
          position: relative;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 64px;
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .ecran-connexion .marque small {
          display: block;
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 500;
          font-size: 17px;
          color: var(--texte-att);
          margin-top: 20px;
          max-width: 34ch;
          line-height: 1.5;
        }

        .ecran-connexion .marque-trait {
          position: relative;
          width: 64px;
          height: 3px;
          background: var(--accent);
          margin: 28px 0 0;
        }

        .ecran-connexion .volet-formulaire {
          flex: 1 1 54%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
        }

        .ecran-connexion .bloc-formulaire {
          width: 100%;
          max-width: 380px;
        }

        .ecran-connexion .marque-mobile {
          display: block;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 30px;
          margin: 0 0 8px;
        }

        .ecran-connexion .accroche {
          color: var(--texte-att);
          font-size: 15px;
          margin: 0 0 36px;
        }

        .ecran-connexion .champ {
          margin-bottom: 22px;
        }

        .ecran-connexion .champ label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--texte-att);
          margin-bottom: 8px;
        }

        .ecran-connexion .champ input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--ligne);
          color: var(--texte);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          padding: 8px 2px;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .ecran-connexion .champ input:focus {
          outline: none;
          border-bottom-color: var(--accent);
        }

        .ecran-connexion .champ input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .ecran-connexion .erreur-connexion {
          background: rgba(226, 87, 76, 0.12);
          border: 1px solid rgba(226, 87, 76, 0.4);
          color: #f3a8a1;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .ecran-connexion .bouton-connexion {
          width: 100%;
          background: var(--accent);
          color: #1a1408;
          border: none;
          border-radius: 4px;
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 13px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .ecran-connexion .bouton-connexion:hover:not(:disabled) {
          background: var(--accent-sombre);
        }

        .ecran-connexion .bouton-connexion:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .ecran-connexion .bouton-connexion:focus-visible {
          outline: 2px solid var(--texte);
          outline-offset: 2px;
        }

        .ecran-connexion .lien-inscription {
          display: block;
          text-align: center;
          color: var(--texte-att);
          font-size: 13.5px;
          margin-top: 24px;
          text-decoration: none;
        }

        .ecran-connexion .lien-inscription:hover {
          color: var(--texte);
        }

        .ecran-connexion .repere-api {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid var(--ligne);
          color: var(--texte-att);
          font-size: 11px;
          font-family: 'IBM Plex Sans', sans-serif;
          word-break: break-all;
        }

        @media (min-width: 880px) {
          .ecran-connexion .volet-identite {
            display: flex;
          }
          .ecran-connexion .marque-mobile {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ecran-connexion * {
            transition: none !important;
          }
        }
      `}</style>

      <div className="volet-identite">
        <div className="reperes">
          <span></span>
          <span></span>
        </div>
        <h1 className="marque">
          Prog 1.8
          <small>Devis, factures, stock et clients — piloté depuis un seul endroit, pensé pour l'atelier autant que pour le bureau.</small>
        </h1>
        <div className="marque-trait"></div>
      </div>

      <div className="volet-formulaire">
        <div className="bloc-formulaire">
          <h1 className="marque-mobile">Prog 1.8</h1>
          <p className="accroche">Connecte-toi à ton entreprise</p>

          <form onSubmit={gererSoumission}>
            <div className="champ">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="champ">
              <label htmlFor="mot-de-passe">Mot de passe</label>
              <input
                id="mot-de-passe"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
            </div>

            {erreur && <div className="erreur-connexion">{erreur}</div>}

            <button type="submit" className="bouton-connexion" disabled={chargement}>
              {chargement ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <Link to="/inscription" className="lien-inscription">
            Pas encore de compte ? En créer un
          </Link>

          <div className="repere-api">
            API : {import.meta.env.VITE_API_URL || "https://prog18-backend.onrender.com"}
          </div>
        </div>
      </div>
    </div>
  );
}
