import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import BackButton from './BackButton'
import { COUNTRIES, DIAL_CODES } from './countries'
import { validatePassword } from './utils/validation'

const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
    $mobileNumber: String!
    $country: String!
    $address: String!
  ) {
    register(
      input: {
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
        mobileNumber: $mobileNumber
        country: $country
        address: $address
      }
    ) {
      id
      email
      role
    }
  }
`

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      refreshToken
    }
  }
`

const REGISTER_CUSTOMER_MUTATION = gql`
  mutation RegisterCustomer($email: String!, $password: String!, $fullName: String!) {
    registerCustomer(input: { email: $email, password: $password, fullName: $fullName }) {
      token
      refreshToken
      customer {
        id
        email
      }
    }
  }
`

type RegisterProps = {
  onLoginSuccess: (token: string) => void
}

function Register({ onLoginSuccess }: RegisterProps) {
  const [accountType, setAccountType] = useState<'seller' | 'customer'>('seller')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')

  const [register, { loading: registering, error: registerError }] = useMutation(REGISTER_MUTATION)
  const [login, { loading: loggingIn }] = useMutation(LOGIN_MUTATION)
  const [registerCustomer, { loading: registeringCustomer, error: registerCustomerError }] = useMutation(REGISTER_CUSTOMER_MUTATION)

  const navigate = useNavigate()

  const handleSellerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError('')

    const passwordIssue = validatePassword(password)
    if (passwordIssue) {
      setValidationError(passwordIssue)
      return
    }

    const dialCode = country ? DIAL_CODES[country] : ''
    const fullMobileNumber = `${dialCode} ${mobileNumber}`.trim()

    try {
      await register({
        variables: {
          email,
          password,
          firstName,
          lastName,
          mobileNumber: fullMobileNumber,
          country,
          address,
        },
      })
      const loginResult = await login({ variables: { email, password } })
      const token = (loginResult.data as any).login.token
      const refreshToken = (loginResult.data as any).login.refreshToken
      localStorage.setItem('refreshToken', refreshToken)
      onLoginSuccess(token)
      navigate('/dashboard')
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  const handleCustomerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError('')

    const passwordIssue = validatePassword(password)
    if (passwordIssue) {
      setValidationError(passwordIssue)
      return
    }

    const fullName = `${firstName} ${lastName}`.trim()

    try {
      const result = await registerCustomer({
        variables: { email, password, fullName },
      })
      const token = (result.data as any).registerCustomer.token
      const refreshToken = (result.data as any).registerCustomer.refreshToken
      localStorage.setItem('customerToken', token)
      localStorage.setItem('customerRefreshToken', refreshToken)
      navigate('/explore')
    } catch (err) {
      console.error('Customer registration failed:', err)
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
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', padding: '0 20px' }}>
        <div className="card" style={{ width: '420px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setAccountType('seller')}
              className={accountType === 'seller' ? '' : 'secondary'}
              style={{ flex: 1 }}
            >
              I'm a Seller
            </button>
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={accountType === 'customer' ? '' : 'secondary'}
              style={{ flex: 1 }}
            >
              I'm a Customer
            </button>
          </div>

          {accountType === 'seller' ? (
            <>
              <h2 style={{ textAlign: 'center' }}>Create Your Seller Account</h2>
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
                You're creating an account to sell — start your own store today
              </p>

              <form onSubmit={handleSellerSubmit} autoComplete="off">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label>First Name</label>
                    <br />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="off"
                      maxLength={255}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <br />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      autoComplete="off"
                      maxLength={255}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
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

                <div style={{ marginBottom: '12px' }}>
                  <label>Country</label>
                  <br />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select --</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label>Mobile Number</label>
                  <br />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '8px 10px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-card)',
                        minWidth: '60px',
                        textAlign: 'center',
                      }}
                    >
                      {country ? DIAL_CODES[country] : '+__'}
                    </span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                      autoComplete="off"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label>Address</label>
                  <br />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                  Must be 8+ characters, with uppercase, lowercase, a number, and a special character.
                </p>

                <button type="submit" disabled={registering || loggingIn} style={{ width: '100%' }}>
                  {registering || loggingIn ? 'Creating account...' : 'Create Account'}
                </button>

                {validationError && (
                  <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                    {validationError}
                  </p>
                )}
                {registerError && (
                  <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                    {registerError.message}
                  </p>
                )}
              </form>
            </>
          ) : (
            <>
              <h2 style={{ textAlign: 'center' }}>Create Your Customer Account</h2>
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '-8px' }}>
                Sign up to shop and track your orders
              </p>

              <form onSubmit={handleCustomerSubmit} autoComplete="off">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label>First Name</label>
                    <br />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="off"
                      maxLength={255}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <br />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      autoComplete="off"
                      maxLength={255}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
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
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                  Must be 8+ characters, with uppercase, lowercase, a number, and a special character.
                </p>

                <button type="submit" disabled={registeringCustomer} style={{ width: '100%' }}>
                  {registeringCustomer ? 'Creating account...' : 'Create Account'}
                </button>

                {validationError && (
                  <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                    {validationError}
                  </p>
                )}
                {registerCustomerError && (
                  <p style={{ color: 'var(--color-error)', marginTop: '10px', fontSize: '14px' }}>
                    {registerCustomerError.message}
                  </p>
                )}
              </form>
            </>
          )}

          <p style={{ marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register