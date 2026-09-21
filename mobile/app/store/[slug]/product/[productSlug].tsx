import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'

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

type Store = { id: string; name: string; slug: string }
type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stockQuantity: number
  imageUrl: string | null
}

export default function ProductDetailScreen() {
  const { slug, productSlug } = useLocalSearchParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  const { data: storeData, loading: storeLoading } = useQuery<{ storeBySlug: Store }>(STORE_BY_SLUG_QUERY, {
    variables: { slug },
  })
  const store = storeData?.storeBySlug

  const { data: productData, loading: productLoading } = useQuery<{ productBySlug: Product }>(
    PRODUCT_BY_SLUG_QUERY,
    {
      variables: { storeId: store?.id, slug: productSlug },
      skip: !store,
    }
  )
  const product = productData?.productBySlug

  if (storeLoading || productLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    )
  }

  const addItemToCart = async () => {
    const cartKey = `cart_${slug}`
    const existingRaw = await AsyncStorage.getItem(cartKey)
    const existingCart = existingRaw ? JSON.parse(existingRaw) : []

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

    await AsyncStorage.setItem(cartKey, JSON.stringify(existingCart))
  }

  const handleAddToCart = async () => {
    await addItemToCart()
    Alert.alert('Added to Cart', `${quantity} × ${product.name} added to cart`)
  }

  const handleBuyNow = async () => {
    await addItemToCart()
    router.push(`/store/${slug}/checkout` as any)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{store?.name}</Text>
      </View>
      <ScrollView style={styles.container}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        <View style={styles.content}>
          <Text style={styles.breadcrumb}>{store?.name} / {product.name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${product.price}</Text>

          {product.description && <Text style={styles.description}>{product.description}</Text>}

          <Text style={styles.stock}>
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
          </Text>

          {product.stockQuantity > 0 && (
            <>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#111111',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  container: { flex: 1 },
  image: { width: '100%', height: 280 },
  imagePlaceholder: { width: '100%', height: 280, backgroundColor: '#E5E5E5' },
  content: { padding: 20 },
  breadcrumb: { fontSize: 12, color: '#4A4A4A', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', color: '#111111', marginBottom: 8 },
  price: { fontSize: 26, fontWeight: '700', color: '#FF6600', marginBottom: 16 },
  description: { fontSize: 14, color: '#4A4A4A', marginBottom: 16, lineHeight: 20 },
  stock: { fontSize: 13, color: '#111111', marginBottom: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quantityButtonText: { color: '#111111', fontSize: 20 },
  quantityValue: { color: '#111111', fontSize: 18, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  addButton: {
    flex: 1,
    backgroundColor: '#FF6600',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700' },
  buyButton: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buyButtonText: { color: '#111111', fontWeight: '700' },
  errorText: { color: '#DC2626', textAlign: 'center' },
})