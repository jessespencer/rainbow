interface BackProps {
  to: string
  label: string
  onClick: () => void
}

export const Back = ({ to, label, onClick }: BackProps) => (
  <button type="button" className="back" onClick={onClick} aria-label={label}>
    <svg viewBox="0 0 6 10" aria-hidden="true">
      <path d="M5 1 1 5l4 4" />
    </svg>
    <span>{to}</span>
  </button>
)
