# Deploy on Railway (1 seul service)

Tout (backend FastAPI + frontend React) tourne dans **un seul container**.
Le Dockerfile racine build le React, le copie dans l'image Python, et FastAPI
sert à la fois `/api/*` (API) et `/` (SPA).

## Étapes

### 1. MongoDB (1 fois)
Dans ton projet Railway : **+ New → Database → Add MongoDB**.
Railway expose la variable `MONGO_URL` (utilise le **private networking** entre services).

### 2. Service application (le tien)
- **+ New → GitHub Repo → Certicode**
- Settings :
  - **Root Directory** : *laisser vide (racine)*
  - **Builder** : Dockerfile (auto-détecté via `railway.json`)
- **Variables** :
  ```
  MONGO_URL=${{MongoDB.MONGO_URL}}
  DB_NAME=certicode
  CORS_ORIGINS=*
  TELEGRAM_BOT_TOKEN=<ton token>
  TELEGRAM_CHAT_ID=<ton chat id>
  ADMIN_READ_TOKEN=<token aléatoire>
  ```
  (le `${{MongoDB.MONGO_URL}}` référence le service Mongo automatiquement)
- **Networking → Generate Domain**

### 3. C'est tout
- App ouverte sur `https://<ton-app>.up.railway.app`
- API sur `https://<ton-app>.up.railway.app/api/health`
- Front et back partagent la même origine → pas de problème CORS.

## Build local pour tester
```bash
docker build -t certicode .
docker run -p 8001:8001 \
  -e MONGO_URL="mongodb://host.docker.internal:27017" \
  -e DB_NAME=certicode \
  certicode
# Ouvre http://localhost:8001
```
