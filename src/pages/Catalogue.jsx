import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listerArticles,
  creerArticle,
  modifierArticle,
  supprimerArticle,
  rechercherPhotos,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

const ARTICLE_VIDE = {
  reference: "",
  nom: "",
  description: "",
  prix_achat: "",
  prix: "",
  quantite_stock: "",
  seuil_alerte: "5",
  photo_url: "",
};
const LARGEUR_MAX_PHOTO = 900;

export default function Catalogue() {
  const [articles, setArticles] = useState(null);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [articleEnEdition, setArticleEnEdition] = useState(null);
  const [valeursFormulaire, setValeursFormulaire] = useState(ARTICLE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [photosProposees, setPhotosProposees] = useState(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [traitementPhoto, setTraitementPhoto] = useState(false);
  const entreeAppareilPhoto = useRef(null);
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
    setPhotosProposees(null);
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(article) {
    setArticleEnEdition(article);
    setValeursFormulaire({
      reference: article.reference || "",
      nom: article.nom,
      description: article.description || "",
      prix_achat: String(article.prix_achat ?? "0"),
      prix: String(article.prix),
      quantite_stock: String(article.quantite_stock),
      seuil_alerte: String(article.seuil_alerte ?? "5"),
      photo_url: article.photo_url || "",
    });
    setPhotosProposees(null);
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setArticleEnEdition(null);
    setPhotosProposees(null);
  }

  async function gererRechercherPhotos() {
    if (!valeursFormulaire.nom.trim()) return;
    setRechercheEnCours(true);
    setErreur("");
    try {
      const resultats = await rechercherPhotos(valeursFormulaire.nom);
      setPhotosProposees(resultats);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setRechercheEnCours(false);
    }
  }

  function choisirPhoto(url) {
    setValeursFormulaire({ ...valeursFormulaire, photo_url: url });
    setPhotosProposees(null);
  }

  function ouvrirAppareilPhoto() {
    entreeAppareilPhoto.current?.click();
  }

  function gererPhotoAppareil(e) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur("");
    setTraitementPhoto(true);

    const lecteur = new FileReader();
    lecteur.onload = (evt) => {
      const image = new Image();
      image.onload = () => {
        const echelle = Math.min(1, LARGEUR_MAX_PHOTO / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = image.width * echelle;
        canvas.height = image.height * echelle;
        const contexte = canvas.getContext("2d");
        contexte.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setValeursFormulaire((valeurs) => ({ ...valeurs, photo_url: dataUrl }));
        setTraitementPhoto(false);
      };
      image.onerror = () => {
        setErreur("Impossible de lire cette photo, réessaie.");
        setTraitementPhoto(false);
      };
      image.src = evt.target.result;
    };
    lecteur.onerror = () => {
      setErreur("Impossible de lire cette photo, réessaie.");
      setTraitementPhoto(false);
    };
    lecteur.readAsDataURL(fichier);
    e.target.value = "";
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");

    const donnees = {
      reference: valeursFormulaire.reference || null,
      nom: valeursFormulaire.nom,
      description: valeursFormulaire.description || null,
      prix_achat: parseFloat(valeursFormulaire.prix_achat) || 0,
      prix: parseFloat(valeursFormulaire.prix) || 0,
      quantite_stock: parseInt(valeursFormulaire.quantite_stock, 10) || 0,
      seuil_alerte: parseInt(valeursFormulaire.seuil_alerte, 10) || 5,
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
        <h1>📦 Produits</h1>
        <button className="bouton-principal" onClick={ouvrirCreation}>
          + Ajouter
        </button>
      </div>

      {erreur && !formulaireOuvert && <div className="erreur">⚠️ {erreur}</div>}

      {formulaireOuvert && (
        <div className="carte carte-formulaire">
          <h3>{articleEnEdition ? "Modifier le produit" : "Nouveau produit"}</h3>
          <form onSubmit={gererSoumission}>
            <div className="ligne-champs">
              <div>
                <label htmlFor="reference">Référence (optionnel)</label>
                <input
                  id="reference"
                  type="text"
                  value={valeursFormulaire.reference}
                  onChange={(e) => setValeursFormulaire({ ...valeursFormulaire, reference: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="nom">Nom</label>
                <input
                  id="nom"
                  type="text"
                  required
                  value={valeursFormulaire.nom}
                  onChange={(e) => setValeursFormulaire({ ...valeursFormulaire, nom: e.target.value })}
                />
              </div>
            </div>

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
                <label htmlFor="prix_achat">Prix d'achat (FCFA)</label>
                <input
                  id="prix_achat"
                  type="number"
                  step="1"
                  min="0"
                  value={valeursFormulaire.prix_achat}
                  onChange={(e) =>
                    setValeursFormulaire({ ...valeursFormulaire, prix_achat: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="prix">Prix de vente (FCFA)</label>
                <input
                  id="prix"
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={valeursFormulaire.prix}
                  onChange={(e) =>
                    setValeursFormulaire({ ...valeursFormulaire, prix: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="ligne-champs">
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
              <div>
                <label htmlFor="seuil_alerte">Seuil d'alerte</label>
                <input
                  id="seuil_alerte"
                  type="number"
                  min="0"
                  value={valeursFormulaire.seuil_alerte}
                  onChange={(e) =>
                    setValeursFormulaire({ ...valeursFormulaire, seuil_alerte: e.target.value })
                  }
                />
              </div>
            </div>

            <label htmlFor="photo_url">Photo</label>
            <div className="ligne-photo">
              <input
                id="photo_url"
                type="text"
                placeholder="URL de la photo (optionnel)"
                value={
                  valeursFormulaire.photo_url.startsWith("data:")
                    ? "Photo prise avec l'appareil"
                    : valeursFormulaire.photo_url
                }
                onChange={(e) =>
                  setValeursFormulaire({ ...valeursFormulaire, photo_url: e.target.value })
                }
              />
            </div>

            <div className="ligne-boutons-photo">
              <button
                type="button"
                className="bouton-secondaire-inline"
                onClick={ouvrirAppareilPhoto}
                disabled={traitementPhoto}
              >
                {traitementPhoto ? "Traitement..." : "📷 Prendre une photo"}
              </button>
              <button
                type="button"
                className="bouton-secondaire-inline"
                onClick={gererRechercherPhotos}
                disabled={rechercheEnCours || !valeursFormulaire.nom.trim()}
              >
                {rechercheEnCours ? "Recherche..." : "🔍 Chercher en ligne"}
              </button>
            </div>

            <input
              ref={entreeAppareilPhoto}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={gererPhotoAppareil}
              style={{ display: "none" }}
            />

            {valeursFormulaire.photo_url && (
              <img src={valeursFormulaire.photo_url} alt="Aperçu" className="apercu-photo" />
            )}

            {photosProposees && photosProposees.length > 0 && (
              <div className="grille-photos">
                {photosProposees.map((p, i) => (
                  <img
                    key={i}
                    src={p.miniature}
                    alt={p.photographe || "Suggestion"}
                    className="miniature-photo"
                    onClick={() => choisirPhoto(p.url)}
                  />
                ))}
              </div>
            )}
            {photosProposees && photosProposees.length === 0 && (
              <p className="sous-titre">Aucun résultat pour cette recherche.</p>
            )}

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
        <p className="sous-titre">Aucun produit pour l'instant. Ajoute le premier ci-dessus.</p>
      )}

      {articles && articles.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th></th>
                <th>Nom</th>
                <th>Prix vente</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    {article.photo_url && (
                      <img src={article.photo_url} alt={article.nom} className="miniature-article" />
                    )}
                  </td>
                  <td>
                    {article.nom}
                    {article.reference && (
                      <div className="sous-titre" style={{ margin: 0, fontSize: 11 }}>
                        Réf : {article.reference}
                      </div>
                    )}
                  </td>
                  <td>{formaterMontant(article.prix)}</td>
                  <td>
                    {article.quantite_stock}
                    {article.quantite_stock <= (article.seuil_alerte ?? 5) && (
                      <span className="badge-statut badge-statut-refuse" style={{ marginLeft: 6 }}>
                        Bas
                      </span>
                    )}
                  </td>
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

      <BarreNavigation />
    </div>
  );
}
