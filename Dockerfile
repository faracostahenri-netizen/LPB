FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
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
    pip install --extra-index-url https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

COPY backend/ ./

COPY --from=frontend-builder /app/dist ./frontend_build

EXPOSE $PORT

CMD uvicorn server:app --host 0.0.0.0 --port $PORT
