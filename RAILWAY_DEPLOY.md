# Deploy on Railway

Ce projet est un **monorepo** (FastAPI backend + React frontend). Railway ne peut pas auto-détecter, il faut créer **2 services** (+ 1 base MongoDB).

## 1. MongoDB
- Dans ton projet Railway : **+ New → Database → Add MongoDB**
- Railway créera la variable `MONGO_URL` automatiquement (ou `MONGOHOST`/`MONGOUSER` etc.)
- Copie l'URL de connexion publique de MongoDB.

## 2. Service Backend
- **+ New → GitHub Repo → ton repo Certicode**
- Ouvre le service → **Settings**
  - **Root Directory** : `backend`
  - **Builder** : Dockerfile (auto-détecté grâce à `backend/railway.json`)
- **Variables d'environnement** :
  ```
  MONGO_URL=<URL MongoDB Railway (private networking préférée)>
  DB_NAME=certicode
  CORS_ORIGINS=*
  TELEGRAM_BOT_TOKEN=<ton token>
  TELEGRAM_CHAT_ID=<ton chat id>
  ADMIN_READ_TOKEN=<un token aléatoire>
  ```
- **Networking → Generate Domain** → tu obtiens une URL ex : `https://certicode-backend.up.railway.app`

## 3. Service Frontend
- **+ New → GitHub Repo → même repo**
- Ouvre le service → **Settings**
  - **Root Directory** : `frontend`
  - **Builder** : Dockerfile
- **Variables d'environnement** :
  ```
  REACT_APP_BACKEND_URL=https://certicode-backend.up.railway.app
  ```
  ⚠️ Cette variable doit être définie **AVANT le premier build**, car React l'embarque au moment du build.
- **Networking → Generate Domain**

## 4. Si tu redéploies après avoir changé `REACT_APP_BACKEND_URL`
Il faut **redéployer** le service frontend (Settings → Redeploy) pour que la nouvelle URL soit prise en compte (re-build nécessaire).

## 5. Vérification
- Backend : `https://<backend>.up.railway.app/api/health` doit répondre 200.
- Frontend : ouvre le domaine, l'app doit charger et taper sur `/api/*` du backend.
