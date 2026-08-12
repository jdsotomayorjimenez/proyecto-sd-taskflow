# proyecto-sd-taskflow
Proyecto - 2P - Sistemas Distribuidos

TaskFlow — Sistema de Gestión de Tareas distribuido entre dos máquinas y dos clústeres Kubernetes independientes, comunicados por Tailscale.

## Backend — Juan Diego (Máquina A)

Node.js + Express + Mongoose + MongoDB + JWT + bcryptjs, contenerizado y desplegado en Kubernetes: Backend con `NodePort 30080` (2 réplicas iniciales, escalable a 4) y MongoDB con `ClusterIP` (1 réplica).

- Código: `backend/`
- Manifiestos de Kubernetes: `kubernetes/maquina-a/`
- Imagen publicada: [`juandifrost17/taskflow-backend:v3`](https://hub.docker.com/r/juandifrost17/taskflow-backend)

### Secret y despliegue de Máquina A

El repositorio no contiene credenciales reales. El archivo
`kubernetes/maquina-a/01-mongodb-secret.yaml.example` es solo una referencia y,
por no terminar en `.yaml`, no se procesa al aplicar el directorio de
manifiestos. En una máquina nueva, genera valores locales seguros y crea el
Secret antes de desplegar:

```bash
MONGO_PASSWORD="$(openssl rand -base64 36)"
JWT_SECRET="$(openssl rand -base64 48)"

kubectl create secret generic taskflow-secret \
  --from-literal=MONGO_USERNAME=taskflow_admin \
  --from-literal=MONGO_PASSWORD="$MONGO_PASSWORD" \
  --from-literal=JWT_SECRET="$JWT_SECRET"

kubectl apply -f kubernetes/maquina-a/
```

No guardes ni confirmes esos valores en Git. En una instalación nueva, MongoDB
crea el usuario raíz a partir del Secret. En una instalación existente, el
usuario y la contraseña del Secret deben coincidir con los almacenados realmente
en MongoDB.

Cambiar `MONGO_INITDB_ROOT_PASSWORD` después de inicializar `/data/db` no cambia
la contraseña del usuario persistido. Para rotarla sin borrar el PVC:

1. comprueba que la credencial actual autentica y registra los conteos de datos;
2. detén temporalmente los pods del backend;
3. genera una contraseña nueva fuera del repositorio;
4. ejecuta `db.changeUserPassword(...)` en `admin` con la credencial actual;
5. actualiza `taskflow-secret` con exactamente el mismo valor;
6. recrea MongoDB y el backend para que reciban las nuevas variables;
7. verifica autenticación, conteos, logs y endpoints.

No elimines `mongodb-pvc` para hacer esta rotación. Cambiar `JWT_SECRET` invalida
los tokens existentes, por lo que los usuarios deben iniciar sesión otra vez.

MongoDB mantiene una sola réplica sobre un PVC y usa una estrategia `Recreate`:
durante una actualización se termina el pod anterior antes de crear el nuevo,
evitando dos procesos que intenten usar el mismo volumen.

### Estado de salud de Máquina A

- `GET /api/health`: liveness; comprueba que Node/Express está vivo y no depende
  de MongoDB.
- `GET /api/ready`: readiness; devuelve `200` solo si Mongoose está conectado y
  `503` cuando el backend aún no puede atender operaciones con la base.

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

Kubernetes con 2 Pods de Backend + 1 Pod de MongoDB, servicios correctos
(`NodePort`/`ClusterIP`), estado de Tailscale, probes separadas, imagen `v3` y
escalado en vivo de 2 a 4 réplicas.

| | |
|---|---|
| ![Pods, servicios y Tailscale](docs/evidencias/01-a-kubectl-pods-services-tailscale.png) | ![Describe del backend, parte 1](docs/evidencias/02-a-describe-backend-parte-1.png) |
| Pods, servicios y estado de Tailscale | Deployment backend: imagen `v3`, liveness y readiness |
| ![Describe del backend, parte 2](docs/evidencias/03-a-describe-backend-parte-2.png) | ![Backend con 2 replicas](docs/evidencias/04-a-backend-2-replicas.png) |
| Deployment backend: condiciones, ReplicaSets y eventos | Backend con 2 réplicas (estado inicial) |
| ![Backend escalado a 4 replicas](docs/evidencias/05-a-backend-4-replicas.png) | ![Health y readiness](docs/evidencias/06-a-health-readiness.png) |
| Backend escalado a 4 réplicas | `/api/health` y `/api/ready` responden HTTP 200 |
| ![Contenedores en Docker Desktop](docs/evidencias/07-a-docker-desktop-contenedores.png) | ![Kubernetes en Docker Desktop](docs/evidencias/09-a-docker-desktop-kubernetes.png) |
| Contenedores de Backend y MongoDB | Clúster activo con 2 Pods de Backend y 1 de MongoDB |
| ![Backend v3 en Docker Hub](docs/evidencias/12-a-dockerhub-imagen.png) | |
| Imagen `juandifrost17/taskflow-backend:v3` publicada en Docker Hub | |

## Frontend — Karel (Máquina B)

React 18 + Vite + Tailwind CSS + React Router + FullCalendar, servido con Nginx y desplegado en Kubernetes. La app corre en la Máquina B y consume la API del backend de la Máquina A por Tailscale, nunca por `localhost`.

- Código: `frontend/`
- Manifiestos de Kubernetes: `kubernetes/maquina-b/`
- Imagen publicada: [`karelgonzalez/karel-taskflow-frontend:latest`](https://hub.docker.com/r/karelgonzalez/karel-taskflow-frontend)
- Acceso web: `http://localhost:30081` (NodePort del Frontend)

Pantallas: registro e inicio de sesión con JWT, un resumen con indicadores (por hacer, vencidas, para hoy, completadas), la lista de tareas con filtros, la vista de hoy y un calendario mensual y semanal. El CRUD completo (crear, listar, editar, completar y eliminar) trabaja contra el backend real.

### Cómo se conecta con la Máquina A

La IP de Tailscale de la Máquina A no se escribe en el código. Se inyecta en tiempo de ejecución: el ConfigMap `frontend-config` define `API_URL`, y al arrancar el contenedor el script `docker-entrypoint.d/40-runtime-config.sh` genera un `config.js` que React lee como `window.APP_CONFIG.API_URL`. Para apuntar a otra IP basta con cambiar el ConfigMap y reiniciar el pod, sin recompilar.

Del lado de la Máquina A hacen falta tres cosas: el backend expuesto en `NodePort 30080` alcanzable por Tailscale, Tailscale encendido en la misma tailnet, y el CORS del backend abierto al origen `http://localhost:30081`.

### Docker y despliegue

```bash
# Construir y publicar la imagen
docker build -t karelgonzalez/karel-taskflow-frontend:latest ./frontend
docker push karelgonzalez/karel-taskflow-frontend:latest

# Desplegar en Kubernetes de la Máquina B
kubectl apply -f kubernetes/maquina-b/
kubectl get pods
kubectl get services
```

La app queda en `http://localhost:30081`.

### Desarrollo local

El frontend trae un backend simulado (mock) que guarda los datos en el navegador, para trabajar la interfaz sin depender de la Máquina A. Se activa con `VITE_USE_MOCK=true` (ver `frontend/.env.example`).

```bash
cd frontend
npm install
npm run dev
```

### Credenciales de prueba

En la app desplegada, contra el backend real:

- `demo1@taskflow.test` / `demo1234`
- `lautaro@taskflow.test` / `quintero1234`

En modo mock (desarrollo): `demo@taskflow.com` / `demo123`.

### Evidencias — Máquina B

La app en el navegador con datos reales del backend, el clúster de Kubernetes con el pod del Frontend, `kubectl get pods` y `get services`, `tailscale status`, la prueba de conexión cruzada y la imagen publicada en Docker Hub.

| | |
|---|---|
| ![Registro](docs/evidencias/01-b-app-registro.png) | ![Inicio de sesion](docs/evidencias/02-b-app-inicio-sesion.png) |
| Registro | Inicio de sesión |
| ![Resumen](docs/evidencias/03-b-app-resumen.png) | ![Hoy](docs/evidencias/04-b-app-hoy.png) |
| Resumen con indicadores | Hoy |
| ![Mis tareas](docs/evidencias/05-b-app-mis-tareas.png) | ![Nueva tarea](docs/evidencias/08-b-app-nueva-tarea.png) |
| Mis tareas con filtros | Crear tarea |
| ![Calendario mensual](docs/evidencias/06-b-app-calendario-mensual.png) | ![Calendario semanal](docs/evidencias/07-b-app-calendario-semanal.png) |
| Calendario (mes) | Calendario (semana) |
| ![Kubernetes en Docker Desktop](docs/evidencias/09-b-docker-desktop-kubernetes.png) | ![kubectl y tailscale](docs/evidencias/10-b-kubectl-pods-services-tailscale.png) |
| Kubernetes en Docker Desktop | `kubectl get pods/services` y `tailscale status` |
| ![Conexion cruzada](docs/evidencias/11-b-curl-cruzado-backend.png) | ![Imagen en Docker Hub](docs/evidencias/12-b-dockerhub-imagen.png) |
| Conexión cruzada al backend de la Máquina A | Imagen publicada en Docker Hub |
