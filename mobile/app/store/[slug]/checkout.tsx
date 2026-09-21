import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import { GRAPHQL_URL } from '../../../config'

const REGISTER_CUSTOMER_MUTATION = gql`
  mutation RegisterCustomer($email: String!, $password: String!, $fullName: String!) {
    registerCustomer(input: { email: $email, password: $password, fullName: $fullName }) {
      token
      refreshToken
    }
  }
`

const LOGIN_CUSTOMER_MUTATION = gql`
  mutation LoginCustomer($email: String!, $password: String!) {
    loginCustomer(input: { email: $email, password: $password }) {
      token
      refreshToken
    }
  }
`

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($storeId: ID!, $items: [OrderItemInput!]!, $idempotencyKey: String) {
    createOrder(input: { storeId: $storeId, items: $items, idempotencyKey: $idempotencyKey }) {
      id
      status
      total
    }
  }
`

type CartItem = { id: string; name: string; price: number; quantity: number; imageUrl?: string | null }

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function CheckoutScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const [items, setItems] = useState<CartItem[]>([])
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [customerToken, setCustomerToken] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const cartKey = `cart_${slug}`

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(cartKey)
      setItems(stored ? JSON.parse(stored) : [])
      const token = await AsyncStorage.getItem('customerToken')
      setCustomerToken(token)
    }
    load()
  }, [cartKey])

  const [registerCustomer, { loading: registering }] = useMutation(REGISTER_CUSTOMER_MUTATION)
  const [loginCustomer, { loading: loggingIn }] = useMutation(LOGIN_CUSTOMER_MUTATION)
  const [createOrder, { loading: ordering }] = useMutation(CREATE_ORDER_MUTATION)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleAuth = async () => {
    setErrorMsg('')
    try {
      if (mode === 'register') {
        const result = await registerCustomer({ variables: { email, password, fullName } })
        const data: any = result.data
        await AsyncStorage.setItem('customerToken', data.registerCustomer.token)
        await AsyncStorage.setItem('customerRefreshToken', data.registerCustomer.refreshToken)
        setCustomerToken(data.registerCustomer.token)
      } else {
        const result = await loginCustomer({ variables: { email, password } })
        const data: any = result.data
        await AsyncStorage.setItem('customerToken', data.loginCustomer.token)
        await AsyncStorage.setItem('customerRefreshToken', data.loginCustomer.refreshToken)
        setCustomerToken(data.loginCustomer.token)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handlePlaceOrder = async () => {
    setErrorMsg('')
    const idempotencyKey = generateIdempotencyKey()
    try {
      const storeRes = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query { storeBySlug(slug: "${slug}") { id } }` }),
      })
      const storeJson = await storeRes.json()
      const storeId = storeJson.data.storeBySlug.id

      const result = await createOrder({
        variables: {
          storeId,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          idempotencyKey,
        },
        context: { headers: { authorization: `Bearer ${customerToken}` } },
      })
      setOrderResult((result.data as any).createOrder)
      await AsyncStorage.removeItem(cartKey)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  if (orderResult) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successTitle}>Order Placed!</Text>
        <Text style={styles.successText}>Order #{orderResult.id}</Text>
        <Text style={styles.successText}>Total: ${orderResult.total}</Text>
        <Text style={styles.successText}>Status: {orderResult.status}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push(`/store/${slug}` as any)}>
          <Text style={styles.backButtonText}>Back to Store</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.summaryRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.summaryImage} />
                ) : (
                  <View style={styles.summaryImagePlaceholder} />
                )}
                <Text style={styles.summaryItemText}>{item.name} x {item.quantity}</Text>
                <Text style={styles.summaryItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {!customerToken ? (
            <View style={styles.authCard}>
              <Text style={styles.authTitle}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>

              {mode === 'register' && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9a9a9a"
                  value={fullName}
                  onChangeText={setFullName}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9a9a9a"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#9a9a9a"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Text>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={registering || loggingIn}>
                {registering || loggingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.authButtonText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                <Text style={styles.switchModeText}>
                  {mode === 'login' ? "No account yet? Create one" : 'Already have an account? Log in'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authCard}>
              <Text style={styles.loggedInText}>Logged in as customer</Text>
              <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder} disabled={ordering}>
                {ordering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.placeOrderButtonText}>Place Order</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: { flexGrow: 1, padding: 20 },
  centered: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryCard: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5E5' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryImage: { width: 40, height: 40, borderRadius: 6 },
  summaryImagePlaceholder: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#E5E5E5' },
  summaryItemText: { flex: 1, color: '#111111', fontSize: 13 },
  summaryItemPrice: { color: '#111111', fontSize: 13, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  totalLabel: { color: '#111111', fontWeight: '700', fontSize: 16 },
  totalValue: { color: '#111111', fontWeight: '700', fontSize: 16 },
  authCard: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  authTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 12, color: '#111111', marginBottom: 10 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, marginBottom: 10 },
  passwordInput: { flex: 1, padding: 12, color: '#111111' },
  eyeButton: { paddingHorizontal: 12 },
  authButton: { backgroundColor: '#FF6600', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 6 },
  authButtonText: { color: '#FFFFFF', fontWeight: '700' },
  switchModeText: { color: '#FF6600', textAlign: 'center', marginTop: 12, fontSize: 13 },
  loggedInText: { color: '#4A4A4A', marginBottom: 12, fontSize: 13 },
  placeOrderButton: { backgroundColor: '#FF6600', borderRadius: 8, padding: 14, alignItems: 'center' },
  placeOrderButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  errorText: { color: '#DC2626', marginTop: 12, textAlign: 'center' },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#111111', marginBottom: 12 },
  successText: { color: '#4A4A4A', fontSize: 14, marginBottom: 4 },
  backButton: { backgroundColor: '#FF6600', borderRadius: 8, padding: 14, marginTop: 20 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700' },
})