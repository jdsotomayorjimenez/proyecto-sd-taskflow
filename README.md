# proyecto-sd-taskflow
Proyecto - 2P - Sistemas Distribuidos

## Backend — correr tests localmente

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

Para un flujo de humo end-to-end contra un servidor ya corriendo (local o vía Tailscale/NodePort):

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke-api.sh
```

Requiere `jq` instalado.
