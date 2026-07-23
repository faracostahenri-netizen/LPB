FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./

# Étape 1 : on installe ajv en version 7 (compatible avec ajv-keywords)
RUN npm install ajv@7.2.4 --save-dev --force

# Étape 2 : on installe toutes les autres dépendances avec --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Étape 3 : on copie le reste du frontend
COPY frontend/ ./

# Étape 4 : on build
RUN npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FRONTEND_BUILD_DIR=/app/frontend_build \
    DB_NAME=certificate \
    CORS_ORIGINS=*

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY backend/ ./

COPY --from=frontend-builder /app/dist ./frontend_build

EXPOSE $PORT

CMD uvicorn server:app --host 0.0.0.0 --port $PORT
