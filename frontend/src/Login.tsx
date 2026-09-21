import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import BackButton from './BackButton'

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      refreshToken
      user {
        id
        email
        role
      }
    }
  }
`

const LOGIN_CUSTOMER_MUTATION = gql`
  mutation LoginCustomer($email: String!, $password: String!) {
    loginCustomer(input: { email: $email, password: $password }) {
      token
      refreshToken
      customer {
        id
        email
      }
    }
  }
`

type LoginProps = {
  onLoginSuccess: (token: string) => void
}

function Login({ onLoginSuccess }: LoginProps) {
  const [accountType, setAccountType] = useState<'seller' | 'customer'>('seller')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION)
  const [loginCustomer, { loading: loadingCustomer, error: customerError }] = useMutation(LOGIN_CUSTOMER_MUTATION)
  const navigate = useNavigate()

  const handleSellerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const result = await login({ variables: { email, password } })
      const token = result.data.login.token
      const refreshToken = result.data.login.refreshToken
      localStorage.setItem('refreshToken', refreshToken)
      onLoginSuccess(token)
      setEmail('')
      setPassword('')
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleCustomerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const result = await loginCustomer({ variables: { email, password } })
      const token = (result.data as any).loginCustomer.token
      const refreshToken = (result.data as any).loginCustomer.refreshToken
      localStorage.setItem('customerToken', token)
      localStorage.setItem('customerRefreshToken', refreshToken)
      setEmail('')
      setPassword('')
      navigate('/explore')
    } catch (err) {
      console.error('Customer login failed:', err)
    }
  }

  return (
    <div>
      <nav
        style={{
          background: 'var(--color-nav)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <img src="/logo.jpg" alt="Cartly" style={{ height: '32px', borderRadius: '4px' }} />
          Cartly
        </h1>
        <BackButton to="/" label="Home" />
      </nav>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px',
          padding: '0 20px',
        }}
      >
        <div className="card" style={{ width: '360px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setAccountType('seller')}
              className={accountType === 'seller' ? '' : 'secondary'}
              style={{ flex: 1 }}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={accountType === 'customer' ? '' : 'secondary'}
              style={{ flex: 1 }}
            >
              Customer
            </button>
          </div>

          <h2 style={{ textAlign: 'center' }}>Welcome Back</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
            {accountType === 'seller' ? 'Log in to manage your store' : 'Log in to shop and track orders'}
          </p>
          <form onSubmit={accountType === 'seller' ? handleSellerSubmit : handleCustomerSubmit} autoComplete="off">
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
            <div style={{ marginBottom: '8px' }}>
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
            <p style={{ textAlign: 'right', marginBottom: '12px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px' }}>Forgot Password?</Link>
            </p>
            <button type="submit" disabled={loading || loadingCustomer} style={{ width: '100%' }}>
              {loading || loadingCustomer ? 'Logging in...' : 'Login'}
            </button>
            {(error || customerError) && (
              <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                {(error || customerError)?.message}
              </p>
            )}
          </form>
          <p style={{ marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login