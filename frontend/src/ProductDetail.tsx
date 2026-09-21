import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import BackButton from './BackButton'
import SessionIndicator from './SessionIndicator'

const STORE_BY_SLUG_QUERY = gql`
  query StoreBySlug($slug: String!) {
    storeBySlug(slug: $slug) {
      id
      name
      slug
    }
  }
`

const PRODUCT_BY_SLUG_QUERY = gql`
  query ProductBySlug($storeId: ID!, $slug: String!) {
    productBySlug(storeId: $storeId, slug: $slug) {
      id
      name
      slug
      description
      price
      stockQuantity
      imageUrl
    }
  }
`

function ProductDetail() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const customerToken = localStorage.getItem('customerToken')
  const ownerToken = localStorage.getItem('token')
  const isCustomerLoggedIn = !!customerToken
  const isOwnerLoggedIn = !!ownerToken

  const { data: storeData, loading: storeLoading } = useQuery(STORE_BY_SLUG_QUERY, {
    variables: { slug },
  })
  const store = storeData?.storeBySlug

  const { data: productData, loading: productLoading } = useQuery(PRODUCT_BY_SLUG_QUERY, {
    variables: { storeId: store?.id, slug: productSlug },
    skip: !store,
  })
  const product = productData?.productBySlug

  const refreshCartCount = () => {
    const cartKey = `cart_${slug}`
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]')
    const count = stored.reduce((sum: number, item: any) => sum + item.quantity, 0)
    setCartCount(count)
  }

  useEffect(() => {
    refreshCartCount()
  }, [slug])

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerRefreshToken')
    navigate('/explore')
  }

  if (storeLoading || productLoading)
    return <p style={{ textAlign: 'center', marginTop: '60px' }}>Loading...</p>

  if (!product)
    return <p style={{ textAlign: 'center', marginTop: '60px' }}>Product not found.</p>

  const addItemToCart = () => {
    const cartKey = `cart_${store.slug}`
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]')

    const existingIndex = existingCart.findIndex((item: any) => item.id === product.id)
    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity,
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(existingCart))
    refreshCartCount()
  }

  const handleAddToCart = () => {
    addItemToCart()
    alert(`Added ${quantity} × ${product.name} to cart`)
  }

  const handleBuyNow = () => {
    addItemToCart()
    navigate(`/store/${slug}/checkout`)
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isCustomerLoggedIn && customerToken && <SessionIndicator token={customerToken} />}
          {isOwnerLoggedIn && !isCustomerLoggedIn && ownerToken && <SessionIndicator token={ownerToken} />}
          <Link
            to={`/store/${slug}/cart`}
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '15px',
            }}
          >
            🛍️ Cart
            {cartCount > 0 && (
              <span
                style={{
                  background: 'white',
                  color: 'var(--color-primary)',
                  borderRadius: '999px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <div
          className="card"
          style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}
        >
          <div style={{ flex: '1 1 300px' }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '300px',
                  background: 'var(--color-border)',
                  borderRadius: '8px',
                }}
              />
            )}
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '8px' }}>
              <Link to={`/store/${slug}`} style={{ color: 'var(--color-muted)' }}>{store.name}</Link>
              {' / '}{product.name}
            </p>
            <h1 style={{ marginBottom: '8px' }}>{product.name}</h1>
            <p
              style={{
                fontSize: '28px',
                color: 'var(--color-primary)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              ${product.price}
            </p>
            {product.description && (
              <p style={{ color: 'var(--color-muted)', marginBottom: '20px' }}>
                {product.description}
              </p>
            )}
            <p style={{ marginBottom: '20px', fontSize: '14px' }}>
              {product.stockQuantity > 0
                ? `${product.stockQuantity} in stock`
                : 'Out of stock'}
            </p>

            {product.stockQuantity > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label>Quantity:</label>
                  <br />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        fontSize: '18px',
                        borderRadius: '8px 0 0 8px',
                      }}
                    >
                      −
                    </button>
                    <div
                      style={{
                        width: '48px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--color-border)',
                        borderLeft: 'none',
                        borderRight: 'none',
                        fontSize: '15px',
                      }}
                    >
                      {quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        fontSize: '18px',
                        borderRadius: '0 8px 8px 0',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleAddToCart} style={{ flex: 1 }}>Add to Cart</button>
                  <button onClick={handleBuyNow} className="secondary" style={{ flex: 1 }}>Buy Now</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail