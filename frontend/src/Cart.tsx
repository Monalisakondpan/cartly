import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import BackButton from './BackButton'
import SessionIndicator from './SessionIndicator'

type CartItem = {
  id: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

function Cart() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<CartItem[]>([])
  const customerToken = localStorage.getItem('customerToken')
  const ownerToken = localStorage.getItem('token')
  const isCustomerLoggedIn = !!customerToken
  const isOwnerLoggedIn = !!ownerToken

  const cartKey = `cart_${slug}`

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]')
    setItems(stored)
  }, [cartKey])

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems)
    localStorage.setItem(cartKey, JSON.stringify(newItems))
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
    updateCart(newItems)
  }

  const handleRemove = (id: string) => {
    const newItems = items.filter((item) => item.id !== id)
    updateCart(newItems)
  }

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerRefreshToken')
    navigate('/explore')
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
          {isCustomerLoggedIn && customerToken && <SessionIndicator token={customerToken} />}
          {isOwnerLoggedIn && !isCustomerLoggedIn && ownerToken && <SessionIndicator token={ownerToken} />}
          <BackButton to={`/store/${slug}`} label="Back to store" />
          <BackButton to="/explore" label="Explore Stores" />
          {isOwnerLoggedIn && !isCustomerLoggedIn && <BackButton to="/dashboard" label="Back to Dashboard" />}
          {isCustomerLoggedIn && (
            <button className="secondary" onClick={handleCustomerLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        <h1>Your Cart</h1>

        {items.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>Your cart is empty.</p>
        ) : (
          <>
            <div className="card">
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width="60"
                      height="60"
                      style={{ borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        background: 'var(--color-border)',
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
                      ${item.price} each
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, Number(e.target.value))
                    }
                    style={{ width: '60px' }}
                  />
                  <button className="secondary" onClick={() => handleRemove(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Link to={`/store/${slug}/checkout`}>
              <button style={{ marginTop: '20px', width: '100%' }}>
                Proceed to Checkout
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart