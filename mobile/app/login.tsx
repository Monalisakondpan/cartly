import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
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

export default function LoginScreen() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<'seller' | 'customer'>('seller')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [login, { loading: loadingSeller }] = useMutation(LOGIN_MUTATION)
  const [loginCustomer, { loading: loadingCustomer }] = useMutation(LOGIN_CUSTOMER_MUTATION)

  const handleLogin = async () => {
    setErrorMsg('')
    try {
      if (accountType === 'seller') {
        const result = await login({ variables: { email, password } })
        const data: any = result.data
        await AsyncStorage.setItem('token', data.login.token)
        await AsyncStorage.setItem('refreshToken', data.login.refreshToken)
        router.replace('/dashboard')
      } else {
        const result = await loginCustomer({ variables: { email, password } })
        const data: any = result.data
        await AsyncStorage.setItem('customerToken', data.loginCustomer.token)
        await AsyncStorage.setItem('customerRefreshToken', data.loginCustomer.refreshToken)
        router.replace('/explore' as any)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const loading = loadingSeller || loadingCustomer

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome Back</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, accountType === 'seller' && styles.toggleButtonActive]}
              onPress={() => setAccountType('seller')}
            >
              <Text style={[styles.toggleText, accountType === 'seller' && styles.toggleTextActive]}>Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, accountType === 'customer' && styles.toggleButtonActive]}
              onPress={() => setAccountType('customer')}
            >
              <Text style={[styles.toggleText, accountType === 'customer' && styles.toggleTextActive]}>Customer</Text>
            </TouchableOpacity>
          </View>

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
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  toggleText: {
    color: '#4A4A4A',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    color: '#111111',
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#111111',
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  linkText: {
    color: '#FF6600',
    textAlign: 'center',
    marginTop: 16,
  },
})