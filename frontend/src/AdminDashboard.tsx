import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import BackButton from './BackButton'
import SessionIndicator from './SessionIndicator'

const PLATFORM_DATA_QUERY = gql`
  query PlatformData {
    platformStats {
      totalStores
      totalOwners
      totalCustomers
      totalOrders
    }
    allStores {
      id
      name
      slug
      ownerEmail
      ownerName
      productCount
      orderCount
    }
    allOwners {
      id
      email
      firstName
      lastName
      country
    }
    allCustomers {
      id
      email
      fullName
    }
    allOrders {
      id
      storeName
      customerEmail
      status
      total
    }
  }
`

const ADMIN_DELETE_STORE_MUTATION = gql`
  mutation AdminDeleteStore($storeId: ID!) {
    adminDeleteStore(storeId: $storeId)
  }
`

type AdminDashboardProps = {
  onLogout: () => void
}

type ActiveView = 'stores' | 'owners' | 'customers' | 'orders' | null

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const adminToken = localStorage.getItem('adminToken')
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<ActiveView>('stores')

  const { data, loading, error, refetch } = useQuery(PLATFORM_DATA_QUERY, {
    context: {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    },
  })

  const [adminDeleteStore] = useMutation(ADMIN_DELETE_STORE_MUTATION, {
    context: {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    },
  })

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    const confirmed = window.confirm(
      `Delete "${storeName}"? This permanently removes all its products, categories, and orders. This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(storeId)
    try {
      await adminDeleteStore({ variables: { storeId } })
      refetch()
    } catch (err) {
      console.error('Failed to delete store:', err)
      alert('Failed to delete store.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '60px' }}>Loading platform data...</p>
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '60px' }}>Error: {error.message}</p>

  const stats = data?.platformStats
  const stores = data?.allStores || []
  const owners = data?.allOwners || []
  const customers = data?.allCustomers || []
  const orders = data?.allOrders || []

  const cardStyle = (view: ActiveView) => ({
    textAlign: 'center' as const,
    cursor: 'pointer',
    border: activeView === view ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
  })

  return (
    <div>
      <header
        style={{
          background: 'var(--color-nav)',
          color: 'white',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ color: 'white', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.jpg" alt="Cartly" style={{ height: '36px', borderRadius: '4px' }} />
          Cartly Admin
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {adminToken && <SessionIndicator token={adminToken} />}
          <BackButton to="/" label="Home" />
          <button className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        <h2 style={{ marginBottom: '16px' }}>Platform Overview</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div className="card" style={cardStyle('stores')} onClick={() => setActiveView(activeView === 'stores' ? null : 'stores')}>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
              {stats?.totalStores}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Stores</p>
          </div>
          <div className="card" style={cardStyle('owners')} onClick={() => setActiveView(activeView === 'owners' ? null : 'owners')}>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
              {stats?.totalOwners}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Owners</p>
          </div>
          <div className="card" style={cardStyle('customers')} onClick={() => setActiveView(activeView === 'customers' ? null : 'customers')}>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
              {stats?.totalCustomers}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Customers</p>
          </div>
          <div className="card" style={cardStyle('orders')} onClick={() => setActiveView(activeView === 'orders' ? null : 'orders')}>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
              {stats?.totalOrders}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Orders</p>
          </div>
        </div>

        {activeView === 'stores' && (
          <>
            <h2 style={{ marginBottom: '16px' }}>All Stores</h2>
            <div className="card">
              {stores.length === 0 ? (
                <p style={{ color: 'var(--color-muted)' }}>No stores yet.</p>
              ) : (
                stores.map((store: any) => (
                  <div
                    key={store.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong>{store.name}</strong>
                      <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        /{store.slug} · Owner: {store.ownerEmail} ({store.ownerName.trim() || 'No name set'})
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        {store.productCount} products · {store.orderCount} orders
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStore(store.id, store.name)}
                      disabled={deletingId === store.id}
                      style={{ background: 'var(--color-error)' }}
                    >
                      {deletingId === store.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeView === 'owners' && (
          <>
            <h2 style={{ marginBottom: '16px' }}>All Owners</h2>
            <div className="card">
              {owners.length === 0 ? (
                <p style={{ color: 'var(--color-muted)' }}>No owners yet.</p>
              ) : (
                owners.map((owner: any) => (
                  <div
                    key={owner.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <strong>{owner.email}</strong>
                    <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                      {(owner.firstName || owner.lastName)
                        ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
                        : 'No name set'}
                      {owner.country && ` · ${owner.country}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeView === 'customers' && (
          <>
            <h2 style={{ marginBottom: '16px' }}>All Customers</h2>
            <div className="card">
              {customers.length === 0 ? (
                <p style={{ color: 'var(--color-muted)' }}>No customers yet.</p>
              ) : (
                customers.map((customer: any) => (
                  <div
                    key={customer.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <strong>{customer.email}</strong>
                    <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                      {customer.fullName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeView === 'orders' && (
          <>
            <h2 style={{ marginBottom: '16px' }}>All Orders</h2>
            <div className="card">
              {orders.length === 0 ? (
                <p style={{ color: 'var(--color-muted)' }}>No orders yet.</p>
              ) : (
                orders.map((order: any) => (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong>Order #{order.id}</strong>
                      <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        {order.storeName} · {order.customerEmail}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>${order.total}</div>
                      <span className="tag">{order.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard