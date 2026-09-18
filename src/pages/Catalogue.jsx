import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listerArticles,
  creerArticle,
  modifierArticle,
  supprimerArticle,
  obtenirUtilisateurCourant,
  supprimerToken,
} from "../api.js";

const ARTICLE_VIDE = { nom: "", description: "", prix: "", quantite_stock: "", photo_url: "" };

export default function Catalogue() {
  const [articles, setArticles] = useState(null);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [articleEnEdition, setArticleEnEdition] = useState(null); // null = création
  const [valeursFormulaire, setValeursFormulaire] = useState(ARTICLE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const navigate = useNavigate();

  function chargerArticles() {
    listerArticles()
      .then(setArticles)
      .catch((err) => {
        setErreur(err.message);
        if (err.message.includes("401") || err.message.toLowerCase().includes("identifiants")) {
          supprimerToken();
          navigate("/");
        }
      });
  }

  useEffect(() => {
    obtenirUtilisateurCourant().catch(() => {
      supprimerToken();
      navigate("/");
    });
    chargerArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ouvrirCreation() {
    setArticleEnEdition(null);
    setValeursFormulaire(ARTICLE_VIDE);
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(article) {
    setArticleEnEdition(article);
    setValeursFormulaire({
      nom: article.nom,
      description: article.description || "",
      prix: String(article.prix),
      quantite_stock: String(article.quantite_stock),
      photo_url: article.photo_url || "",
    });
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setArticleEnEdition(null);
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");

    const donnees = {
      nom: valeursFormulaire.nom,
      description: valeursFormulaire.description || null,
      prix: parseFloat(valeursFormulaire.prix) || 0,
      quantite_stock: parseInt(valeursFormulaire.quantite_stock, 10) || 0,
      photo_url: valeursFormulaire.photo_url || null,
    };

    try {
      if (articleEnEdition) {
        await modifierArticle(articleEnEdition.id, donnees);
      } else {
        await creerArticle(donnees);
      }
      fermerFormulaire();
      chargerArticles();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(article) {
    if (!window.confirm(`Supprimer "${article.nom}" du catalogue ?`)) return;
    try {
      await supprimerArticle(article.id);
      chargerArticles();
    } catch (err) {
      setErreur(err.message);
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
        <h2>Catalogue d'articles</h2>
        <button className="bouton-principal" onClick={ouvrirCreation}>
          + Ajouter un article
        </button>
      </div>

      {erreur && !formulaireOuvert && <div className="erreur">⚠️ {erreur}</div>}

      {formulaireOuvert && (
        <div className="carte carte-formulaire">
          <h3>{articleEnEdition ? "Modifier l'article" : "Nouvel article"}</h3>
          <form onSubmit={gererSoumission}>
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              type="text"
              required
              value={valeursFormulaire.nom}
              onChange={(e) => setValeursFormulaire({ ...valeursFormulaire, nom: e.target.value })}
            />

            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={valeursFormulaire.description}
              onChange={(e) =>
                setValeursFormulaire({ ...valeursFormulaire, description: e.target.value })
              }
            />

            <div className="ligne-champs">
              <div>
                <label htmlFor="prix">Prix</label>
                <input
                  id="prix"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valeursFormulaire.prix}
                  onChange={(e) =>
                    setValeursFormulaire({ ...valeursFormulaire, prix: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="quantite_stock">Stock</label>
                <input
                  id="quantite_stock"
                  type="number"
                  min="0"
                  required
                  value={valeursFormulaire.quantite_stock}
                  onChange={(e) =>
                    setValeursFormulaire({ ...valeursFormulaire, quantite_stock: e.target.value })
                  }
                />
              </div>
            </div>

            <label htmlFor="photo_url">URL photo (optionnel)</label>
            <input
              id="photo_url"
              type="text"
              value={valeursFormulaire.photo_url}
              onChange={(e) =>
                setValeursFormulaire({ ...valeursFormulaire, photo_url: e.target.value })
              }
            />

            {erreur && <div className="erreur">⚠️ {erreur}</div>}

            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : articleEnEdition ? "Enregistrer" : "Ajouter"}
              </button>
              <button type="button" className="bouton-annuler" onClick={fermerFormulaire}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {articles === null && !erreur && <p className="sous-titre">Chargement du catalogue...</p>}

      {articles && articles.length === 0 && (
        <p className="sous-titre">Aucun article pour l'instant. Ajoute le premier ci-dessus.</p>
      )}

      {articles && articles.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Prix</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.nom}</td>
                  <td className="cellule-description">{article.description || "—"}</td>
                  <td>{Number(article.prix).toFixed(2)} €</td>
                  <td>{article.quantite_stock}</td>
                  <td className="cellule-actions">
                    <button className="bouton-lien" onClick={() => ouvrirEdition(article)}>
                      Modifier
                    </button>
                    <button className="bouton-lien bouton-danger" onClick={() => gererSuppression(article)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
