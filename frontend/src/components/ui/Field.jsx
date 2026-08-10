// Primitivas de formulario: Field (etiqueta + control), Input, Textarea, Select.

const baseControl =
  'input-glass w-full rounded-xl px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand/30 ' +
  'focus:border-brand/60 transition'

export function Field({ label, htmlFor, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-vencida">{error}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={[baseControl, className].join(' ')} {...props} />
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={[baseControl, 'resize-none', className].join(' ')}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={[baseControl, 'cursor-pointer', className].join(' ')} {...props}>
      {children}
    </select>
  )
}
