# TaskFlow: documentación técnica del proyecto

Sistema de gestión de tareas repartido entre dos máquinas, cada una con su propio
clúster de Kubernetes de Docker Desktop, comunicadas por una red privada de
Tailscale. El backend y la base de datos viven en la Máquina A (Estudiante A); el
frontend vive en la Máquina B (Estudiante B). El navegador abre la app en la Máquina
B, pero las tareas que muestra vienen de verdad de la base de datos que corre en la
Máquina A.

Este documento explica en profundidad cómo está armado todo, con foco en las tres
piezas de infraestructura del examen: Docker, Kubernetes y Tailscale. La parte de
frontend (React) y backend (Express) se describe lo justo para entender qué se
contiene y qué se despliega; el peso está en cómo se construye, se despliega y se
conecta.

---

## 1. Objetivo y reparto

El enunciado pide una app de tareas (crear, listar, editar, eliminar) dividida en dos
partes desplegadas con Docker y Kubernetes en máquinas distintas, donde el frontend
consume la API del backend a través de Tailscale.

| Componente | Máquina | A cargo de |
|---|---|---|
| Backend + MongoDB | Máquina A | Estudiante A |
| Frontend | Máquina B | Estudiante B |

Cada máquina corre su propio Kubernetes (el que trae Docker Desktop). Son dos
clústeres independientes: el de la Máquina A no sabe nada del de la Máquina B. Lo
único que los une es Tailscale.

---

## 2. Arquitectura general

```text
        MÁQUINA A (Estudiante A)                     MÁQUINA B (Estudiante B)
   ┌────────────────────────────────┐          ┌────────────────────────────────┐
   │ Docker Desktop + Kubernetes     │          │ Docker Desktop + Kubernetes     │
   │                                 │          │                                 │
   │  Secret (Mongo pass, JWT)       │          │  ConfigMap (API_URL)            │
   │  ConfigMap (MONGO_HOST, ...)    │          │        │                        │
   │        │                        │          │        ▼                        │
   │  Backend Deployment (2 pods)    │          │  Frontend Deployment (1 pod)    │
   │        │                        │          │   Nginx + React                 │
   │  backend-service (NodePort      │   Tail   │        │                        │
   │  30080) ◄───────────────────────┼── scale ─┼────────┘ API_URL                │
   │        │                        │   (VPN)  │  frontend-service (NodePort     │
   │  mongodb-service (ClusterIP)    │          │  30081)                         │
   │        │                        │          │        │                        │
   │  MongoDB Deployment (1 pod)     │          │        ▼                        │
   │        │                        │          │  Navegador de la Máquina B      │
   │  PersistentVolumeClaim (1Gi)    │          │                                 │
   └────────────────────────────────┘          └────────────────────────────────┘
```

Regla de oro del proyecto: el frontend nunca usa `localhost` para hablar con el
backend, porque el backend no corre en su máquina. Usa la IP de Tailscale de la
Máquina A junto con el NodePort del backend (`30080`).

---

## 3. Los dos componentes por dentro

### 3.1 Backend (Máquina A)

- Stack: Node.js 22, Express 5, Mongoose 9 sobre MongoDB 8, JWT (`jsonwebtoken`),
  hashing de contraseñas con `bcryptjs`, y `cors` para permitir el origen del
  frontend.
- Estructura: `src/app.js` arma Express y monta las rutas; `src/config/database.js`
  conecta a Mongo; `controllers/` tiene la lógica de auth y de tareas; `models/`
  define los esquemas `Usuario` y `Tarea` con Mongoose; `middleware/` valida el token
  y los datos; `routes/` expone los endpoints.
- La API que consume el frontend:

  ```text
  GET    /api/health                 salud (público, para la prueba cruzada)
  POST   /api/auth/register          registro
  POST   /api/auth/login             login (devuelve un JWT)
  GET    /api/tareas                 listar (protegido)
  GET    /api/tareas/:id             obtener una (protegido)
  POST   /api/tareas                 crear (protegido)
  PUT    /api/tareas/:id             editar (protegido)
  DELETE /api/tareas/:id             eliminar (protegido)
  PATCH  /api/tareas/:id/completar   completar (protegido)
  ```

  Las rutas protegidas exigen la cabecera `Authorization: Bearer <token>`.

### 3.2 Frontend (Máquina B)

- Stack: React 18 con Vite, Tailwind CSS, React Router y FullCalendar, servido con
  Nginx dentro del contenedor.
- Pantallas: registro e inicio de sesión con JWT, un resumen con indicadores (por
  hacer, vencidas, para hoy, completadas), la lista de tareas con filtros, la vista
  de hoy y un calendario mensual y semanal.
- Toda petición HTTP pasa por un solo archivo (`src/services/api.js`), que agrega el
  token en cada llamada y, ante un 401, cierra la sesión.

---

## 4. Docker

### 4.1 Qué resuelve

Docker empaqueta cada componente con todo lo que necesita para correr (código,
dependencias, runtime) en una imagen. Esa imagen corre igual en cualquier máquina,
que es justo lo que hace falta cuando el backend y el frontend viven en equipos
distintos. Cada integrante construye y prueba su imagen localmente y la publica en
Docker Hub para que Kubernetes la pueda desplegar.

### 4.2 Imagen del backend

`backend/Dockerfile`:

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache tzdata
ENV TZ=America/Guayaquil
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

Es una imagen de una sola etapa. Parte de Node 22 sobre Alpine (liviano), fija la
zona horaria, instala solo las dependencias de producción (`--omit=dev`) y arranca el
servidor Express en el puerto 3000. La imagen se publica como
`juandifrost17/taskflow-backend` (el Deployment usa el tag `v2`).

### 4.3 Imagen del frontend

`frontend/Dockerfile` es de dos etapas (multi-stage):

```dockerfile
# Etapa 1: compilar la SPA con Node
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: servir lo compilado con Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
```

La primera etapa usa Node para compilar React con Vite. La segunda etapa se queda
solo con los archivos ya compilados y los sirve con Nginx, así la imagen final es
pequeña (no arrastra Node ni las dependencias de compilación). Se copia también un
script de arranque que genera la configuración en tiempo de ejecución (ver la sección
de la conexión). La imagen se publica como `karelgonzalez/karel-taskflow-frontend`.

### 4.4 Construir, probar y publicar

```bash
# Backend (Máquina A)
docker build -t juandifrost17/taskflow-backend:v2 ./backend
docker run --rm -p 3000:3000 juandifrost17/taskflow-backend:v2   # probar local
docker login
docker push juandifrost17/taskflow-backend:v2

# Frontend (Máquina B)
docker build -t karelgonzalez/karel-taskflow-frontend:latest ./frontend
docker run --rm -p 8080:80 -e API_URL="http://100.86.94.78:30080" \
  karelgonzalez/karel-taskflow-frontend:latest                   # probar local
docker login
docker push karelgonzalez/karel-taskflow-frontend:latest
```

---

## 5. Kubernetes

Es la pieza central. Cada máquina corre el Kubernetes que viene con Docker Desktop
(un clúster de un solo nodo, `kubeadm`). Kubernetes toma las imágenes de Docker Hub y
las mantiene corriendo con la cantidad de réplicas que le pidamos, les da una IP
estable a través de un Service, y les inyecta configuración con ConfigMaps y Secrets.

### 5.1 Los objetos y para qué sirve cada uno

- Deployment: define cuántas copias (réplicas) de un contenedor deben correr y las
  mantiene vivas. Si un pod se cae, lo vuelve a crear.
- Service: da una dirección estable a un grupo de pods y reparte el tráfico entre
  ellos. ClusterIP solo se ve dentro del clúster; NodePort abre un puerto en la
  máquina para que se pueda llegar desde afuera.
- ConfigMap: guarda variables de configuración no secretas.
- Secret: guarda datos sensibles (contraseñas, el secreto del JWT).
- PersistentVolumeClaim: pide un disco que sobrevive a que el pod se reinicie, para
  que MongoDB no pierda los datos.

### 5.2 Máquina A (backend + base de datos)

Siete objetos en `kubernetes/maquina-a/`:

- `taskflow-secret` (Secret): usuario y contraseña de Mongo y el `JWT_SECRET`.
- `backend-config` (ConfigMap): `PORT=3000`, `MONGO_HOST=mongodb-service`,
  `MONGO_PORT=27017`, `MONGO_DATABASE=taskflow`. El backend encuentra la base por el
  nombre del Service (`mongodb-service`), no por una IP.
- `mongodb-service` (Service ClusterIP, puerto 27017): expone MongoDB solo dentro del
  clúster de A. Desde afuera nadie lo alcanza.
- `mongodb` (Deployment, 1 réplica): imagen `mongo:8.0`, con usuario y contraseña
  tomados del Secret, y el directorio de datos montado sobre un volumen persistente.
