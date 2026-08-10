# ============================================================================
#  Dockerfile Frontend TaskFlow (Maquina B)
#  Multi-stage: build con Node + servir la SPA con Nginx.
# ============================================================================

# ---- Etapa 1: build de la SPA con Vite ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- Etapa 2: servir con Nginx ----
FROM nginx:alpine

# Config de Nginx (SPA + no-cache para config.js)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefactos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Script que genera /config.js en el arranque a partir de la variable API_URL
# (inyectada por el ConfigMap de Kubernetes B). La imagen oficial de Nginx
# ejecuta automaticamente los scripts de /docker-entrypoint.d/ al iniciar.
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80
