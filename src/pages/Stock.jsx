import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listerArticles,
  listerMouvementsStock,
  creerMouvementStock,
  obtenirUtilisateurCourant,
  supprimerToken,
} from "../api.js";

const SEUIL_STOCK_BAS = 5;
const MOUVEMENT_VIDE = { article_id: "", type: "entree", quantite: 1, motif: "" };

export default function Stock() {
  const [articles, setArticles] = useState(null);
  const [mouvements, setMouvements] = useState(null);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [valeurs, setValeurs] = useState(MOUVEMENT_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const navigate = useNavigate();

  function chargerTout() {
    listerArticles().then(setArticles).catch((err) => setErreur(err.message));
    listerMouvementsStock().then(setMouvements).catch(() => {});
  }

  useEffect(() => {
    obtenirUtilisateurCourant().catch(() => {
      supprimerToken();
      navigate("/");
    });
    chargerTout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ouvrirFormulaire(articleId) {
    setValeurs({ ...MOUVEMENT_VIDE, article_id: articleId || "" });
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");

    try {
      await creerMouvementStock({
        article_id: parseInt(valeurs.article_id, 10),
        type: valeurs.type,
        quantite: parseInt(valeurs.quantite, 10) || 1,
        motif: valeurs.motif || null,
      });
      fermerFormulaire();
      chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>🔧 PROG 1.8</h1>
        <Link to="/tableau-de-bord" className="lien-secondaire" style={{ marginTop: 0 }}>
          ← Tableau de bord
        </Link>
      </div>

      <div className="entete-catalogue">
        <h2>Stock</h2>
        <button className="bouton-principal" onClick={() => ouvrirFormulaire("")}>
          + Enregistrer un mouvement
        </button>
      </div>

      {erreur && !formulaireOuvert && <div className="erreur">⚠️ {erreur}</div>}

      {formulaireOuvert && (
        <div className="carte carte-formulaire">
          <h3>Nouveau mouvement de stock</h3>
          <form onSubmit={gererSoumission}>
            <label htmlFor="article_id">Article</label>
            <select
              id="article_id"
              required
              value={valeurs.article_id}
              onChange={(e) => setValeurs({ ...valeurs, article_id: e.target.value })}
            >
              <option value="">— Choisir un article —</option>
              {(articles || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} (stock actuel : {a.quantite_stock})
                </option>
              ))}
            </select>

            <div className="ligne-champs">
              <div>
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={valeurs.type}
                  onChange={(e) => setValeurs({ ...valeurs, type: e.target.value })}
                >
                  <option value="entree">Entrée (réception)</option>
                  <option value="sortie">Sortie (vente/utilisation)</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantite">Quantité</label>
                <input
                  id="quantite"
                  type="number"
                  min="1"
                  required
                  value={valeurs.quantite}
                  onChange={(e) => setValeurs({ ...valeurs, quantite: e.target.value })}
                />
              </div>
            </div>

            <label htmlFor="motif">Motif (optionnel)</label>
            <input
              id="motif"
              type="text"
              placeholder="Ex : livraison fournisseur, vente comptoir..."
              value={valeurs.motif}
              onChange={(e) => setValeurs({ ...valeurs, motif: e.target.value })}
            />

            {erreur && <div className="erreur">⚠️ {erreur}</div>}

            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" className="bouton-annuler" onClick={fermerFormulaire}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <h3 className="titre-section">Niveaux actuels</h3>
      {articles === null && <p className="sous-titre">Chargement...</p>}
      {articles && articles.length === 0 && (
        <p className="sous-titre">Aucun article au catalogue pour l'instant.</p>
      )}
      {articles && articles.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>Article</th>
                <th>Stock actuel</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.nom}</td>
                  <td>{a.quantite_stock}</td>
                  <td>
                    {a.quantite_stock < SEUIL_STOCK_BAS && (
                      <span className="badge-statut badge-statut-refuse">Stock bas</span>
                    )}
                  </td>
                  <td className="cellule-actions">
                    <button className="bouton-lien" onClick={() => ouvrirFormulaire(a.id)}>
                      + Mouvement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="titre-section">Historique des mouvements</h3>
      {mouvements === null && <p className="sous-titre">Chargement...</p>}
      {mouvements && mouvements.length === 0 && (
        <p className="sous-titre">Aucun mouvement enregistré pour l'instant.</p>
      )}
      {mouvements && mouvements.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>Article</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Motif</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((m) => (
                <tr key={m.id}>
                  <td>{m.article_nom || "—"}</td>
                  <td>
                    <span
                      className={`badge-statut ${
                        m.type === "entree" ? "badge-statut-accepte" : "badge-statut-envoye"
                      }`}
                    >
                      {m.type === "entree" ? "Entrée" : "Sortie"}
                    </span>
                  </td>
                  <td>{m.type === "entree" ? "+" : "-"}{m.quantite}</td>
                  <td className="cellule-description">{m.motif || "—"}</td>
                  <td>{new Date(m.cree_le).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
