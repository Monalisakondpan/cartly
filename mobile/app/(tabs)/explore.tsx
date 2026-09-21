import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

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

type Store = {
  id: string
  name: string
  slug: string
  description: string | null
}

type StoresData = {
  stores: Store[]
}

export default function ExploreStoresScreen() {
  const router = useRouter()
  const { data, loading, error } = useQuery<StoresData>(STORES_QUERY)

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore Stores</Text>
          <Text style={styles.headerSubtitle}>Browse stores built on Cartly</Text>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.list}
        data={data?.stores || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/store/${item.slug}` as any)}>
            <Text style={styles.storeName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.storeDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stores yet. Check back soon!</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/terms' as any)}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/admin-login' as any)}>
              <Text style={styles.footerLink}>Admin</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#F9F9F9',
  },
  loginButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: { flex: 1, paddingHorizontal: 20 },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 13,
    color: '#4A4A4A',
  },
  emptyText: {
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  footerLink: {
    color: '#4A4A4A',
    fontSize: 12,
  },
})