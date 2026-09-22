import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  obtenirFacture,
  listerClients,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";

const LIBELLES_MOYEN_PAIEMENT = {
  especes: "Espèces",
  mobile_money: "Mobile money",
  carte: "Carte",
  virement: "Virement",
  cheque: "Chèque",
};

// --- Conversion d'un nombre en lettres (français) --------------------------

const UNITES = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

function convertirMoinsDeMille(n) {
  if (n === 0) return "";
  if (n < 20) return UNITES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 7 || d === 9) {
      const base = d === 7 ? "soixante" : "quatre-vingt";
      const reste = 10 + u;
      const liaison = u === 1 && d === 7 ? "-et-" : "-";
      return base + liaison + UNITES[reste];
    }
    let mot = DIZAINES[d];
    if (u === 0) {
      if (d === 8) mot += "s";
      return mot;
    }
    if (u === 1 && d !== 8) return mot + "-et-un";
    return mot + "-" + UNITES[u];
  }
  const c = Math.floor(n / 100);
  const r = n % 100;
  let mot = c === 1 ? "cent" : UNITES[c] + " cent";
  if (r === 0) {
    if (c > 1) mot += "s";
    return mot;
  }
  return mot + " " + convertirMoinsDeMille(r);
}

function nombreEnLettres(valeur) {
  const n = Math.round(Number(valeur) || 0);
  if (n === 0) return "zéro";
  const milliards = Math.floor(n / 1e9);
  const millions = Math.floor((n % 1e9) / 1e6);
  const milliers = Math.floor((n % 1e6) / 1e3);
  const reste = n % 1000;

  const parties = [];
  if (milliards) parties.push(milliards === 1 ? "un milliard" : convertirMoinsDeMille(milliards) + " milliards");
  if (millions) parties.push(millions === 1 ? "un million" : convertirMoinsDeMille(millions) + " millions");
  if (milliers) parties.push(milliers === 1 ? "mille" : convertirMoinsDeMille(milliers) + " mille");
  if (reste) parties.push(convertirMoinsDeMille(reste));

  return parties.join(" ");
}

