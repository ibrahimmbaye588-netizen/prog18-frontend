// URL de l'API backend. Définie via la variable d'environnement Vite
// VITE_API_URL (à configurer sur Vercel). Valeur de secours pour le
// développement local.
const API_URL = import.meta.env.VITE_API_URL || "https://prog18-backend.onrender.com";

const CLE_TOKEN = "prog18_token";

export function obtenirToken() {
  return localStorage.getItem(CLE_TOKEN);
}

export function enregistrerToken(token) {
  localStorage.setItem(CLE_TOKEN, token);
}

export function supprimerToken() {
  localStorage.removeItem(CLE_TOKEN);
}

/**
 * Appelle l'API backend. Gère automatiquement :
 * - l'ajout du token JWT si présent
 * - le cas où le service Render dort encore (timeout long au 1er appel)
 * - la conversion des erreurs HTTP en exceptions lisibles
 */
async function appelApi(chemin, options = {}) {
  const token = obtenirToken();
  const entetes = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    entetes["Authorization"] = `Bearer ${token}`;
  }

  let reponse;
  try {
    reponse = await fetch(`${API_URL}${chemin}`, {
      ...options,
      headers: entetes,
    });
  } catch (erreurReseau) {
    throw new Error(
      "Impossible de contacter le serveur. S'il n'a pas été utilisé récemment, " +
        "il peut mettre jusqu'à une minute à se réveiller — réessaie dans quelques instants."
    );
  }

  // 204 No Content (ex: suppression) : pas de corps à parser
  if (reponse.status === 204) {
    return null;
  }

  let corps = null;
  try {
    corps = await reponse.json();
  } catch {
    // Réponse sans corps JSON, ce n'est pas forcément une erreur.
  }

  if (!reponse.ok) {
    const message = corps?.detail || `Erreur ${reponse.status}`;
    throw new Error(typeof message === "string" ? message : "Une erreur est survenue");
  }

  return corps;
}

// --- Auth -------------------------------------------------------------

export function inscription({ email, mot_de_passe, nom_entreprise }) {
  return appelApi("/auth/inscription", {
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe, nom_entreprise }),
  });
}

export function connexion({ email, mot_de_passe }) {
  return appelApi("/auth/connexion", {
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
}

export function obtenirUtilisateurCourant() {
  return appelApi("/auth/moi");
}

// --- Articles -----------------------------------------------------------

export function listerArticles() {
  return appelApi("/articles");
}

export function creerArticle(donnees) {
  return appelApi("/articles", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}

export function modifierArticle(id, donnees) {
  return appelApi(`/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(donnees),
  });
}

export function supprimerArticle(id) {
  return appelApi(`/articles/${id}`, {
    method: "DELETE",
  });
}

// --- Devis ----------------------------------------------------------------

export function listerDevis() {
  return appelApi("/devis");
}

export function creerDevis(donnees) {
  return appelApi("/devis", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}

export function modifierDevis(id, donnees) {
  return appelApi(`/devis/${id}`, {
    method: "PUT",
    body: JSON.stringify(donnees),
  });
}

export function supprimerDevis(id) {
  return appelApi(`/devis/${id}`, {
    method: "DELETE",
  });
}

// --- Stock ------------------------------------------------------------

export function listerMouvementsStock() {
  return appelApi("/stock/mouvements");
}

export function creerMouvementStock(donnees) {
  return appelApi("/stock/mouvements", {
    method: "POST",
    body: JSON.stringify(donnees),
  });
}
