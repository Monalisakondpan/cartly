import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import BackButton from './BackButton'

const REQUEST_RESET_MUTATION = gql`
  mutation RequestPasswordReset($emailAddress: String!, $role: String!) {
    requestPasswordReset(emailAddress: $emailAddress, role: $role)
  }
`

function ForgotPassword() {
  const [accountType, setAccountType] = useState<'owner' | 'customer' | 'admin'>('owner')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [requestReset, { loading, error }] = useMutation(REQUEST_RESET_MUTATION)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await requestReset({ variables: { emailAddress: email, role: accountType } })
      setSubmitted(true)
    } catch (err) {
      console.error('Password reset request failed:', err)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center' }}>
        <div className="card">
          <h2>Check Your Email</h2>
          <p style={{ color: 'var(--color-muted)' }}>
            If an account exists with that email, we've sent a password reset link. It will expire in 1 hour.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <BackButton to="/login" label="Back to Login" />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <div className="card" style={{ width: '380px' }}>
          <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
            Enter your email and we'll send you a reset link
          </p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setAccountType('owner')}
              className={accountType === 'owner' ? '' : 'secondary'}
              style={{ flex: 1, fontSize: '13px' }}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={accountType === 'customer' ? '' : 'secondary'}
              style={{ flex: 1, fontSize: '13px' }}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setAccountType('admin')}
              className={accountType === 'admin' ? '' : 'secondary'}
              style={{ flex: 1, fontSize: '13px' }}
            >
              Admin
            </button>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: '16px' }}>
              <label>Email</label>
              <br />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            {error && (
              <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                {error.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword