# Prog 1.8 — Frontend

Interface React (Vite) pour la gestion catalogue/devis/stock.

## Lancer en local

```bash
npm install
cp .env.example .env   # vérifie que VITE_API_URL pointe vers ton backend
npm run dev
```

Ouvre ensuite http://localhost:5173

## Déployer sur Vercel

1. Push ce code sur GitHub (repo `prog18-frontend`)
2. Sur Vercel : **Add New > Project**, importe le repo
3. Vercel détecte automatiquement Vite — laisse les réglages par défaut :
   - **Build Command** : `npm run build` (auto-détecté)
   - **Output Directory** : `dist` (auto-détecté)
4. Dans **Environment Variables**, ajoute :
   - `VITE_API_URL` → `https://prog18-backend.onrender.com`
5. Déploie

## Après le premier déploiement

Une fois l'URL Vercel connue (ex: `https://prog18-frontend.vercel.app`), retourne sur
**Render** dans les variables d'environnement du backend et vérifie que `FRONTEND_URL`
correspond bien à cette URL exacte (sinon le CORS bloquera les requêtes).

## Notes

- Le backend Render (plan Free) peut mettre jusqu'à 50-60 secondes à répondre après
  une période d'inactivité. Le message d'erreur affiché sur la page de connexion
  en tient compte.
- Le token de connexion est stocké dans le `localStorage` du navigateur.
