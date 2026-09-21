import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useFocusEffect } from 'expo-router'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native'

const MY_STORE_QUERY = gql`
  query MyStore {
    myStore {
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
      weightGrams
      suggestedPackage
    }
  }
`

const CATEGORIES_QUERY = gql`
  query Categories($storeId: ID!) {
    categories(storeId: $storeId) {
      id
      name
      slug
    }
  }
`

const CREATE_CATEGORY_MUTATION = gql`
  mutation CreateCategory($storeId: ID!, $name: String!, $slug: String!) {
    createCategory(input: { storeId: $storeId, name: $name, slug: $slug }) {
      id
      name
      slug
    }
  }
`

type Store = { id: string; name: string; slug: string; description: string | null }
type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stockQuantity: number
  imageUrl: string | null
  weightGrams: number | null
  suggestedPackage: string | null
}
type Category = { id: string; name: string; slug: string }

export default function DashboardScreen() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')

  useEffect(() => {
    const loadToken = async () => {
      const stored = await AsyncStorage.getItem('token')
      setToken(stored)
      setTokenLoaded(true)
      if (!stored) {
        router.replace('/login')
      }
    }
    loadToken()
  }, [])

  const { data: storeData, loading: storeLoading } = useQuery<{ myStore: Store | null }>(MY_STORE_QUERY, {
    skip: !token,
    context: { headers: { authorization: `Bearer ${token}` } },
  })
  const store = storeData?.myStore

  const { data: productsData, loading: productsLoading, refetch: refetchProducts } = useQuery<{ products: Product[] }>(
    PRODUCTS_QUERY,
    {
      variables: { storeId: store?.id },
      skip: !store,
      context: { headers: { authorization: `Bearer ${token}` } },
    }
  )
  const products = productsData?.products || []

  const { data: categoriesData, refetch: refetchCategories } = useQuery<{ categories: Category[] }>(
    CATEGORIES_QUERY,
    {
      variables: { storeId: store?.id },
      skip: !store,
      context: { headers: { authorization: `Bearer ${token}` } },
    }
  )
  const categories = categoriesData?.categories || []

  const [createCategory, { loading: creatingCategory }] = useMutation(CREATE_CATEGORY_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  useFocusEffect(
    useCallback(() => {
      if (store) {
        refetchProducts()
        refetchCategories()
      }
    }, [store])
  )

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('refreshToken')
    router.replace('/')
  }

  const handleAddProduct = () => {
    router.push('/product-form' as any)
  }

  const handleEditProduct = (product: Product) => {
    router.push({
      pathname: '/product-form' as any,
      params: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: String(product.price),
        stockQuantity: String(product.stockQuantity),
        weightGrams: product.weightGrams ? String(product.weightGrams) : '',
        imageUrl: product.imageUrl || '',
      },
    })
  }

  const handleAddCategory = async () => {
    if (!store || !newCategoryName || !newCategorySlug) return
    try {
      await createCategory({
        variables: { storeId: store.id, name: newCategoryName, slug: newCategorySlug },
      })
      setNewCategoryName('')
      setNewCategorySlug('')
      refetchCategories()
    } catch (err) {
      console.error('Failed to create category:', err)
    }
  }

  if (!tokenLoaded || storeLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    )
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You don't have a store yet.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/orders' as any)}>
            <Text style={styles.ordersText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.storeCard}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeSlug}>/{store.slug}</Text>
          {store.description && <Text style={styles.storeDescription}>{store.description}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryCard}>
          <View style={styles.categoryInputRow}>
            <TextInput
              style={[styles.input, styles.categoryInput]}
              placeholder="Name"
              placeholderTextColor="#9a9a9a"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TextInput
              style={[styles.input, styles.categoryInput]}
              placeholder="Slug"
              placeholderTextColor="#9a9a9a"
              value={newCategorySlug}
              onChangeText={setNewCategorySlug}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addCategoryButton} onPress={handleAddCategory} disabled={creatingCategory}>
              {creatingCategory ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addCategoryButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.tagRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.tag}>
                <Text style={styles.tagText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.productsHeaderRow}>
          <Text style={styles.sectionTitle}>Products</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>

        {productsLoading ? (
          <ActivityIndicator size="small" color="#FF6600" />
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products yet.</Text>
        ) : (
          products.map((item) => (
            <TouchableOpacity key={item.id} style={styles.productRow} onPress={() => handleEditProduct(item)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder} />
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  ${item.price} · Stock: {item.stockQuantity}
                  {item.suggestedPackage && ` · 📦 ${item.suggestedPackage}`}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerButtons: { flexDirection: 'row', gap: 16 },
  ordersText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  logoutText: { color: '#FF6600', fontSize: 14 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  storeCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  storeName: { fontSize: 20, fontWeight: '700', color: '#111111', marginBottom: 4 },
  storeSlug: { fontSize: 12, color: '#4A4A4A', marginBottom: 8 },
  storeDescription: { fontSize: 13, color: '#4A4A4A' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12 },
  categoryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryInput: { flex: 1, marginBottom: 0 },
  addCategoryButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addCategoryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#FF6600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { color: '#FFFFFF', fontSize: 12 },
  productsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { backgroundColor: '#FF6600', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  productImage: { width: 50, height: 50, borderRadius: 8 },
  productImagePlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#E5E5E5' },
  productInfo: { flex: 1 },
  productName: { color: '#111111', fontWeight: '700', fontSize: 14 },
  productMeta: { color: '#4A4A4A', fontSize: 12 },
  emptyText: { color: '#4A4A4A', textAlign: 'center', marginTop: 20 },
  errorText: { color: '#DC2626', textAlign: 'center' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 10,
    color: '#111111',
  },
})