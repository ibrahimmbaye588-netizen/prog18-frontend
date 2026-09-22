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

  return (
    <div className="page-impression">
      <style>{`
        .page-impression {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          font-family: -apple-system, "Segoe UI", Arial, sans-serif;
          color: #1a1a1a;
        }
        .facture-barre-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .facture-en-tete {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .facture-en-tete h1 {
          font-size: 28px;
          margin: 0 0 4px;
          letter-spacing: 1px;
        }
        .facture-numero {
          font-size: 14px;
          color: #555;
        }
        .facture-entreprise {
          text-align: right;
          font-weight: 600;
          font-size: 16px;
        }
        .facture-infos {
          display: flex;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 24px;
        }
        .facture-bloc h4 {
          margin: 0 0 6px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
        }
        .facture-bloc p {
          margin: 0;
          line-height: 1.5;
        }
        table.facture-lignes {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        table.facture-lignes th {
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
          border-bottom: 2px solid #1a1a1a;
          padding: 8px 6px;
        }
        table.facture-lignes td {
          padding: 10px 6px;
          border-bottom: 1px solid #e5e5e5;
        }
        table.facture-lignes th:last-child,
        table.facture-lignes td:last-child,
        table.facture-lignes th:nth-child(2),
        table.facture-lignes td:nth-child(2),
        table.facture-lignes th:nth-child(3),
        table.facture-lignes td:nth-child(3) {
          text-align: right;
        }
        .facture-totaux {
          margin-left: auto;
          width: 280px;
          margin-bottom: 24px;
        }
        .facture-totaux div {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
        }
        .facture-totaux .ligne-net {
          border-top: 2px solid #1a1a1a;
          font-weight: 700;
          font-size: 18px;
          margin-top: 6px;
          padding-top: 10px;
        }
        .facture-totaux .ligne-du {
          font-weight: 700;
          color: #b3261e;
        }
        .facture-paiements {
          margin-bottom: 24px;
        }
        .facture-paiements h4 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #888;
          margin-bottom: 8px;
        }
        .facture-paiements ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .facture-paiements li {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 14px;
        }
        .facture-pied {
          text-align: center;
          font-size: 13px;
          color: #888;
          border-top: 1px solid #e5e5e5;
          padding-top: 16px;
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

      <div className="facture-en-tete">
        <div>
          <h1>FACTURE</h1>
          <div className="facture-numero">
            N° {facture.numero} — {new Date(facture.cree_le).toLocaleDateString("fr-FR")}
          </div>
        </div>
        {entreprise && <div className="facture-entreprise">{entreprise}</div>}
      </div>

      <div className="facture-infos">
        <div className="facture-bloc">
          <h4>Facturé à</h4>
          <p>{nomClient}</p>
          {client?.telephone && <p>{client.telephone}</p>}
          {client?.adresse && <p>{client.adresse}</p>}
        </div>
        <div className="facture-bloc" style={{ textAlign: "right" }}>
          <h4>Statut</h4>
          <p>
            {facture.statut === "annulee"
              ? "Annulée"
              : Number(facture.montant_du) <= 0
              ? "Payée"
              : Number(facture.montant_paye) > 0
              ? "Partiellement payée"
              : "Impayée"}
          </p>
        </div>
      </div>

      <table className="facture-lignes">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Qté</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.designation}</td>
              <td>{l.quantite}</td>
              <td>{formaterMontant(l.prix_unitaire)}</td>
              <td>{formaterMontant(l.quantite * Number(l.prix_unitaire))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="facture-totaux">
        <div className="ligne-net">
          <span>Total</span>
          <span>{formaterMontant(facture.montant_total)}</span>
        </div>
        <div>
          <span>Payé</span>
          <span>{formaterMontant(facture.montant_paye)}</span>
        </div>
        <div className="ligne-du">
          <span>Solde dû</span>
          <span>{formaterMontant(facture.montant_du)}</span>
        </div>
      </div>

      {facture.paiements.length > 0 && (
        <div className="facture-paiements">
          <h4>Paiements reçus</h4>
          <ul>
            {facture.paiements.map((p) => (
              <li key={p.id}>
                <span>
                  {new Date(p.cree_le).toLocaleDateString("fr-FR")} —{" "}
                  {LIBELLES_MOYEN_PAIEMENT[p.moyen_paiement] || p.moyen_paiement}
                </span>
                <span>{formaterMontant(p.montant)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {facture.notes && (
        <div className="facture-bloc" style={{ marginBottom: 24 }}>
          <h4>Notes</h4>
          <p>{facture.notes}</p>
        </div>
      )}

      <div className="facture-pied">Merci de votre confiance.</div>
    </div>
  );
}
