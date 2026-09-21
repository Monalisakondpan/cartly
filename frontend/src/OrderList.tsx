import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'

const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders {
      id
      status
      total
      items {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
`

const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
    updateOrderStatus(orderId: $orderId, input: { status: $status }) {
      id
      status
    }
  }
`

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled']

function OrderList() {
  const { data, loading, error, refetch } = useQuery(MY_ORDERS_QUERY)
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION)

  if (loading) return <p>Loading orders...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>

  const orders = data?.myOrders || []

  const handleStatusChange = async (orderId: string, status: string) => {
    await updateOrderStatus({ variables: { orderId, status } })
    refetch()
  }

  return (
    <div className="card">
      <h2>Orders</h2>

      {orders.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>No orders yet.</p>
      ) : (
        orders.map((order: any) => (
          <div
            key={order.id}
            style={{
              padding: '16px 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <strong>Order #{order.id}</strong>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {order.items.map((item: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  color: 'var(--color-muted)',
                  padding: '2px 0',
                }}
              >
                <span>
                  Product #{item.productId} × {item.quantity}
                </span>
                <span>${(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                marginTop: '8px',
              }}
            >
              <span>Total</span>
              <span>${order.total}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default OrderList