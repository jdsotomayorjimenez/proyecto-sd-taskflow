import Modal from './Modal.jsx'
import Button from './Button.jsx'

/** Dialogo de confirmacion (por defecto para acciones destructivas). */
export default function ConfirmModal({
  abierto,
  onCerrar,
  onConfirmar,
  titulo = 'Confirmar',
  mensaje,
  textoConfirmar = 'Eliminar',
  variante = 'danger',
  procesando = false,
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant={variante} onClick={onConfirmar} disabled={procesando}>
            {procesando ? 'Procesando...' : textoConfirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{mensaje}</p>
    </Modal>
  )
}
