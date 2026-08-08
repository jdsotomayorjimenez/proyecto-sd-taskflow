#!/bin/sh
set -eu

# Flujo de humo del API TaskFlow: health -> register -> login -> create -> list -> update -> completar -> delete
# Uso: BASE_URL=http://IP_TAILSCALE:30080 ./scripts/smoke-api.sh
# Por defecto apunta a http://localhost:3000 (servidor local, sin Kubernetes).

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="smoke-$(date +%s)@test.com"
PASSWORD="clave123"

if ! command -v jq >/dev/null 2>&1; then
  echo "Este script requiere 'jq' instalado (sudo apt install jq / brew install jq / choco install jq)."
  exit 1
fi

paso() {
  echo ""
  echo "== $1 =="
}

esperar_status() {
  esperado="$1"
  actual="$2"
  if [ "$actual" != "$esperado" ]; then
    echo "FALLO: se esperaba HTTP $esperado, se obtuvo $actual"
    exit 1
  fi
  echo "OK (HTTP $actual)"
}

paso "1. Health"
RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
BODY=$(echo "$RES" | head -n -1)
STATUS=$(echo "$RES" | tail -n 1)
echo "$BODY"
esperar_status 200 "$STATUS"

paso "2. Register ($EMAIL)"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
BODY=$(echo "$RES" | head -n -1)
STATUS=$(echo "$RES" | tail -n 1)
echo "$BODY"
esperar_status 201 "$STATUS"

paso "3. Login"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
BODY=$(echo "$RES" | head -n -1)
STATUS=$(echo "$RES" | tail -n 1)
esperar_status 200 "$STATUS"
TOKEN=$(echo "$BODY" | jq -r .token)
AUTH_HEADER="Authorization: Bearer $TOKEN"

paso "4. Crear tarea"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tareas" \
  -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d '{"titulo":"Tarea de smoke test","prioridad":"Alta"}')
BODY=$(echo "$RES" | head -n -1)
STATUS=$(echo "$RES" | tail -n 1)
echo "$BODY"
esperar_status 201 "$STATUS"
TAREA_ID=$(echo "$BODY" | jq -r ._id)

paso "5. Listar tareas"
RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tareas" -H "$AUTH_HEADER")
STATUS=$(echo "$RES" | tail -n 1)
esperar_status 200 "$STATUS"

paso "6. Editar tarea"
RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/tareas/$TAREA_ID" \
  -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d '{"titulo":"Tarea de smoke test (editada)","prioridad":"Media"}')
STATUS=$(echo "$RES" | tail -n 1)
esperar_status 200 "$STATUS"

paso "7. Completar tarea"
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api/tareas/$TAREA_ID/completar" -H "$AUTH_HEADER")
STATUS=$(echo "$RES" | tail -n 1)
esperar_status 200 "$STATUS"

paso "8. Eliminar tarea"
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tareas/$TAREA_ID" -H "$AUTH_HEADER")
STATUS=$(echo "$RES" | tail -n 1)
esperar_status 200 "$STATUS"

echo ""
echo "Smoke test completo: OK ($BASE_URL)"
