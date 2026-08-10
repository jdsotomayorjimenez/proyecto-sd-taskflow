const VARIANTES = {
  primary: 'btn-primary focus-visible:ring-brand/40',
  secondary:
    'border border-line bg-[var(--glass-bg)] text-ink backdrop-blur hover:brightness-[0.97] focus-visible:ring-brand/30',
  danger:
    'bg-vencida text-white hover:brightness-95 focus-visible:ring-vencida/40',
  ghost:
    'bg-transparent text-muted hover:bg-line/40 hover:text-ink focus-visible:ring-brand/20',
}

const TAMANOS = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-150 focus:outline-none focus-visible:ring-2',
        'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTES[variant],
        TAMANOS[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
