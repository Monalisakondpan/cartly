import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import BackButton from './BackButton'
import SessionIndicator from './SessionIndicator'

const STORES_QUERY = gql`
  query Stores {
    stores {
      id
      name
      slug
      description
    }
  }
`

function ExploreStores() {
  const { data, loading, error } = useQuery(STORES_QUERY)
  const navigate = useNavigate()
  const isCustomerLoggedIn = !!localStorage.getItem('customerToken')
  const isOwnerLoggedIn = !!localStorage.getItem('token')

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerRefreshToken')
    navigate('/explore')
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
          <BackButton to="/" label="Home" />
          {isOwnerLoggedIn && !isCustomerLoggedIn && <BackButton to="/dashboard" label="Back to Dashboard" />}
          {isCustomerLoggedIn && (
            <button className="secondary" onClick={handleCustomerLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '8px' }}>Explore Stores</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '32px' }}>
          Browse stores built on Cartly and find something you like.
        </p>
        {loading ? (
          <p>Loading stores...</p>
        ) : error ? (
          <p style={{ color: 'var(--color-error)' }}>Error: {error.message}</p>
        ) : (data?.stores || []).length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No stores yet. Check back soon!</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {data.stores.map((store: any) => (
              <Link
                key={store.id}
                to={`/store/${store.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card">
                  <h3 style={{ marginBottom: '8px' }}>{store.name}</h3>
                  {store.description && (
                    <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                      {store.description}
                    </p>
                  )}
                  <p style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
                    Visit Store →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExploreStores