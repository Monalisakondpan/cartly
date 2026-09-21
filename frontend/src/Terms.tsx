import { Link } from 'react-router-dom'
import BackButton from './BackButton'

function Terms() {
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
        <h1 style={{ marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '32px' }}>
          Last updated: July 2026
        </p>

        <div className="card">
          <h3>1. Acceptance of Terms</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            By creating an account or using Cartly, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the platform.
          </p>

          <h3>2. Use of Service</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Cartly provides tools for creating and managing online stores. You are responsible for the
            accuracy of the content you upload, including product listings, pricing, and descriptions.
            You agree not to use the platform for any unlawful purpose or to sell prohibited items.
          </p>

          <h3>3. Accounts</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            You are responsible for maintaining the confidentiality of your account credentials and for
            all activities that occur under your account. Notify us immediately of any unauthorized use.
          </p>

          <h3>4. Orders & Payments</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Store owners are solely responsible for fulfilling orders placed through their storefronts.
            Cartly does not process payments on behalf of sellers or buyers in this version of the platform.
          </p>

          <h3>5. Termination</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            We reserve the right to suspend or terminate accounts that violate these terms, engage in
            fraudulent activity, or misuse the platform in any way that harms other users.
          </p>

          <h3>6. Limitation of Liability</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            Cartly is provided "as is" without warranties of any kind. We are not liable for any indirect,
            incidental, or consequential damages arising from your use of the platform.
          </p>

          <h3>7. Changes to Terms</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.7 }}>
            We may update these Terms from time to time. Continued use of Cartly after changes constitutes
            acceptance of the revised terms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms