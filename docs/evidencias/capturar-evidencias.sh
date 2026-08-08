#!/bin/sh
set -eu

# Guia interactiva para tomar las 6 capturas de evidencia de la Maquina A.
# Ejecuta este script y toma la captura de pantalla en cada pausa, antes de
# presionar Enter para continuar al siguiente paso.
#
# Uso: ./docs/evidencias/capturar-evidencias.sh

pausar() {
  echo ""
  echo ">> Toma la captura y guardala como: docs/evidencias/$1"
  read -r _ignorar
}

echo "=== Evidencia 1/6: kubectl get pods ==="
kubectl get pods
pausar "01-a-kubectl-get-pods.png"

echo "=== Evidencia 2/6: kubectl get services ==="
kubectl get services
pausar "02-a-kubectl-get-services.png"

echo "=== Evidencia 3/6: tailscale status ==="
tailscale status
pausar "03-a-tailscale-status.png"

echo "=== Evidencia 4/6: kubectl describe deployment backend ==="
kubectl describe deployment backend
pausar "04-a-describe-backend.png"

echo "=== Evidencia 5/6: Backend con 2 replicas ==="
kubectl scale deployment backend --replicas=2 >/dev/null
kubectl rollout status deployment/backend --timeout=60s
kubectl get deployment backend
kubectl get pods -l app=backend
pausar "05-a-backend-2-replicas.png"

echo "=== Evidencia 6/6: Backend escalado a 4 replicas ==="
kubectl scale deployment backend --replicas=4
kubectl rollout status deployment/backend --timeout=60s
kubectl get deployment backend
kubectl get pods -l app=backend
pausar "06-a-backend-4-replicas.png"

echo ""
echo "Regresando el backend a 2 replicas (estado base)..."
kubectl scale deployment backend --replicas=2 >/dev/null
kubectl rollout status deployment/backend --timeout=60s

echo ""
echo "Listo. Verifica que las 6 imagenes esten en docs/evidencias/ con esos nombres exactos."