function majusculePremiereLetre(texte) {
  if (!texte) return texte;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export default function ImpressionFacture() {
  const { factureId } = useParams();
  const [facture, setFacture] = useState(null);
  const [client, setClient] = useState(null);
  const [entreprise, setEntreprise] = useState("");
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    obtenirUtilisateurCourant()
      .then((u) => setEntreprise(u.nom_entreprise || ""))
      .catch(() => {
        supprimerToken();
        navigate("/");
      });

    obtenirFacture(factureId)
      .then((f) => {
        setFacture(f);
        if (f.client_id) {
          listerClients()
            .then((clients) => setClient(clients.find((c) => c.id === f.client_id) || null))
            .catch(() => {});
        }
      })
      .catch((err) => setErreur(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factureId]);

  if (erreur) {
    return (
      <div className="tableau-de-bord">
        <div className="erreur">⚠️ {erreur}</div>
        <Link to="/factures" className="bouton-lien">← Retour aux factures</Link>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="tableau-de-bord">
        <p className="sous-titre">Chargement...</p>
      </div>
    );
  }

  const nomClient = facture.client_nom_libre || (client ? client.nom : "Client de passage");
  const codeClient = facture.client_id ? `C${String(facture.client_id).padStart(4, "0")}` : "";
  const dateFacture = new Date(facture.cree_le).toLocaleDateString("fr-FR");
  const dernierPaiement = facture.paiements.length > 0 ? facture.paiements[facture.paiements.length - 1] : null;
  const soldeLabel = Number(facture.montant_du) <= 0 ? "0" : formaterMontant(facture.montant_du);

  return (
    <div className="page-impression">
      <style>{`
        .page-impression {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px;
          font-family: Georgia, "Times New Roman", serif;
          color: #1a1a1a;
          font-size: 13px;
        }
        .facture-barre-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-family: -apple-system, "Segoe UI", Arial, sans-serif;
        }
        .facture-titre {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 16px;
        }
        .facture-entete-grille {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .facture-client-bloc p {
          margin: 0;
          line-height: 1.5;
        }
        .facture-client-code {
          font-weight: 700;
        }
        table.facture-recap {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4px;
          border: 1px solid #1a1a1a;
        }
        table.facture-recap th, table.facture-recap td {
          border: 1px solid #1a1a1a;
          padding: 4px 8px;
          text-align: left;
          font-size: 12px;
        }
        table.facture-recap th {
          background: #e9e9ec;
        }
        table.facture-lignes {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          border: 1px solid #1a1a1a;
        }
        table.facture-lignes th, table.facture-lignes td {
          border: 1px solid #1a1a1a;
          padding: 6px 8px;
          font-size: 12px;
        }
        table.facture-lignes th {
          background: #e9e9ec;
          text-align: left;
        }
        table.facture-lignes td.chiffre, table.facture-lignes th.chiffre {
          text-align: right;
        }
        .facture-bas {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .facture-message {
          font-size: 12px;
          max-width: 320px;
        }
        .facture-totaux {
          width: 260px;
          border: 1px solid #1a1a1a;
        }
        .facture-totaux div {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          border-bottom: 1px solid #ccc;
          font-size: 12px;
        }
        .facture-totaux .ligne-net {
          border-top: 2px solid #1a1a1a;
          border-bottom: none;
          font-weight: 700;
          font-size: 14px;
        }
        .facture-reglement {
          margin-top: 12px;
          font-size: 12px;
        }
        .facture-lettres {
          margin-top: 16px;
          font-size: 12px;
          font-style: italic;
        }
        .facture-pied {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          margin-top: 24px;
          border-top: 1px solid #1a1a1a;
          padding-top: 10px;
        }
        @media print {
          .facture-barre-actions { display: none; }
          .page-impression { padding: 0; max-width: 100%; }
        }
      `}</style>

      <div className="facture-barre-actions">
        <Link to="/factures" className="bouton-lien">← Retour aux factures</Link>
        <button onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>

      <div className="facture-entete-grille">
        <div>
          <p className="facture-titre">Facture</p>
        </div>
        <div className="facture-client-bloc" style={{ textAlign: "right" }}>
          {entreprise && <p style={{ fontWeight: 700 }}>{entreprise}</p>}
          {codeClient && <p className="facture-client-code">CODE {codeClient}</p>}
          <p style={{ fontWeight: 700 }}>{nomClient}</p>
          {client?.telephone && <p>TEL {client.telephone}</p>}
          {client?.adresse && <p>{client.adresse}</p>}
        </div>
      </div>

      <table className="facture-recap">
        <thead>
          <tr>
            <th>N° facture</th>
            <th>Date</th>
            <th>V/Bon cmde</th>
            <th>Monnaie</th>
            <th>Total</th>
            <th>Réglé</th>
            <th>Solde</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{facture.numero}</td>
            <td>{dateFacture}</td>
            <td>{facture.bon_commande || "—"}</td>
            <td>Francs CFA</td>
            <td>{formaterMontant(facture.montant_total)}</td>
            <td>{formaterMontant(facture.montant_paye)}</td>
            <td>{soldeLabel}</td>
          </tr>
        </tbody>
      </table>

      <table className="facture-lignes">
        <thead>
          <tr>
            <th>Code</th>
            <th>Désignation</th>
            <th className="chiffre">Prix conseillé</th>
            <th className="chiffre">Qté</th>
            <th className="chiffre">P. unit. HT</th>
            <th className="chiffre">Total HT</th>
            <th className="chiffre">TVA</th>
            <th className="chiffre">Rem.</th>
            <th className="chiffre">Total</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.code_article || "—"}</td>
              <td>{l.designation}</td>
              <td className="chiffre">{l.prix_conseille != null ? formaterMontant(l.prix_conseille) : "—"}</td>
              <td className="chiffre">{l.quantite}</td>
              <td className="chiffre">{formaterMontant(l.prix_unitaire)}</td>
              <td className="chiffre">{formaterMontant(l.total_ht)}</td>
              <td className="chiffre">{Number(l.taux_tva).toFixed(2)} %</td>
              <td className="chiffre">{formaterMontant(l.remise)}</td>
              <td className="chiffre">{formaterMontant(l.total_ttc)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="facture-bas">
        <div className="facture-message">
          <p>Merci de votre visite - à bientôt</p>

          {facture.paiements.length > 0 && (
            <div className="facture-reglement">
              {facture.paiements.map((p) => (
                <p key={p.id}>
                  {LIBELLES_MOYEN_PAIEMENT[p.moyen_paiement] || p.moyen_paiement} le{" "}
                  {new Date(p.cree_le).toLocaleDateString("fr-FR")} - montant : {formaterMontant(p.montant)}
                </p>
              ))}
            </div>
          )}

          {facture.notes && <p style={{ marginTop: 12 }}>{facture.notes}</p>}
        </div>

        <div className="facture-totaux">
          <div>
            <span>Total HT</span>
            <span>{formaterMontant(facture.total_ht)}</span>
          </div>
          <div>
            <span>Remise</span>
            <span>{formaterMontant(facture.remise_totale)}</span>
          </div>
          <div>
            <span>Total net HT</span>
            <span>{formaterMontant(facture.total_net_ht)}</span>
          </div>
          <div>
            <span>TVA</span>
            <span>{formaterMontant(facture.montant_tva)}</span>
          </div>
          <div className="ligne-net">
            <span>Net à payer</span>
            <span>{formaterMontant(facture.montant_total)}</span>
          </div>
        </div>
      </div>

      <p className="facture-lettres">
        Arrêtée à la somme de : {majusculePremiereLetre(nombreEnLettres(facture.montant_total))} francs CFA
      </p>

      <div className="facture-pied">
        {entreprise || "Merci de votre confiance"}
      </div>
    </div>
  );
}
