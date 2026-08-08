# proyecto-sd-taskflow
Proyecto - 2P - Sistemas Distribuidos

TaskFlow — Sistema de Gestión de Tareas distribuido entre dos máquinas y dos clústeres Kubernetes independientes, comunicados por Tailscale.

## Backend — Juan Diego (Máquina A)

Node.js + Express + Mongoose + MongoDB + JWT + bcryptjs, contenerizado y desplegado en Kubernetes: Backend con `NodePort 30080` (2 réplicas iniciales, escalable a 4) y MongoDB con `ClusterIP` (1 réplica).

- Código: `backend/`
- Manifiestos de Kubernetes: `kubernetes/maquina-a/`
- Imagen publicada: [`juandifrost17/taskflow-backend:v1`](https://hub.docker.com/r/juandifrost17/taskflow-backend)

### Correr tests localmente

Los tests (`backend/tests/`) usan una base MongoDB real, no mocks. Antes de correr `npm test` necesitas un MongoDB accesible:

```bash
docker run -d --name taskflow-mongo-dev -p 27017:27017 mongo:8.0
```

Luego, desde `backend/`:

```bash
npm install
npm test
```

Por defecto los tests se conectan a `localhost:27017` y usan la base `taskflow_test` (separada de la de desarrollo/seed) para no pisar datos. Se puede sobreescribir con variables de entorno:

```bash
MONGO_HOST=localhost MONGO_PORT=27017 MONGO_DATABASE=taskflow_test npm test
```

Para un flujo de humo end-to-end contra un servidor ya corriendo (local, en Docker o vía Tailscale/NodePort):

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke-api.sh
```

Requiere `jq` instalado.

### Datos de prueba

```bash
cd backend
npm run seed
```

Crea 2 usuarios de prueba con tareas variadas (ver `backend/scripts/seed.js` para credenciales).

### Evidencias — Máquina A

Kubernetes con 2 Pods de Backend + 1 Pod de MongoDB, servicios correctos (`NodePort`/`ClusterIP`), conectividad por Tailscale, y el escalado en vivo de 2 a 4 réplicas.

| | |
|---|---|
| ![kubectl get pods](docs/evidencias/01-a-kubectl-get-pods.png) | ![kubectl get services](docs/evidencias/02-a-kubectl-get-services.png) |
| `kubectl get pods` | `kubectl get services` |
| ![tailscale status](docs/evidencias/03-a-tailscale-status.png) | ![kubectl describe deployment backend](docs/evidencias/04-a-describe-backend.png) |
| `tailscale status` | `kubectl describe deployment backend` |
| ![Backend con 2 replicas](docs/evidencias/05-a-backend-2-replicas.png) | ![Backend escalado a 4 replicas](docs/evidencias/06-a-backend-4-replicas.png) |
| Backend con 2 réplicas (estado inicial) | Backend escalado a 4 réplicas |

Script usado para generarlas: `docs/evidencias/capturar-evidencias.sh`.

## Frontend — Karel (Máquina B)

_Pendiente — sección a completar por Karel con su parte (React, Kubernetes B, evidencias del Frontend)._
