import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import BackButton from './BackButton'
import { validatePassword } from './utils/validation'

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState(false)

  const [resetPassword, { loading, error }] = useMutation(RESET_PASSWORD_MUTATION)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    const passwordIssue = validatePassword(newPassword)
    if (passwordIssue) {
      setValidationError(passwordIssue)
      return
    }

    try {
      await resetPassword({ variables: { token, newPassword } })
      setSuccess(true)
    } catch (err) {
      console.error('Password reset failed:', err)
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center' }}>
        <div className="card">
          <h2>Invalid Link</h2>
          <p style={{ color: 'var(--color-muted)' }}>This password reset link is missing a token.</p>
          <Link to="/login">
            <button>Back to Login</button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center' }}>
        <div className="card">
          <h2>Password Reset!</h2>
          <p style={{ color: 'var(--color-muted)' }}>Your password has been updated successfully.</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <BackButton to="/" label="Home" />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <div className="card" style={{ width: '380px' }}>
          <h2 style={{ textAlign: 'center' }}>Set New Password</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
            Choose a new password for your account
          </p>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: '12px' }}>
              <label>New Password</label>
              <br />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ width: '100%', paddingRight: '36px' }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label>Confirm Password</label>
              <br />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ width: '100%' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px' }}>
              Must be 8+ characters, with uppercase, lowercase, a number, and a special character.
            </p>

            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            {validationError && (
              <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                {validationError}
              </p>
            )}
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

export default ResetPassword