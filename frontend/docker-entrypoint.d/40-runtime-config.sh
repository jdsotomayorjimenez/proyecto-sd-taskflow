#!/bin/sh
# ============================================================================
#  Genera /config.js EN TIEMPO DE EJECUCION a partir de la variable de entorno
#  API_URL (inyectada por el ConfigMap de Kubernetes B).
#
#  Asi la IP Tailscale de la Maquina A NUNCA queda incrustada en el bundle
#  de React: se resuelve al arrancar el contenedor.
#
#  La imagen oficial de Nginx ejecuta este script automaticamente porque vive
#  en /docker-entrypoint.d/ y termina en .sh
# ============================================================================
set -eu

# Valor por defecto por si no llega la variable (no rompe el arranque).
API_URL="${API_URL:-http://localhost:3000}"

cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = {
  API_URL: "${API_URL}"
};
EOF

echo "[40-runtime-config] config.js generado con API_URL=${API_URL}"
