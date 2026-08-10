import '@testing-library/jest-dom'

// localStorage sencillo en memoria para el entorno de pruebas (jsdom ya lo trae,
// pero garantizamos un estado limpio entre archivos de test).
beforeEach(() => {
  localStorage.clear()
})
