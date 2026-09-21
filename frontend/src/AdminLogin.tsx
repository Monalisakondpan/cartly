import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import BackButton from './BackButton'

const LOGIN_ADMIN_MUTATION = gql`
  mutation LoginAdmin($email: String!, $password: String!) {
    loginAdmin(input: { email: $email, password: $password }) {
      token
      refreshToken
      admin {
        id
        email
      }
    }
  }
`

type AdminLoginProps = {
  onLoginSuccess: (token: string) => void
}

function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [login, { loading, error }] = useMutation(LOGIN_ADMIN_MUTATION)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const result = await login({ variables: { email, password } })
      const token = (result.data as any).loginAdmin.token
      const refreshToken = (result.data as any).loginAdmin.refreshToken
      localStorage.setItem('adminRefreshToken', refreshToken)
      onLoginSuccess(token)
      setEmail('')
      setPassword('')
      navigate('/admin')
    } catch (err) {
      console.error('Admin login failed:', err)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <BackButton to="/" label="Home" />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
        <div className="card" style={{ width: '360px' }}>
          <h2 style={{ textAlign: 'center' }}>Admin Login</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
            Platform administration access
          </p>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: '14px' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <br />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Logging in...' : 'Login'}
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

export default AdminLogin