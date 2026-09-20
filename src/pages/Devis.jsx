import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listerDevis,
  creerDevis,
  modifierDevis,
  supprimerDevis,
  listerArticles,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

const LIGNE_VIDE = { article_id: "", designation: "", quantite: 1, prix_unitaire: "" };
const DEVIS_VIDE = { client_nom: "", statut: "brouillon", notes: "", lignes: [{ ...LIGNE_VIDE }] };

const LIBELLES_STATUT = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

function calculerTotal(lignes) {
  return lignes.reduce((total, l) => {
    const q = parseFloat(l.quantite) || 0;
    const p = parseFloat(l.prix_unitaire) || 0;
    return total + q * p;
  }, 0);
}

export default function Devis() {
  const [devisListe, setDevisListe] = useState(null);
  const [articles, setArticles] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [devisEnEdition, setDevisEnEdition] = useState(null);
  const [valeurs, setValeurs] = useState(DEVIS_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const navigate = useNavigate();

  function chargerDevis() {
    listerDevis()
      .then(setDevisListe)
      .catch((err) => {
        setErreur(err.message);
        if (err.message.toLowerCase().includes("identifiants")) {
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
    chargerDevis();
    listerArticles().then(setArticles).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ouvrirCreation() {
    setDevisEnEdition(null);
    setValeurs(DEVIS_VIDE);
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(devis) {
    setDevisEnEdition(devis);
    setValeurs({
      client_nom: devis.client_nom,
      statut: devis.statut,
      notes: devis.notes || "",
      lignes: devis.lignes.length
        ? devis.lignes.map((l) => ({
            article_id: l.article_id || "",
            designation: l.designation,
            quantite: l.quantite,
            prix_unitaire: String(l.prix_unitaire),
          }))
        : [{ ...LIGNE_VIDE }],
    });
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setDevisEnEdition(null);
  }

  function gererChangementLigne(index, champ, valeur) {
    const nouvellesLignes = [...valeurs.lignes];
    const ligne = { ...nouvellesLignes[index], [champ]: valeur };

    if (champ === "article_id" && valeur) {
      const article = articles.find((a) => a.id === parseInt(valeur, 10));
      if (article) {
        ligne.designation = article.nom;
        ligne.prix_unitaire = String(article.prix);
      }
    }

    nouvellesLignes[index] = ligne;
    setValeurs({ ...valeurs, lignes: nouvellesLignes });
  }

  function ajouterLigne() {
    setValeurs({ ...valeurs, lignes: [...valeurs.lignes, { ...LIGNE_VIDE }] });
  }

  function retirerLigne(index) {
    const nouvellesLignes = valeurs.lignes.filter((_, i) => i !== index);
    setValeurs({ ...valeurs, lignes: nouvellesLignes.length ? nouvellesLignes : [{ ...LIGNE_VIDE }] });
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");

    const donnees = {
      client_nom: valeurs.client_nom,
      statut: valeurs.statut,
      notes: valeurs.notes || null,
      lignes: valeurs.lignes
        .filter((l) => l.designation.trim() !== "")
        .map((l) => ({
          article_id: l.article_id ? parseInt(l.article_id, 10) : null,
          designation: l.designation,
          quantite: parseInt(l.quantite, 10) || 1,
          prix_unitaire: parseFloat(l.prix_unitaire) || 0,
        })),
    };

    try {
      if (devisEnEdition) {
        await modifierDevis(devisEnEdition.id, donnees);
      } else {
        await creerDevis(donnees);
      }
      fermerFormulaire();
      chargerDevis();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(devis) {
    if (!window.confirm(`Supprimer le devis pour "${devis.client_nom}" ?`)) return;
    try {
      await supprimerDevis(devis.id);
      chargerDevis();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>📄 Devis</h1>
        <button className="bouton-principal" onClick={ouvrirCreation}>
          + Nouveau
        </button>
      </div>

      {erreur && !formulaireOuvert && <div className="erreur">⚠️ {erreur}</div>}

      {formulaireOuvert && (
        <div className="carte carte-formulaire" style={{ maxWidth: "100%" }}>
          <h3>{devisEnEdition ? "Modifier le devis" : "Nouveau devis"}</h3>
          <form onSubmit={gererSoumission}>
            <div className="ligne-champs">
              <div>
                <label htmlFor="client_nom">Client</label>
                <input
                  id="client_nom"
                  type="text"
                  required
                  value={valeurs.client_nom}
                  onChange={(e) => setValeurs({ ...valeurs, client_nom: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="statut">Statut</label>
                <select
                  id="statut"
                  value={valeurs.statut}
                  onChange={(e) => setValeurs({ ...valeurs, statut: e.target.value })}
                >
                  {Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {valeurs.statut === "accepte" && (
              <p className="note-info">
                ℹ️ En acceptant ce devis, le stock des articles liés sera automatiquement déduit.
              </p>
            )}

            <label>Lignes du devis</label>
            <table className="tableau-lignes-devis">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Désignation</th>
                  <th>Qté</th>
                  <th>Prix unit.</th>
                  <th>Sous-total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {valeurs.lignes.map((ligne, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={ligne.article_id}
                        onChange={(e) => gererChangementLigne(index, "article_id", e.target.value)}
                      >
                        <option value="">— Libre —</option>
                        {articles.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        required
                        value={ligne.designation}
                        onChange={(e) => gererChangementLigne(index, "designation", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="champ-etroit"
                        value={ligne.quantite}
                        onChange={(e) => gererChangementLigne(index, "quantite", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="champ-etroit"
                        value={ligne.prix_unitaire}
                        onChange={(e) => gererChangementLigne(index, "prix_unitaire", e.target.value)}
                      />
                    </td>
                    <td className="cellule-sous-total">
                      {formaterMontant((parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prix_unitaire) || 0))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="bouton-lien bouton-danger"
                        onClick={() => retirerLigne(index)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="bouton-lien" onClick={ajouterLigne} style={{ marginLeft: 0 }}>
              + Ajouter une ligne
            </button>

            <div className="total-devis">
              Total : <strong>{formaterMontant(calculerTotal(valeurs.lignes))}</strong>
            </div>

            <label htmlFor="notes">Notes (optionnel)</label>
            <input
              id="notes"
              type="text"
              value={valeurs.notes}
              onChange={(e) => setValeurs({ ...valeurs, notes: e.target.value })}
            />

            {erreur && <div className="erreur">⚠️ {erreur}</div>}

            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : devisEnEdition ? "Enregistrer" : "Créer le devis"}
              </button>
              <button type="button" className="bouton-annuler" onClick={fermerFormulaire}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {devisListe === null && !erreur && <p className="sous-titre">Chargement des devis...</p>}

      {devisListe && devisListe.length === 0 && (
        <p className="sous-titre">Aucun devis pour l'instant. Crée le premier ci-dessus.</p>
      )}

      {devisListe && devisListe.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Créé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {devisListe.map((devis) => (
                <tr key={devis.id}>
                  <td>{devis.client_nom}</td>
                  <td>
                    <span className={`badge-statut badge-statut-${devis.statut}`}>
                      {LIBELLES_STATUT[devis.statut] || devis.statut}
                    </span>
                  </td>
                  <td>{formaterMontant(calculerTotal(devis.lignes))}</td>
                  <td>{new Date(devis.cree_le).toLocaleDateString("fr-FR")}</td>
                  <td className="cellule-actions">
                    <Link to={`/devis/${devis.id}/imprimer`} className="bouton-lien">
                      PDF
                    </Link>
                    <button className="bouton-lien" onClick={() => ouvrirEdition(devis)}>
                      Modifier
                    </button>
                    <button className="bouton-lien bouton-danger" onClick={() => gererSuppression(devis)}>
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
