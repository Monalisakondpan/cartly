
import { Link } from 'react-router-dom'
import BackButton from './BackButton'

function Privacy() {
  return (
    <div>
      <nav
        style={{
          background: 'var(--color-nav)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="Cartly" style={{ height: '36px', borderRadius: '4px' }} />
            Cartly
          </h1>
        </Link>
        <BackButton to="/" label="Home" />
      </nav>

      <div style={{ maxWidth: '750px', margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '32px' }}>
          Last updated: July 2026
        </p>

        <div className="card">
          <h3>1. Information We Collect</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            We collect information you provide directly, such as your name, email, mobile number,
            address, and store details when you register as an owner or customer.
          </p>

          <h3>2. How We Use Information</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Your information is used to operate your account, process orders, communicate with you
            about your store or purchases, and improve the platform.
          </p>

          <h3>3. Data Storage</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Passwords are hashed and never stored in plain text. Order and account data is stored
            securely in our database and is not sold or shared with third parties for marketing purposes.
          </p>

          <h3>4. Cookies & Local Storage</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Cartly uses browser local storage to keep you logged in and to remember items in your cart.
            This data stays on your device and is not transmitted to third parties.
          </p>

          <h3>5. Your Rights</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            You may request access to, correction of, or deletion of your personal data at any time by
            contacting us or using the account deletion options available in your dashboard.
          </p>

          <h3>6. Changes to This Policy</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            We may update this Privacy Policy periodically. Continued use of Cartly after changes
            constitutes acceptance of the revised policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy