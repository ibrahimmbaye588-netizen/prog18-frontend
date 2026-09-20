import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listerArticles,
  listerClients,
  listerVentes,
  creerVente,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

export default function Ventes() {
  const [articles, setArticles] = useState(null);
  const [clients, setClients] = useState([]);
  const [ventesRecentes, setVentesRecentes] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [panier, setPanier] = useState([]); // { article_id, designation, prix_unitaire, quantite, stock_disponible }
  const [clientId, setClientId] = useState("");
  const [modePaiement, setModePaiement] = useState("comptant");
  const [montantPaye, setMontantPaye] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const navigate = useNavigate();

  function chargerDonnees() {
    listerArticles().then(setArticles).catch((err) => setErreur(err.message));
    listerClients().then(setClients).catch(() => {});
    listerVentes().then(setVentesRecentes).catch(() => {});
  }

  useEffect(() => {
    obtenirUtilisateurCourant().catch(() => {
      supprimerToken();
      navigate("/");
    });
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const articlesFiltres = (articles || []).filter((a) =>
    a.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  function ajouterAuPanier(article) {
    setPanier((p) => {
      const existante = p.find((l) => l.article_id === article.id);
      if (existante) {
        return p.map((l) =>
          l.article_id === article.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...p,
        {
          article_id: article.id,
          designation: article.nom,
          prix_unitaire: Number(article.prix),
          quantite: 1,
          stock_disponible: article.quantite_stock,
        },
      ];
    });
  }

  function changerQuantite(articleId, delta) {
    setPanier((p) =>
      p
        .map((l) =>
          l.article_id === articleId ? { ...l, quantite: l.quantite + delta } : l
        )
        .filter((l) => l.quantite > 0)
    );
  }

  function retirerDuPanier(articleId) {
    setPanier((p) => p.filter((l) => l.article_id !== articleId));
  }

  const total = panier.reduce((t, l) => t + l.quantite * l.prix_unitaire, 0);

  function viderFormulaire() {
    setPanier([]);
    setClientId("");
    setModePaiement("comptant");
    setMontantPaye("");
  }

  async function validerVente() {
    if (panier.length === 0) return;
    setEnvoiEnCours(true);
    setErreur("");
    setSucces("");

    const donnees = {
      client_id: clientId ? parseInt(clientId, 10) : null,
      mode_paiement: modePaiement,
      montant_paye: modePaiement === "credit" ? parseFloat(montantPaye) || 0 : 0,
      lignes: panier.map((l) => ({
        article_id: l.article_id,
        designation: l.designation,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
      })),
    };

    try {
      await creerVente(donnees);
      setSucces(`Vente enregistrée — ${formaterMontant(total)}`);
      viderFormulaire();
      chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>🛒 Nouvelle vente</h1>
      </div>

      {erreur && <div className="erreur">⚠️ {erreur}</div>}
      {succes && <div className="succes">✓ {succes}</div>}

      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ marginTop: 0, marginBottom: 16 }}
      />

      {articles === null && <p className="sous-titre">Chargement des produits...</p>}

      {articles && (
        <div className="liste-produits-vente">
          {articlesFiltres.map((a) => (
            <button
              key={a.id}
              type="button"
              className="carte-produit-vente"
              onClick={() => ajouterAuPanier(a)}
              disabled={a.quantite_stock <= 0}
            >
              {a.photo_url && <img src={a.photo_url} alt={a.nom} className="photo-produit-vente" />}
              <div>
                <p className="nom-produit-vente">{a.nom}</p>
                <p className="prix-produit-vente">{formaterMontant(a.prix)}</p>
                <p className="stock-produit-vente">Stock : {a.quantite_stock}</p>
              </div>
              <span className="bouton-plus">+</span>
            </button>
          ))}
          {articlesFiltres.length === 0 && (
            <p className="sous-titre">Aucun produit trouvé.</p>
          )}
        </div>
      )}

      {panier.length > 0 && (
        <div className="carte panier-vente" style={{ maxWidth: "100%" }}>
          <h3>Panier</h3>
          {panier.map((l) => (
            <div key={l.article_id} className="ligne-panier">
              <div>
                <p className="nom-produit-vente" style={{ margin: 0 }}>{l.designation}</p>
                <p className="sous-titre" style={{ margin: 0 }}>{formaterMontant(l.prix_unitaire)} l'unité</p>
              </div>
              <div className="controles-quantite">
                <button type="button" onClick={() => changerQuantite(l.article_id, -1)}>−</button>
                <span>{l.quantite}</span>
                <button type="button" onClick={() => changerQuantite(l.article_id, 1)}>+</button>
              </div>
              <p className="sous-total-panier">{formaterMontant(l.quantite * l.prix_unitaire)}</p>
              <button type="button" className="bouton-lien bouton-danger" onClick={() => retirerDuPanier(l.article_id)}>
                ×
              </button>
            </div>
          ))}

          <label htmlFor="client_id">Client (optionnel)</label>
          <select id="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Client de passage —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <label htmlFor="mode_paiement">Mode de paiement</label>
          <select
            id="mode_paiement"
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
          >
            <option value="comptant">Comptant (payé intégralement)</option>
            <option value="credit">À crédit</option>
          </select>

          {modePaiement === "credit" && (
            <>
              <label htmlFor="montant_paye">Montant versé maintenant (FCFA)</label>
              <input
                id="montant_paye"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={montantPaye}
                onChange={(e) => setMontantPaye(e.target.value)}
              />
            </>
          )}

          <div className="total-panier">
            Total ({panier.length} article{panier.length > 1 ? "s" : ""}) : <strong>{formaterMontant(total)}</strong>
          </div>

          <button onClick={validerVente} disabled={envoiEnCours}>
            {envoiEnCours ? "Enregistrement..." : "✓ Valider la vente"}
          </button>
        </div>
      )}

      {ventesRecentes && ventesRecentes.length > 0 && (
        <>
          <h3 className="titre-section">Ventes récentes</h3>
          <div className="carte" style={{ maxWidth: "100%" }}>
            <table className="tableau-articles">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Articles</th>
                  <th>Paiement</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventesRecentes.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.cree_le).toLocaleString("fr-FR")}</td>
                    <td>{v.lignes.length} article{v.lignes.length > 1 ? "s" : ""}</td>
                    <td>
                      <span
                        className={`badge-statut ${
                          v.mode_paiement === "comptant" ? "badge-statut-accepte" : "badge-statut-envoye"
                        }`}
                      >
                        {v.mode_paiement === "comptant" ? "Comptant" : "Crédit"}
                      </span>
                    </td>
                    <td>
                      {formaterMontant(
                        v.lignes.reduce((t, l) => t + l.quantite * Number(l.prix_unitaire), 0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BarreNavigation />
    </div>
  );
}
