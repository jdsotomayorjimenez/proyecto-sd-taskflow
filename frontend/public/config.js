// ============================================================================
//  CONFIGURACION EN TIEMPO DE EJECUCION (runtime)
// ============================================================================
//  Este archivo es un VALOR POR DEFECTO para desarrollo local.
//
//  En produccion (Kubernetes Maquina B) el script 40-runtime-config.sh
//  SOBRESCRIBE este archivo usando la variable API_URL del ConfigMap,
//  que apunta a:   http://IP_TAILSCALE_MAQUINA_A:30080
//
//  Regla de oro: la IP Tailscale de Juan NUNCA se hardcodea en React.
// ============================================================================
window.APP_CONFIG = {
  API_URL: "http://localhost:3000"
};
