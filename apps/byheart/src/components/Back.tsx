interface BackProps {
  to: string
  onClick: () => void
}

export const Back = ({ to, onClick }: BackProps) => (
  <button type="button" className="back" onClick={onClick} aria-label={`Back to ${to}`}>
    <svg viewBox="0 0 6 10" aria-hidden="true">
      <path d="M5 1 1 5l4 4" />
    </svg>
    <span>{to}</span>
  </button>
)
