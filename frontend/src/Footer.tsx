import { Link } from 'react-router-dom'

function Footer() {
  const handleSocialClick = (platform: string) => {
    alert(`${platform} page coming soon!`)
  }

  return (
    <footer
      style={{
        background: 'var(--color-nav)',
        padding: '48px 20px 24px',
        marginTop: '60px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '32px',
        }}
      >
        <div>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '12px' }}>Cartly</h3>
          <Link to="/register" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Start for free
          </Link>
          <Link to="/store/mona-shop" style={{ display: 'block', color: '#cccccc', fontSize: '14px', textDecoration: 'none' }}>
            Demo Store
          </Link>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '12px' }}>Resources</h3>
          <a href="#why" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Guides
          </a>
          <a href="#products" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Features
          </a>
          <a href="#pricing" style={{ display: 'block', color: '#cccccc', fontSize: '14px', textDecoration: 'none' }}>
            Pricing
          </a>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '12px' }}>Support</h3>
          <Link to="/login" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Log In
          </Link>
          <Link to="/register" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Sign Up
          </Link>
          <Link to="/terms" style={{ display: 'block', color: '#cccccc', fontSize: '14px', marginBottom: '8px', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link to="/privacy" style={{ display: 'block', color: '#cccccc', fontSize: '14px', textDecoration: 'none' }}>
            Privacy
          </Link>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '12px' }}>Follow Us</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <svg onClick={() => handleSocialClick('Facebook')} style={{ cursor: 'pointer' }} width="20" height="20" viewBox="0 0 24 24" fill="#cccccc">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
            <svg onClick={() => handleSocialClick('Instagram')} style={{ cursor: 'pointer' }} width="20" height="20" viewBox="0 0 24 24" fill="#cccccc">
              <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.065.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.637-.248 1.363-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm0 8.25a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5zm5.25-8.9a1.17 1.17 0 100-2.34 1.17 1.17 0 000 2.34z"/>
            </svg>
            <svg onClick={() => handleSocialClick('X')} style={{ cursor: 'pointer' }} width="20" height="20" viewBox="0 0 24 24" fill="#cccccc">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <svg onClick={() => handleSocialClick('YouTube')} style={{ cursor: 'pointer' }} width="20" height="20" viewBox="0 0 24 24" fill="#cccccc">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z"/>
            </svg>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1100px',
          margin: '32px auto 0',
          paddingTop: '20px',
          borderTop: '1px solid #333333',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
          © 2026 Cartly. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer