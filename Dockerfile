# ============================================================
# Single-service Dockerfile for Railway / any container host.
# Builds the React frontend, then bundles it into the FastAPI
# backend image. One container serves both UI + API.
# ============================================================

# ---------- Stage 1: build React frontend ----------
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

# Frontend talks to the backend via same-origin (/api/*).
# An empty REACT_APP_BACKEND_URL makes the api lib use relative URLs.
ENV REACT_APP_BACKEND_URL=""
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY frontend/ ./
RUN yarn build


# ---------- Stage 2: Python backend + bundled build ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FRONTEND_BUILD_DIR=/app/frontend_build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -r requirements.txt

# Backend source
COPY backend/ ./

# React build copied into the image
COPY --from=frontend-build /frontend/build /app/frontend_build

# Railway injects $PORT; default to 8001 for local runs
ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
