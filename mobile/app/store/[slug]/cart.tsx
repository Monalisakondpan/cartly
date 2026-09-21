import { useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native'

type CartItem = {
  id: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

export default function CartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])

  const cartKey = `cart_${slug}`

  const loadCart = useCallback(async () => {
    const stored = await AsyncStorage.getItem(cartKey)
    setItems(stored ? JSON.parse(stored) : [])
  }, [cartKey])

  useFocusEffect(
    useCallback(() => {
      loadCart()
    }, [loadCart])
  )

  const updateCart = async (newItems: CartItem[]) => {
    setItems(newItems)
    await AsyncStorage.setItem(cartKey, JSON.stringify(newItems))
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, quantity } : item))
    updateCart(newItems)
  }

  const handleRemove = (id: string) => {
    const newItems = items.filter((item) => item.id !== id)
    updateCart(newItems)
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
      </View>

      <View style={styles.container}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price} each</Text>
                  </View>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="number-pad"
                    value={String(item.quantity)}
                    onChangeText={(text) => handleQuantityChange(item.id, Number(text) || 1)}
                  />
                  <TouchableOpacity onPress={() => handleRemove(item.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push(`/store/${slug}/checkout` as any)}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  emptyText: { color: '#4A4A4A', textAlign: 'center', marginTop: 40 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemImagePlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#E5E5E5' },
  itemInfo: { flex: 1 },
  itemName: { color: '#111111', fontWeight: '700', fontSize: 14 },
  itemPrice: { color: '#4A4A4A', fontSize: 12 },
  quantityInput: {
    width: 40,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#111111',
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
  },
  removeText: { color: '#DC2626', fontSize: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalLabel: { color: '#111111', fontSize: 18, fontWeight: '700' },
  totalValue: { color: '#111111', fontSize: 18, fontWeight: '700' },
  checkoutButton: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  checkoutButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
})