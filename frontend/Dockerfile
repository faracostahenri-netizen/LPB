# Frontend Dockerfile - React (CRA + craco) served with `serve`
FROM node:20-alpine AS build

WORKDIR /app

# Build-time env (Railway will pass this via build args / env vars)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .
RUN yarn build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
RUN yarn global add serve
COPY --from=build /app/build ./build

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