- `mongodb-pvc` (PersistentVolumeClaim, 1Gi): el disco donde Mongo guarda los datos.
- `backend-service` (Service NodePort, `30080`): expone el backend hacia afuera del
  clúster. Este es el puerto que la Máquina B alcanza por Tailscale.
- `backend` (Deployment, 2 réplicas): imagen del backend, con la configuración
  inyectada desde el ConfigMap y el Secret (`envFrom`), y sondas de salud
  (`readinessProbe` y `livenessProbe`) que consultan `/api/health`.

Cómo se enganchan entre sí: el Deployment del backend pone la etiqueta `app: backend`
a sus pods, y el `backend-service` selecciona esa etiqueta para saber a qué pods
mandar el tráfico. Lo mismo con `app: mongodb` y `mongodb-service`. El backend lee
`MONGO_HOST=mongodb-service` y resuelve ese nombre por el DNS interno del clúster.

### 5.3 Máquina B (frontend)

Tres objetos en `kubernetes/maquina-b/`:

- `frontend-config` (ConfigMap): la variable `API_URL`, que apunta a la IP de
  Tailscale de la Máquina A y al NodePort del backend (`http://100.86.94.78:30080`).
- `frontend` (Deployment, 1 réplica): la imagen del frontend, con el ConfigMap
  inyectado como variable de entorno y una `readinessProbe` sobre `/config.js`.
- `frontend-service` (Service NodePort, `30081`): el puerto por donde se abre la app
  desde el navegador de la Máquina B.

### 5.4 Comandos de Kubernetes usados

```bash
# Desplegar todos los manifiestos de una carpeta
kubectl apply -f kubernetes/maquina-a/     # en la Máquina A
kubectl apply -f kubernetes/maquina-b/     # en la Máquina B

# Ver el estado
kubectl get pods
kubectl get services
kubectl get configmaps
kubectl describe deployment backend        # detalle del Deployment del backend

# Logs y reinicio (por ejemplo tras cambiar un ConfigMap)
kubectl logs deployment/backend
kubectl rollout restart deployment/frontend

# Escalar el backend de 2 a 4 réplicas
kubectl scale deployment backend --replicas=4
```

### 5.5 El escalado (2 a 4 réplicas)

El Deployment del backend arranca con 2 réplicas. Con un solo comando,
`kubectl scale deployment backend --replicas=4`, Kubernetes crea dos pods más y el
`backend-service` empieza a repartir el tráfico entre los cuatro, sin cortar el
servicio. Esto demuestra el escalado horizontal: más copias del mismo backend detrás
de una única dirección.

---

## 6. Tailscale

### 6.1 Qué resuelve

Los dos clústeres corren en máquinas distintas, probablemente en redes distintas y
detrás de routers que no dejan pasar conexiones entrantes. Tailscale arma una red
privada virtual (una VPN de malla basada en WireGuard) donde cada máquina que se une
a la misma tailnet recibe una IP privada estable del rango `100.x.y.z`, y todas se
ven entre sí como si estuvieran en la misma red local, sin abrir puertos en el router.

### 6.2 Cómo lo usamos

Ambas máquinas instalan Tailscale y se unen a la misma tailnet. En este proyecto:

- Máquina B (frontend): `100.68.100.90` (`karellaptop`).
- Máquina A (backend): `100.86.94.78` (`juan-diego-thinkpad-t14`).

El frontend usa la IP de la Máquina A más el NodePort del backend como URL de la API:
`http://100.86.94.78:30080`. Así la petición sale de la Máquina B, viaja cifrada por
Tailscale hasta la Máquina A y entra al `backend-service`.

### 6.3 Comandos

```bash
tailscale status                 # lista las máquinas de la tailnet y su estado
tailscale ip -4                  # la IP Tailscale propia
tailscale ping 100.86.94.78      # probar conectividad hacia la Máquina A
```

---

## 7. La conexión de punta a punta

Este es el recorrido completo de una petición, que es lo que hace que la app en la
Máquina B muestre datos que están guardados en la Máquina A:

1. El navegador de la Máquina B abre `http://localhost:30081`, el NodePort del
   frontend. Nginx entrega la SPA de React.
2. React lee `window.APP_CONFIG.API_URL` y hace `fetch` a
   `http://100.86.94.78:30080/api/...`, con el token en la cabecera.
