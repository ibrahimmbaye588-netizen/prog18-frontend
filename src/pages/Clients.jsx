import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listerClients,
  creerClient,
  modifierClient,
  supprimerClient,
  enregistrerPaiement,
  obtenirUtilisateurCourant,
  supprimerToken,
  formaterMontant,
} from "../api.js";
import BarreNavigation from "../components/BarreNavigation.jsx";

const CLIENT_VIDE = { nom: "", telephone: "", adresse: "", notes: "" };

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [clientEnEdition, setClientEnEdition] = useState(null);
  const [valeurs, setValeurs] = useState(CLIENT_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [clientPourPaiement, setClientPourPaiement] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState("");
  const navigate = useNavigate();

  function chargerClients() {
    listerClients()
      .then(setClients)
      .catch((err) => setErreur(err.message));
  }

  useEffect(() => {
    obtenirUtilisateurCourant().catch(() => {
      supprimerToken();
      navigate("/");
    });
    chargerClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientsFiltres = (clients || []).filter(
    (c) =>
      c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.telephone || "").includes(recherche)
  );

  function ouvrirCreation() {
    setClientEnEdition(null);
    setValeurs(CLIENT_VIDE);
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(client) {
    setClientEnEdition(client);
    setValeurs({
      nom: client.nom,
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      notes: client.notes || "",
    });
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setClientEnEdition(null);
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur("");
    try {
      if (clientEnEdition) {
        await modifierClient(clientEnEdition.id, valeurs);
      } else {
        await creerClient(valeurs);
      }
      fermerFormulaire();
      chargerClients();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(client) {
    if (!window.confirm(`Supprimer "${client.nom}" ?`)) return;
    try {
      await supprimerClient(client.id);
      chargerClients();
    } catch (err) {
      setErreur(err.message);
    }
  }

  function ouvrirPaiement(client) {
    setClientPourPaiement(client);
    setMontantPaiement("");
    setErreur("");
  }

  async function gererPaiement(e) {
    e.preventDefault();
    if (!clientPourPaiement) return;
    setEnvoiEnCours(true);
    setErreur("");
    try {
      await enregistrerPaiement(clientPourPaiement.id, {
        montant: parseFloat(montantPaiement) || 0,
      });
      setClientPourPaiement(null);
      chargerClients();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>👥 Clients</h1>
        <button className="bouton-principal" onClick={ouvrirCreation}>
          + Client
        </button>
      </div>

      {erreur && !formulaireOuvert && !clientPourPaiement && <div className="erreur">⚠️ {erreur}</div>}

      <input
        type="text"
        placeholder="Rechercher un client..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ marginTop: 0, marginBottom: 16 }}
      />

      {formulaireOuvert && (
        <div className="carte carte-formulaire">
          <h3>{clientEnEdition ? "Modifier le client" : "Nouveau client"}</h3>
          <form onSubmit={gererSoumission}>
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              type="text"
              required
              value={valeurs.nom}
              onChange={(e) => setValeurs({ ...valeurs, nom: e.target.value })}
            />
            <label htmlFor="telephone">Téléphone</label>
            <input
              id="telephone"
              type="text"
              value={valeurs.telephone}
              onChange={(e) => setValeurs({ ...valeurs, telephone: e.target.value })}
            />
            <label htmlFor="adresse">Adresse</label>
            <input
              id="adresse"
              type="text"
              value={valeurs.adresse}
              onChange={(e) => setValeurs({ ...valeurs, adresse: e.target.value })}
            />
            <label htmlFor="notes">Notes</label>
            <input
              id="notes"
              type="text"
              value={valeurs.notes}
              onChange={(e) => setValeurs({ ...valeurs, notes: e.target.value })}
            />

            {erreur && <div className="erreur">⚠️ {erreur}</div>}

            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : clientEnEdition ? "Enregistrer" : "Ajouter"}
              </button>
              <button type="button" className="bouton-annuler" onClick={fermerFormulaire}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {clientPourPaiement && (
        <div className="carte carte-formulaire">
          <h3>Paiement — {clientPourPaiement.nom}</h3>
          <p className="sous-titre" style={{ margin: 0 }}>
            Solde dû actuel : {formaterMontant(clientPourPaiement.solde_du)}
          </p>
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
            {erreur && <div className="erreur">⚠️ {erreur}</div>}
            <div className="boutons-formulaire">
              <button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? "Enregistrement..." : "Enregistrer le paiement"}
              </button>
              <button type="button" className="bouton-annuler" onClick={() => setClientPourPaiement(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {clients === null && !erreur && <p className="sous-titre">Chargement...</p>}
      {clients && clientsFiltres.length === 0 && (
        <p className="sous-titre">Aucun client pour l'instant.</p>
      )}

      {clients && clientsFiltres.length > 0 && (
        <div className="liste-clients">
          {clientsFiltres.map((c) => (
            <div key={c.id} className="carte-client">
              <div className="avatar-client">{c.nom.charAt(0).toUpperCase()}</div>
              <div className="infos-client">
                <p className="nom-client">{c.nom}</p>
                {c.telephone && <p className="sous-titre" style={{ margin: 0 }}>{c.telephone}</p>}
              </div>
              <div className="solde-client">
                {Number(c.solde_du) > 0 ? (
                  <span className="badge-statut badge-statut-refuse">
                    Doit {formaterMontant(c.solde_du)}
                  </span>
                ) : (
                  <span className="badge-statut badge-statut-accepte">À jour</span>
                )}
              </div>
              <div className="cellule-actions">
                {Number(c.solde_du) > 0 && (
                  <button className="bouton-lien" onClick={() => ouvrirPaiement(c)}>
                    Paiement
                  </button>
                )}
                <button className="bouton-lien" onClick={() => ouvrirEdition(c)}>
                  Modifier
                </button>
                <button className="bouton-lien bouton-danger" onClick={() => gererSuppression(c)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BarreNavigation />
    </div>
  );
}
