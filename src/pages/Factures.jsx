import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listerFactures,
  listerClients,
  listerDevis,
  listerVentes,
  listerArticles,
  creerFacture,
  supprimerFacture,
  enregistrerPaiementFacture,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

// Doit correspondre à MOYENS_PAIEMENT dans le backend (schemas.py)
const MOYENS_PAIEMENT = [
  { valeur: "especes", libelle: "Espèces" },
  { valeur: "mobile_money", libelle: "Mobile money" },
  { valeur: "carte", libelle: "Carte" },
  { valeur: "virement", libelle: "Virement" },
  { valeur: "cheque", libelle: "Chèque" },
];

const TAUX_TVA_DEFAUT = 18;

const SOURCE_LIBRE = "libre";
const SOURCE_DEVIS = "devis";
const SOURCE_VENTE = "vente";

export default function Factures() {
  const [factures, setFactures] = useState(null);
  const [clients, setClients] = useState([]);
  const [devis, setDevis] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [source, setSource] = useState(SOURCE_LIBRE);
  const [devisId, setDevisId] = useState("");
  const [venteId, setVenteId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientNomLibre, setClientNomLibre] = useState("");
  const [bonCommande, setBonCommande] = useState("");
  const [lignesLibres, setLignesLibres] = useState([]);
  const [rechercheArticle, setRechercheArticle] = useState("");
  const [notes, setNotes] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const [factureIdPourPaiement, setFactureIdPourPaiement] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState("");
  const [moyenPaiement, setMoyenPaiement] = useState("especes");

  const navigate = useNavigate();

  function chargerDonnees() {
    listerFactures().then(setFactures).catch((err) => setErreur(err.message));
    listerClients().then(setClients).catch(() => {});
    listerDevis().then(setDevis).catch(() => {});
    listerVentes().then(setVentes).catch(() => {});
    listerArticles().then(setArticles).catch(() => {});
  }

  useEffect(() => {
    obtenirUtilisateurCourant().catch(() => {
      supprimerToken();
      navigate("/");
    });
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const devisEligibles = devis.filter((d) => d.statut === "accepte");
  const articlesFiltres = articles.filter((a) =>
    a.nom.toLowerCase().includes(rechercheArticle.toLowerCase())
  );

  function ouvrirCreation() {
    setSource(SOURCE_LIBRE);
    setDevisId("");
    setVenteId("");
    setClientId("");
    setClientNomLibre("");
    setBonCommande("");
    setLignesLibres([]);
    setRechercheArticle("");
    setNotes("");
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ajouterLigneLibre(article) {
    setLignesLibres((lignes) => {
      const existante = lignes.find((l) => l.article_id === article.id);
      if (existante) {
        return lignes.map((l) =>
          l.article_id === article.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...lignes,
        {
          article_id: article.id,
          code_article: article.reference || "",
          designation: article.nom,
          prix_unitaire: Number(article.prix),
          prix_conseille: Number(article.prix),
          taux_tva: TAUX_TVA_DEFAUT,
          remise: 0,
          quantite: 1,
        },
      ];
    });
  }

  function changerQuantiteLigne(articleId, delta) {
    setLignesLibres((lignes) =>
      lignes
        .map((l) => (l.article_id === articleId ? { ...l, quantite: l.quantite + delta } : l))
        .filter((l) => l.quantite > 0)
    );
  }

  function changerChampLigne(articleId, champ, valeur) {
    setLignesLibres((lignes) =>
      lignes.map((l) => (l.article_id === articleId ? { ...l, [champ]: valeur } : l))
    );
  }

  function retirerLigneLibre(articleId) {
    setLignesLibres((lignes) => lignes.filter((l) => l.article_id !== articleId));
  }

  // Aperçu des totaux (le calcul définitif est fait par le serveur)
  const apercu = lignesLibres.reduce(
    (acc, l) => {
      const totalHt = l.quantite * Number(l.prix_unitaire);
      const remise = Number(l.remise) || 0;
      const netHt = totalHt - remise;
      const tva = (netHt * (Number(l.taux_tva) || 0)) / 100;
      acc.totalHt += totalHt;
      acc.remise += remise;
      acc.netHt += netHt;
      acc.tva += tva;
      acc.netAPayer += netHt + tva;
      return acc;
    },
    { totalHt: 0, remise: 0, netHt: 0, tva: 0, netAPayer: 0 }
  );

  async function gererCreation(e) {
    e.preventDefault();
    setErreur("");

    if (source === SOURCE_DEVIS && !devisId) {
      setErreur("Choisissez un devis accepté.");
      return;
    }
    if (source === SOURCE_VENTE && !venteId) {
      setErreur("Choisissez une vente.");
      return;
    }
    if (source === SOURCE_LIBRE && lignesLibres.length === 0) {
      setErreur("Ajoutez au moins un article, ou choisissez un devis ou une vente comme source.");
      return;
    }

    setEnvoiEnCours(true);
    try {
      await creerFacture({
        client_id: clientId ? parseInt(clientId, 10) : null,
        client_nom_libre: clientNomLibre || null,
        devis_id: source === SOURCE_DEVIS ? parseInt(devisId, 10) : null,
        vente_id: source === SOURCE_VENTE ? parseInt(venteId, 10) : null,
        statut: "emise",
        notes: notes || null,
        bon_commande: bonCommande || null,
        lignes:
          source === SOURCE_LIBRE
            ? lignesLibres.map((l) => ({
                article_id: l.article_id,
                code_article: l.code_article || null,
                designation: l.designation,
                quantite: l.quantite,
                prix_unitaire: l.prix_unitaire,
                prix_conseille: l.prix_conseille || null,
                taux_tva: l.taux_tva,
                remise: l.remise || 0,
              }))
            : [],
      });
      setFormulaireOuvert(false);
      chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(facture) {
    if (!window.confirm(`Supprimer la facture ${facture.numero} ?`)) return;
    try {
      await supprimerFacture(facture.id);
      chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    }
  }

  function ouvrirPaiement(facture) {
    setFactureIdPourPaiement(facture.id);
    setMontantPaiement("");
    setMoyenPaiement("especes");
    setErreur("");
  }

  async function gererPaiement(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");
    try {
      await enregistrerPaiementFacture(factureIdPourPaiement, {
        montant: parseFloat(montantPaiement) || 0,
        moyen_paiement: moyenPaiement,
      });
      setFactureIdPourPaiement(null);
      chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function nomClientFacture(facture) {
    if (facture.client_nom_libre) return facture.client_nom_libre;
    const client = clients.find((c) => c.id === facture.client_id);
    return client ? client.nom : "—";
  }

  function badgeStatut(facture) {
    if (facture.statut === "brouillon") {
      return <span className="badge-statut badge-statut-envoye">Brouillon</span>;
    }
    if (facture.statut === "annulee") {
      return <span className="badge-statut badge-statut-refuse">Annulée</span>;
    }
    if (Number(facture.montant_du) <= 0) {
      return <span className="badge-statut badge-statut-accepte">Payée</span>;
    }
    if (Number(facture.montant_paye) > 0) {
      return <span className="badge-statut badge-statut-envoye">Partielle</span>;
    }
    return <span className="badge-statut badge-statut-refuse">Impayée</span>;
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>🧾 Factures</h1>
        <button className="bouton-principal" onClick={ouvrirCreation}>
          + Facture
        </button>
      </div>

      {erreur && !formulaireOuvert && !factureIdPourPaiement && <div className="erreur">⚠️ {erreur}</div>}
      {succes && <div className="succes">✓ {succes}</div>}

      {formulaireOuvert && (
        <div className="carte carte-formulaire">
          <h3>Nouvelle facture</h3>
          <form onSubmit={gererCreation}>
            <label htmlFor="source">Origine</label>
            <select id="source" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value={SOURCE_LIBRE}>Facture libre (articles saisis ici)</option>
              <option value={SOURCE_DEVIS}>Depuis un devis accepté</option>
              <option value={SOURCE_VENTE}>Depuis une vente</option>
            </select>

            {source === SOURCE_DEVIS && (
              <>
                <label htmlFor="devis_id">Devis accepté</label>
                <select id="devis_id" value={devisId} onChange={(e) => setDevisId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {devisEligibles.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id} — {d.client_nom}
                    </option>
                  ))}
                </select>
                {devisEligibles.length === 0 && (
                  <p className="sous-titre">Aucun devis accepté pour l'instant.</p>
                )}
              </>
            )}

            {source === SOURCE_VENTE && (
              <>
                <label htmlFor="vente_id">Vente</label>
                <select id="vente_id" value={venteId} onChange={(e) => setVenteId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {ventes.map((v) => (
                    <option key={v.id} value={v.id}>
                      #{v.id} — {new Date(v.cree_le).toLocaleDateString("fr-FR")} —{" "}
                      {formaterMontant(
                        v.lignes.reduce((t, l) => t + l.quantite * Number(l.prix_unitaire), 0)
                      )}
                    </option>
                  ))}
                </select>
              </>
            )}

            {source === SOURCE_LIBRE && (
              <>
                <label>Articles</label>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={rechercheArticle}
                  onChange={(e) => setRechercheArticle(e.target.value)}
                />
                <div className="liste-produits-vente">
                  {articlesFiltres.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="carte-produit-vente"
                      onClick={() => ajouterLigneLibre(a)}
                    >
                      <div>
                        <p className="nom-produit-vente">{a.nom}</p>
                        <p className="prix-produit-vente">{formaterMontant(a.prix)}</p>
                      </div>
                      <span className="bouton-plus">+</span>
                    </button>
                  ))}
                </div>

                {lignesLibres.map((l) => (
                  <div
                    key={l.article_id}
                    className="carte"
                    style={{ padding: 12, marginBottom: 10, background: "#f7f7f9" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <p className="nom-produit-vente" style={{ margin: 0 }}>{l.designation}</p>
                        <p className="sous-titre" style={{ margin: 0 }}>
                          Code : {l.code_article || "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bouton-lien bouton-danger"
                        onClick={() => retirerLigneLibre(l.article_id)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="controles-quantite" style={{ marginBottom: 8 }}>
                      <button type="button" onClick={() => changerQuantiteLigne(l.article_id, -1)}>−</button>
                      <span>{l.quantite}</span>
                      <button type="button" onClick={() => changerQuantiteLigne(l.article_id, 1)}>+</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 12 }}>Prix unitaire (FCFA)</label>
                        <input
                          type="number"
                          min="0"
                          value={l.prix_unitaire}
                          onChange={(e) =>
                            changerChampLigne(l.article_id, "prix_unitaire", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>Prix conseillé (FCFA)</label>
                        <input
                          type="number"
                          min="0"
                          value={l.prix_conseille}
                          onChange={(e) =>
                            changerChampLigne(l.article_id, "prix_conseille", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>Remise sur la ligne (FCFA)</label>
                        <input
                          type="number"
                          min="0"
                          value={l.remise}
                          onChange={(e) =>
                            changerChampLigne(l.article_id, "remise", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12 }}>TVA (%)</label>
                        <input
                          type="number"
                          min="0"
                          value={l.taux_tva}
                          onChange={(e) =>
                            changerChampLigne(l.article_id, "taux_tva", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <p className="sous-total-panier" style={{ textAlign: "right", marginTop: 8 }}>
                      {formaterMontant(
                        Math.max(0, l.quantite * l.prix_unitaire - (Number(l.remise) || 0)) *
                          (1 + (Number(l.taux_tva) || 0) / 100)
                      )}
                    </p>
                  </div>
                ))}

                {lignesLibres.length > 0 && (
                  <div className="carte" style={{ padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total HT</span>
                      <span>{formaterMontant(apercu.totalHt)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Remise</span>
                      <span>{formaterMontant(apercu.remise)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total net HT</span>
                      <span>{formaterMontant(apercu.netHt)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>TVA</span>
                      <span>{formaterMontant(apercu.tva)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>Net à payer</span>
                      <span>{formaterMontant(apercu.netAPayer)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <label htmlFor="client_id">Client enregistré (optionnel)</label>
            <select id="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>

            {!clientId && (
              <>
                <label htmlFor="client_nom_libre">
                  Nom du client {source !== SOURCE_LIBRE ? "(repris automatiquement si vide)" : ""}
                </label>
                <input
                  id="client_nom_libre"
                  type="text"
                  value={clientNomLibre}
                  onChange={(e) => setClientNomLibre(e.target.value)}
                />
              </>
            )}

            <label htmlFor="bon_commande">N° bon de commande (optionnel)</label>
            <input
              id="bon_commande"
              type="text"
              value={bonCommande}
              onChange={(e) => setBonCommande(e.target.value)}
            />

            <label htmlFor="notes">Notes (optionnel)</label>
            <input id="notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />

            {erreur && <div className="erreur">⚠️ {erreur}</div>}

            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Création..." : "Créer la facture"}
              </button>
              <button type="button" className="bouton-annuler" onClick={() => setFormulaireOuvert(false)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {factureIdPourPaiement && (
        <div className="carte carte-formulaire">
          <h3>Paiement de la facture</h3>
          <form onSubmit={gererPaiement}>
            <label htmlFor="montant_paiement">Montant reçu (FCFA)</label>
            <input
              id="montant_paiement"
              type="number"
              min="1"
              step="1"
              required
              value={montantPaiement}
              onChange={(e) => setMontantPaiement(e.target.value)}
            />
            <label htmlFor="moyen_paiement_facture">Moyen de paiement</label>
            <select
              id="moyen_paiement_facture"
              value={moyenPaiement}
              onChange={(e) => setMoyenPaiement(e.target.value)}
            >
              {MOYENS_PAIEMENT.map((m) => (
                <option key={m.valeur} value={m.valeur}>
                  {m.libelle}
                </option>
              ))}
            </select>
            {erreur && <div className="erreur">⚠️ {erreur}</div>}
            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : "Enregistrer le paiement"}
              </button>
              <button type="button" className="bouton-annuler" onClick={() => setFactureIdPourPaiement(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {factures === null && <p className="sous-titre">Chargement...</p>}
      {factures && factures.length === 0 && <p className="sous-titre">Aucune facture pour l'instant.</p>}

      {factures && factures.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>N° facture</th>
                <th>Date</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Dû</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id}>
                  <td>{f.numero}</td>
                  <td>{new Date(f.cree_le).toLocaleDateString("fr-FR")}</td>
                  <td>{nomClientFacture(f)}</td>
                  <td>{badgeStatut(f)}</td>
                  <td>{formaterMontant(f.montant_total)}</td>
                  <td>{formaterMontant(f.montant_du)}</td>
                  <td className="cellule-actions">
                    <button className="bouton-lien" onClick={() => navigate(`/factures/${f.id}/impression`)}>
                      Imprimer
                    </button>
                    {Number(f.montant_du) > 0 && f.statut !== "annulee" && (
                      <button className="bouton-lien" onClick={() => ouvrirPaiement(f)}>
                        Paiement
                      </button>
                    )}
                    <button className="bouton-lien bouton-danger" onClick={() => gererSuppression(f)}>
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