3. La petición sale por Tailscale hasta la Máquina A y entra al `backend-service`
   (NodePort 30080), que la reparte entre las réplicas del backend.
4. El backend valida el JWT, consulta MongoDB a través de `mongodb-service`
   (ClusterIP, solo visible dentro del clúster de A) y arma la respuesta.
5. La respuesta vuelve por el mismo camino hasta el navegador, y React pinta las
   tareas.

### 7.1 La URL de la API no está quemada en el código

Si la IP de Tailscale de la Máquina A se escribiera dentro del bundle de React,
cambiar de IP obligaría a recompilar y volver a publicar la imagen. Para evitarlo, la
URL se resuelve al arrancar el contenedor:

```text
ConfigMap (API_URL)
   │  se inyecta como variable de entorno
   ▼
docker-entrypoint.d/40-runtime-config.sh   (corre al arrancar Nginx)
   │  genera /config.js con esa URL
   ▼
window.APP_CONFIG.API_URL   ←  lo lee React en src/services/api.js
```

Para apuntar a otra IP basta con editar el ConfigMap y reiniciar el pod
(`kubectl rollout restart deployment/frontend`). No se recompila nada.

### 7.2 CORS

El navegador que hace las peticiones se sirve desde `http://localhost:30081`, así que
el backend de la Máquina A debe permitir ese origen en su configuración de CORS. Si
falta, la prueba con `curl` responde 200 pero la app en el navegador falla con un
error de CORS. Es el punto de coordinación más fácil de olvidar entre las dos
máquinas.

---

## 8. Seguridad

- Las credenciales de MongoDB y el secreto del JWT viven en un Secret de Kubernetes,
  no en el código ni en un ConfigMap.
- Las contraseñas de los usuarios se guardan con hash (`bcryptjs`), nunca en texto
  plano.
- La sesión usa un JWT firmado con el `JWT_SECRET`; el frontend lo manda en cada
  petición protegida y el backend lo valida en un middleware.
- MongoDB solo se expone con ClusterIP, de modo que nadie fuera del clúster de la
  Máquina A puede llegar a la base.

---

## 9. Cómo levantar todo

En la Máquina A:

```bash
docker build -t juandifrost17/taskflow-backend:v2 ./backend
docker push juandifrost17/taskflow-backend:v2
kubectl apply -f kubernetes/maquina-a/
kubectl get pods
kubectl get services
```

En la Máquina B:

```bash
docker build -t karelgonzalez/karel-taskflow-frontend:latest ./frontend
docker push karelgonzalez/karel-taskflow-frontend:latest
kubectl apply -f kubernetes/maquina-b/
kubectl get pods
kubectl get services
```

Con las dos máquinas en la misma tailnet y el ConfigMap del frontend apuntando a la
IP de Tailscale de la Máquina A, la app queda accesible en `http://localhost:30081`
desde el navegador de la Máquina B.

### 9.1 Credenciales de prueba

- Backend real: `demo1@taskflow.test` / `demo1234` y `lautaro@taskflow.test` /
  `quintero1234`.
- Frontend en modo simulado (desarrollo): `demo@taskflow.com` / `demo123`.

---

## 10. Evidencias

Las capturas están en `docs/evidencias/`, con prefijo `-a-` para la Máquina A y `-b-`
para la Máquina B. Cubren, en ambas máquinas: `kubectl get pods` y `get services`,
`tailscale status` con las dos máquinas conectadas, el `kubectl describe deployment`
del backend, la prueba de conexión cruzada, la app en el navegador con datos reales
del backend, el escalado del backend a 4 réplicas y las imágenes publicadas en Docker
Hub.

---

## 11. Decisiones de diseño

- Dos clústeres independientes unidos solo por Tailscale, para respetar que cada
  componente vive en la máquina de un integrante distinto.
- La URL de la API se resuelve en tiempo de ejecución desde un ConfigMap, así la IP
  de Tailscale nunca queda incrustada en la imagen del frontend.
- Imagen del frontend en dos etapas, para que el contenedor final solo tenga Nginx y
  los archivos compilados.
- MongoDB con ClusterIP y volumen persistente: la base no se expone hacia afuera y no
  pierde datos al reiniciarse el pod.
- Sondas de salud en el backend (`/api/health`) para que Kubernetes solo mande
  tráfico a réplicas que ya están listas.
- El backend se expone con NodePort para que la Máquina B lo alcance por Tailscale, y
  el frontend con NodePort para abrirlo desde el navegador.
