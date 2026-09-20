import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenirDevis, obtenirUtilisateurCourant, formaterMontant } from "../api.js";

const LIBELLES_STATUT = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

export default function ImpressionDevis() {
  const { id } = useParams();
  const [devis, setDevis] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    obtenirUtilisateurCourant().then(setUtilisateur).catch(() => {});
    obtenirDevis(id).then(setDevis).catch((err) => setErreur(err.message));
  }, [id]);

  if (erreur) return <div className="page-centree">{erreur}</div>;
  if (!devis) return <div className="page-centree">Chargement...</div>;

  const total = devis.lignes.reduce((t, l) => t + l.quantite * Number(l.prix_unitaire), 0);

  return (
    <div className="page-impression">
      <div className="barre-actions-impression">
        <Link to="/devis" className="lien-secondaire" style={{ marginTop: 0 }}>
          ← Retour aux devis
        </Link>
        <button className="bouton-principal" onClick={() => window.print()}>
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="feuille-devis">
        <div className="entete-devis-impression">
          <div>
            <h1>🔧 {utilisateur?.nom_entreprise || "PROG 1.8"}</h1>
            <p className="sous-titre" style={{ margin: 0 }}>{utilisateur?.email}</p>
          </div>
          <div className="infos-devis-impression">
            <p><strong>Devis</strong> #{devis.id}</p>
            <p>Date : {new Date(devis.cree_le).toLocaleDateString("fr-FR")}</p>
            <p>Statut : {LIBELLES_STATUT[devis.statut] || devis.statut}</p>
          </div>
        </div>

        <p><strong>Client :</strong> {devis.client_nom}</p>

        <table className="tableau-impression">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Qté</th>
              <th>Prix unit.</th>
              <th>Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l) => (
              <tr key={l.id}>
                <td>{l.designation}</td>
                <td>{l.quantite}</td>
                <td>{formaterMontant(l.prix_unitaire)}</td>
                <td>{formaterMontant(l.quantite * Number(l.prix_unitaire))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-impression">
          Total : <strong>{formaterMontant(total)}</strong>
        </div>

        {devis.notes && (
          <div className="notes-impression">
            <strong>Notes :</strong> {devis.notes}
          </div>
        )}
      </div>
    </div>
  );
}
