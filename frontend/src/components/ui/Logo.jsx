// Marca de TaskFlow: un reloj sencillo que hereda el color del contenedor
// (currentColor), pensado para ir dentro del chip rojo de la app.
export default function Logo({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12V7" />
      <path d="M12 12l3.6 2.6" />
    </svg>
  )
}
