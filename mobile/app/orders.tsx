import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useFocusEffect } from 'expo-router'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'

const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders {
      id
      status
      total
      items {
        id
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

type OrderItem = { id: string; productId: string; quantity: number; priceAtPurchase: number }
type Order = { id: string; status: string; total: number; items: OrderItem[] }

export default function OrdersScreen() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoaded, setTokenLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('token').then((stored) => {
      setToken(stored)
      setTokenLoaded(true)
      if (!stored) router.replace('/login')
    })
  }, [])

  const { data, loading, refetch } = useQuery<{ myOrders: Order[] }>(MY_ORDERS_QUERY, {
    skip: !token,
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  useFocusEffect(
    useCallback(() => {
      if (token) refetch()
    }, [token])
  )

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateStatus({ variables: { orderId, status } })
      refetch()
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  if (!tokenLoaded || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  const orders = data?.myOrders || []

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
      <FlatList
        style={styles.container}
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>Order #{item.id}</Text>
            {item.items.map((li) => (
              <Text key={li.id} style={styles.itemText}>
                Product #{li.productId} × {li.quantity} — ${(li.priceAtPurchase * li.quantity).toFixed(2)}
              </Text>
            ))}
            <Text style={styles.totalText}>Total: ${item.total}</Text>

            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, item.status === status && styles.statusButtonActive]}
                  onPress={() => handleStatusChange(item.id, status)}
                >
                  <Text
                    style={[styles.statusButtonText, item.status === status && styles.statusButtonTextActive]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#111111',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  list: { paddingTop: 16, paddingBottom: 40 },
  orderCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  orderTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 8 },
  itemText: { fontSize: 13, color: '#4A4A4A', marginBottom: 4 },
  totalText: { fontSize: 14, fontWeight: '700', color: '#111111', marginTop: 8, marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statusButtonActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  statusButtonText: { color: '#4A4A4A', fontSize: 11 },
  statusButtonTextActive: { color: '#FFFFFF', fontWeight: '700' },
  emptyText: { color: '#4A4A4A', textAlign: 'center', marginTop: 40 },
})