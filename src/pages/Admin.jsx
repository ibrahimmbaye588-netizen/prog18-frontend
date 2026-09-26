import { useState } from "react";

// Même URL de backend que dans api.js (VITE_API_URL, avec la même valeur de secours).
const URL_API = import.meta.env.VITE_API_URL || "https://prog18-backend.onrender.com";

export default function Admin() {
  const [motDePasse, setMotDePasse] = useState("");
  const [entreprises, setEntreprises] = useState(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [connecte, setConnecte] = useState(false);

  async function gererConnexion(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const reponse = await fetch(`${URL_API}/admin/entreprises`, {
        headers: { "X-Admin-Password": motDePasse },
      });
      if (!reponse.ok) {
        const detail = await reponse.json().catch(() => ({}));
        throw new Error(detail.detail || "Mot de passe incorrect");
      }
      const donnees = await reponse.json();
      setEntreprises(donnees);
      setConnecte(true);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  function formaterDate(valeur) {
    if (!valeur) return "Jamais connecté";
    return new Date(valeur).toLocaleString("fr-FR");
  }

  if (!connecte) {
    return (
      <div className="tableau-de-bord" style={{ maxWidth: 400, margin: "60px auto" }}>
        <h1>🔒 Accès admin</h1>
        <form onSubmit={gererConnexion} className="carte carte-formulaire">
          <label htmlFor="mot_de_passe_admin">Mot de passe admin</label>
          <input
            id="mot_de_passe_admin"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoFocus
          />
          {erreur && <div className="erreur">⚠️ {erreur}</div>}
          <button type="submit" disabled={chargement}>
            {chargement ? "Vérification..." : "Entrer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="tableau-de-bord">
      <div className="entete-tableau">
        <h1>🏢 Entreprises inscrites sur prog18</h1>
      </div>

      {entreprises && entreprises.length === 0 && (
        <p className="sous-titre">Aucune entreprise inscrite pour l'instant.</p>
      )}

      {entreprises && entreprises.length > 0 && (
        <div className="carte" style={{ maxWidth: "100%" }}>
          <table className="tableau-articles">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Email</th>
                <th>Inscrite le</th>
                <th>Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map((ent) => (
                <tr key={ent.id}>
                  <td>{ent.nom_entreprise || "—"}</td>
                  <td>{ent.email}</td>
                  <td>{new Date(ent.cree_le).toLocaleDateString("fr-FR")}</td>
                  <td>{formaterDate(ent.derniere_connexion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
