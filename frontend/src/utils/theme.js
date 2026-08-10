// Cambia entre modo claro y oscuro. El tema vive como data-theme en <html>
// y se guarda en localStorage para que se recuerde entre visitas.
export function toggleTheme() {
  const actual = document.documentElement.dataset.theme || 'light'
  const nuevo = actual === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = nuevo
  try {
    localStorage.setItem('taskflow_theme', nuevo)
  } catch {
    /* ignora */
  }
  return nuevo
}
