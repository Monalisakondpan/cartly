import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import BackButton from './BackButton'
import SessionIndicator from './SessionIndicator'

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

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($storeId: ID!, $items: [OrderItemInput!]!, $idempotencyKey: String) {
    createOrder(input: { storeId: $storeId, items: $items, idempotencyKey: $idempotencyKey }) {
      id
      status
      total
    }
  }
`

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string | null
}

function Checkout() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const ownerToken = localStorage.getItem('token')
  const isOwnerLoggedIn = !!ownerToken

  const [items, setItems] = useState<CartItem[]>([])
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [customerToken, setCustomerToken] = useState<string | null>(
    localStorage.getItem('customerToken')
  )
  const [orderResult, setOrderResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const cartKey = `cart_${slug}`

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]')
    setItems(stored)
  }, [cartKey])

  const [registerCustomer, { loading: registering }] = useMutation(REGISTER_CUSTOMER_MUTATION)
  const [loginCustomer, { loading: loggingIn }] = useMutation(LOGIN_CUSTOMER_MUTATION)
  const [createOrder, { loading: ordering }] = useMutation(CREATE_ORDER_MUTATION)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      if (mode === 'register') {
        const result = await registerCustomer({
          variables: { email, password, fullName },
        })
        const token = (result.data as any).registerCustomer.token
        const refreshToken = (result.data as any).registerCustomer.refreshToken
        localStorage.setItem('customerToken', token)
        localStorage.setItem('customerRefreshToken', refreshToken)
        setCustomerToken(token)
      } else {
        const result = await loginCustomer({
          variables: { email, password },
        })
        const token = (result.data as any).loginCustomer.token
        const refreshToken = (result.data as any).loginCustomer.refreshToken
        localStorage.setItem('customerToken', token)
        localStorage.setItem('customerRefreshToken', refreshToken)
        setCustomerToken(token)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handlePlaceOrder = async () => {
    setErrorMsg('')
    const idempotencyKey = sessionStorage.getItem(`idempotency_${cartKey}`) || crypto.randomUUID()
    sessionStorage.setItem(`idempotency_${cartKey}`, idempotencyKey)
    try {
      const storeRes = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { storeBySlug(slug: "${slug}") { id } }`,
        }),
      })
      const storeJson = await storeRes.json()
      const storeId = storeJson.data.storeBySlug.id

      const result = await createOrder({
        variables: {
          storeId,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          idempotencyKey,
        },
        context: {
          headers: {
            authorization: `Bearer ${customerToken}`,
          },
        },
      })
      setOrderResult((result.data as any).createOrder)
      localStorage.removeItem(cartKey)
      sessionStorage.removeItem(`idempotency_${cartKey}`)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerRefreshToken')
    navigate('/explore')
  }

  if (orderResult) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
        <div className="card">
          <h2>Order Placed!</h2>
          <p>Order #{orderResult.id}</p>
          <p>Total: ${orderResult.total}</p>
          <p>Status: {orderResult.status}</p>
          <Link to={`/store/${slug}`}>
            <button>Back to Store</button>
          </Link>
        </div>
      </div>
    )
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="Cartly" style={{ height: '36px', borderRadius: '4px' }} />
            Cartly
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {customerToken && <SessionIndicator token={customerToken} />}
          {isOwnerLoggedIn && !customerToken && ownerToken && <SessionIndicator token={ownerToken} />}
          <BackButton to={`/store/${slug}/cart`} label="Back to cart" />
          <BackButton to="/explore" label="Explore Stores" />
          {isOwnerLoggedIn && !customerToken && <BackButton to="/dashboard" label="Back to Dashboard" />}
          {customerToken && (
            <button className="secondary" onClick={handleCustomerLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <h1>Checkout</h1>

        <div className="card">
          <h3>Order Summary</h3>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} width="44" height="44" style={{ borderRadius: '6px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: 'var(--color-border)' }} />
              )}
              <span style={{ flex: 1 }}>{item.name} x {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '10px',
              fontWeight: 700,
              marginTop: '10px',
            }}
          >
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {!customerToken ? (
          <div className="card">
            <h3>{mode === 'login' ? 'Log In' : 'Create Your Customer Account'}</h3>
            {mode === 'register' && (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '-8px', marginBottom: '12px' }}>
                You're creating a customer account to complete this purchase
              </p>
            )}
            <form onSubmit={handleAuth} autoComplete="off">
              {mode === 'register' && (
                <div style={{ marginBottom: '12px' }}>
                  <label>Full Name</label>
                  <br />
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="off"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
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
              <div style={{ marginBottom: '16px' }}>
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
              <button type="submit" disabled={registering || loggingIn} style={{ width: '100%' }}>
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>
            <p style={{ marginTop: '12px', fontSize: '14px' }}>
              {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
              <button
                type="button"
                className="secondary"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{ padding: '2px 10px', fontSize: '13px' }}
              >
                {mode === 'login' ? 'Create one' : 'Log in'}
              </button>
            </p>
          </div>
        ) : (
          <div className="card">
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '10px' }}>
              Logged in as <strong>{email || 'customer'}</strong>
            </p>
            <button onClick={handlePlaceOrder} disabled={ordering} style={{ width: '100%' }}>
              {ordering ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        )}

        {errorMsg && (
          <p style={{ color: 'var(--color-error)', marginTop: '12px' }}>{errorMsg}</p>
        )}
      </div>
    </div>
  )
}

export default Checkout