import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'

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

type StoreWithOwner = {
  id: string
  name: string
  slug: string
  ownerEmail: string
  ownerName: string
  productCount: number
  orderCount: number
}
type OwnerWithStats = { id: string; email: string; firstName: string | null; lastName: string | null; country: string | null }
type CustomerWithStats = { id: string; email: string; fullName: string }
type OrderWithDetails = { id: string; storeName: string; customerEmail: string; status: string; total: number }

type ActiveView = 'stores' | 'owners' | 'customers' | 'orders' | null

export default function AdminDashboardScreen() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('stores')

  useEffect(() => {
    AsyncStorage.getItem('adminToken').then((stored) => {
      setToken(stored)
      setTokenLoaded(true)
      if (!stored) router.replace('/admin-login')
    })
  }, [])

  const { data, loading, refetch } = useQuery<{
    platformStats: { totalStores: number; totalOwners: number; totalCustomers: number; totalOrders: number }
    allStores: StoreWithOwner[]
    allOwners: OwnerWithStats[]
    allCustomers: CustomerWithStats[]
    allOrders: OrderWithDetails[]
  }>(PLATFORM_DATA_QUERY, {
    skip: !token,
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  const [adminDeleteStore] = useMutation(ADMIN_DELETE_STORE_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  const handleLogout = async () => {
    await AsyncStorage.removeItem('adminToken')
    await AsyncStorage.removeItem('adminRefreshToken')
    router.replace('/')
  }

  const handleDeleteStore = (storeId: string, storeName: string) => {
    Alert.alert(
      'Delete Store',
      `Delete "${storeName}"? This permanently removes all its products, categories, and orders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(storeId)
            try {
              await adminDeleteStore({ variables: { storeId } })
              refetch()
            } catch (err) {
              Alert.alert('Error', 'Failed to delete store.')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  if (!tokenLoaded || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  const stats = data?.platformStats
  const stores = data?.allStores || []
  const owners = data?.allOwners || []
  const customers = data?.allCustomers || []
  const orders = data?.allOrders || []

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cartly Admin</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, activeView === 'stores' && styles.statCardActive]}
            onPress={() => setActiveView(activeView === 'stores' ? null : 'stores')}
          >
            <Text style={styles.statValue}>{stats?.totalStores}</Text>
            <Text style={styles.statLabel}>Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, activeView === 'owners' && styles.statCardActive]}
            onPress={() => setActiveView(activeView === 'owners' ? null : 'owners')}
          >
            <Text style={styles.statValue}>{stats?.totalOwners}</Text>
            <Text style={styles.statLabel}>Owners</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, activeView === 'customers' && styles.statCardActive]}
            onPress={() => setActiveView(activeView === 'customers' ? null : 'customers')}
          >
            <Text style={styles.statValue}>{stats?.totalCustomers}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, activeView === 'orders' && styles.statCardActive]}
            onPress={() => setActiveView(activeView === 'orders' ? null : 'orders')}
          >
            <Text style={styles.statValue}>{stats?.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>
        </View>

        {activeView === 'stores' && (
          <>
            <Text style={styles.sectionTitle}>All Stores</Text>
            {stores.length === 0 ? (
              <Text style={styles.emptyText}>No stores yet.</Text>
            ) : (
              stores.map((store) => (
                <View key={store.id} style={styles.storeRow}>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeMeta}>/{store.slug} · {store.ownerEmail}</Text>
                    <Text style={styles.storeMeta}>{store.productCount} products · {store.orderCount} orders</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStore(store.id, store.name)}
                    disabled={deletingId === store.id}
                  >
                    {deletingId === store.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {activeView === 'owners' && (
          <>
            <Text style={styles.sectionTitle}>All Owners</Text>
            {owners.length === 0 ? (
              <Text style={styles.emptyText}>No owners yet.</Text>
            ) : (
              owners.map((owner) => (
                <View key={owner.id} style={styles.listRow}>
                  <Text style={styles.listRowTitle}>{owner.email}</Text>
                  <Text style={styles.listRowMeta}>
                    {(owner.firstName || owner.lastName) ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() : 'No name set'}
                    {owner.country ? ` · ${owner.country}` : ''}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        {activeView === 'customers' && (
          <>
            <Text style={styles.sectionTitle}>All Customers</Text>
            {customers.length === 0 ? (
              <Text style={styles.emptyText}>No customers yet.</Text>
            ) : (
              customers.map((customer) => (
                <View key={customer.id} style={styles.listRow}>
                  <Text style={styles.listRowTitle}>{customer.email}</Text>
                  <Text style={styles.listRowMeta}>{customer.fullName}</Text>
                </View>
              ))
            )}
          </>
        )}

        {activeView === 'orders' && (
          <>
            <Text style={styles.sectionTitle}>All Orders</Text>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet.</Text>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View>
                    <Text style={styles.listRowTitle}>Order #{order.id}</Text>
                    <Text style={styles.listRowMeta}>{order.storeName} · {order.customerEmail}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderTotal}>${order.total}</Text>
                    <View style={styles.statusTag}>
                      <Text style={styles.statusTagText}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  logoutText: { color: '#FF6600', fontSize: 14 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statCardActive: { borderColor: '#FF6600', borderWidth: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#FF6600' },
  statLabel: { fontSize: 12, color: '#4A4A4A', marginTop: 4 },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  storeInfo: { flex: 1 },
  storeName: { color: '#111111', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  storeMeta: { color: '#4A4A4A', fontSize: 11 },
  deleteButton: { backgroundColor: '#DC2626', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  deleteButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  listRow: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  listRowTitle: { color: '#111111', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  listRowMeta: { color: '#4A4A4A', fontSize: 12 },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  orderTotal: { color: '#111111', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  statusTag: { backgroundColor: '#FF6600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusTagText: { color: '#FFFFFF', fontSize: 11 },
  emptyText: { color: '#4A4A4A', textAlign: 'center' },
})