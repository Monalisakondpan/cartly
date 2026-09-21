import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
      description
    }
  }
`

const PRODUCTS_QUERY = gql`
  query Products($storeId: ID!) {
    products(storeId: $storeId) {
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

function Storefront() {
  const { slug } = useParams<{ slug: string }>()
  const [cartCount, setCartCount] = useState(0)
  const customerToken = localStorage.getItem('customerToken')
  const ownerToken = localStorage.getItem('token')
  const isCustomerLoggedIn = !!customerToken
  const isOwnerLoggedIn = !!ownerToken

  const { data: storeData, loading: storeLoading, error: storeError } = useQuery(
    STORE_BY_SLUG_QUERY,
    { variables: { slug } }
  )
  const store = storeData?.storeBySlug

  const { data: productsData, loading: productsLoading } = useQuery(PRODUCTS_QUERY, {
    variables: { storeId: store?.id },
    skip: !store,
  })

  useEffect(() => {
    const cartKey = `cart_${slug}`
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]')
    const count = stored.reduce((sum: number, item: any) => sum + item.quantity, 0)
    setCartCount(count)
  }, [slug])

  if (storeLoading) return <p style={{ textAlign: 'center', marginTop: '60px' }}>Loading store...</p>
  if (storeError || !store)
    return <p style={{ textAlign: 'center', marginTop: '60px' }}>Store not found.</p>

  const products = productsData?.products || []

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
          <BackButton to="/" label="Home" />
          <BackButton to="/explore" label="Explore Stores" />
          {isOwnerLoggedIn && !isCustomerLoggedIn && <BackButton to="/dashboard" label="Back to Dashboard" />}
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
          {isCustomerLoggedIn && (
            <button className="secondary" onClick={() => {
              localStorage.removeItem('customerToken')
              localStorage.removeItem('customerRefreshToken')
              window.location.href = '/explore'
            }}>
              Logout
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="card" style={{ marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>{store.name}</h1>
          {store.description && (
            <p style={{ color: 'var(--color-muted)' }}>{store.description}</p>
          )}
        </div>

        <h2 style={{ marginBottom: '20px' }}>Products</h2>

        {productsLoading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No products yet.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {products.map((product: any) => (
              <Link
                key={product.id}
                to={`/store/${slug}/product/${product.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ position: 'relative' }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '220px',
                          background: 'var(--color-border)',
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: product.stockQuantity > 0 ? 'var(--color-success)' : 'var(--color-error)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {product.stockQuantity > 0
                        ? product.stockQuantity <= 5
                          ? 'Low Stock'
                          : 'In Stock'
                        : 'Out of Stock'}
                    </span>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{product.name}</h3>
                    <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 700, fontSize: '20px' }}>
                      ${product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Storefront