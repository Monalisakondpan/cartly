import { Link } from 'react-router-dom'

type BackButtonProps = {
  to: string
  label?: string
}

function BackButton({ to, label = 'Back' }: BackButtonProps) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <button
        type="button"
        className="secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          padding: '6px 14px',
        }}
      >
        <span style={{ fontSize: '16px' }}>←</span>
        {label}
      </button>
    </Link>
  )
}

export default BackButton