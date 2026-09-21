import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image } from 'react-native'

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
      price
      stockQuantity
      imageUrl
    }
  }
`

type Store = { id: string; name: string; slug: string; description: string | null }
type Product = { id: string; name: string; slug: string; price: number; stockQuantity: number; imageUrl: string | null }

export default function StorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const { data: storeData, loading: storeLoading } = useQuery<{ storeBySlug: Store }>(STORE_BY_SLUG_QUERY, {
    variables: { slug },
  })
  const store = storeData?.storeBySlug

  const { data: productsData, loading: productsLoading } = useQuery<{ products: Product[] }>(PRODUCTS_QUERY, {
    variables: { storeId: store?.id },
    skip: !store,
  })

  if (storeLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Store not found.</Text>
      </View>
    )
  }

  const products = productsData?.products || []

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.description && <Text style={styles.storeDescription}>{store.description}</Text>}
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push(`/store/${slug}/cart` as any)}
        >
          <Text style={styles.cartButtonText}>🛍️ Cart</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Products</Text>

        {productsLoading ? (
          <ActivityIndicator size="small" color="#FF6600" />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push(`/store/${slug}/product/${item.slug}` as any)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price}</Text>
                <Text style={styles.stockText}>
                  {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No products yet.</Text>}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  storeHeader: { flex: 1 },
  storeName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  storeDescription: { fontSize: 12, color: '#F9F9F9' },
  cartButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cartButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12 },
  list: { paddingBottom: 40 },
  row: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E5E5',
    borderRadius: 6,
    marginBottom: 8,
  },
  productName: { fontSize: 14, fontWeight: '700', color: '#111111', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#FF6600', marginBottom: 4 },
  stockText: { fontSize: 11, color: '#4A4A4A' },
  emptyText: { color: '#4A4A4A', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#DC2626', textAlign: 'center' },
})