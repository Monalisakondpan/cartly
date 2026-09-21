import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
    $mobileNumber: String!
    $country: String!
    $address: String!
  ) {
    register(
      input: {
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
        mobileNumber: $mobileNumber
        country: $country
        address: $address
      }
    ) {
      id
    }
  }
`

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      refreshToken
    }
  }
`

const REGISTER_CUSTOMER_MUTATION = gql`
  mutation RegisterCustomer($email: String!, $password: String!, $fullName: String!) {
    registerCustomer(input: { email: $email, password: $password, fullName: $fullName }) {
      token
      refreshToken
    }
  }
`

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain a number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.'
  return null
}

export default function RegisterScreen() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<'seller' | 'customer'>('seller')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [register, { loading: registering }] = useMutation(REGISTER_MUTATION)
  const [login, { loading: loggingIn }] = useMutation(LOGIN_MUTATION)
  const [registerCustomer, { loading: registeringCustomer }] = useMutation(REGISTER_CUSTOMER_MUTATION)

  const handleSellerRegister = async () => {
    setErrorMsg('')
    const passwordIssue = validatePassword(password)
    if (passwordIssue) {
      setErrorMsg(passwordIssue)
      return
    }
    try {
      await register({
        variables: { email, password, firstName, lastName, mobileNumber, country, address },
      })
      const loginResult = await login({ variables: { email, password } })
      const data: any = loginResult.data
      await AsyncStorage.setItem('token', data.login.token)
      await AsyncStorage.setItem('refreshToken', data.login.refreshToken)
      router.replace('/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleCustomerRegister = async () => {
    setErrorMsg('')
    const passwordIssue = validatePassword(password)
    if (passwordIssue) {
      setErrorMsg(passwordIssue)
      return
    }
    const fullName = `${firstName} ${lastName}`.trim()
    try {
      const result = await registerCustomer({ variables: { email, password, fullName } })
      const data: any = result.data
      await AsyncStorage.setItem('customerToken', data.registerCustomer.token)
      await AsyncStorage.setItem('customerRefreshToken', data.registerCustomer.refreshToken)
      router.replace('/explore' as any)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const loading = registering || loggingIn || registeringCustomer

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, accountType === 'seller' && styles.toggleButtonActive]}
              onPress={() => setAccountType('seller')}
            >
              <Text style={[styles.toggleText, accountType === 'seller' && styles.toggleTextActive]}>I'm a Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, accountType === 'customer' && styles.toggleButtonActive]}
              onPress={() => setAccountType('customer')}
            >
              <Text style={[styles.toggleText, accountType === 'customer' && styles.toggleTextActive]}>I'm a Customer</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#9a9a9a"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#9a9a9a"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9a9a9a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {accountType === 'seller' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor="#9a9a9a"
                value={country}
                onChangeText={setCountry}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#9a9a9a"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#9a9a9a"
                value={address}
                onChangeText={setAddress}
              />
            </>
          )}

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
          <Text style={styles.hint}>
            Must be 8+ characters, with uppercase, lowercase, a number, and a special character.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={accountType === 'seller' ? handleSellerRegister : handleCustomerRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Already have an account? Log in</Text>
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
    fontSize: 12,
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
  hint: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
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
