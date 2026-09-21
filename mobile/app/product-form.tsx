import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { UPLOAD_URL } from '../config'

const MY_STORE_QUERY = gql`
  query MyStore {
    myStore {
      id
    }
  }
`

const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($storeId: ID!, $name: String!, $slug: String!, $description: String, $price: Float!, $stockQuantity: Int!, $imageUrl: String, $weightGrams: Int) {
    createProduct(input: {
      storeId: $storeId
      name: $name
      slug: $slug
      description: $description
      price: $price
      stockQuantity: $stockQuantity
      imageUrl: $imageUrl
      weightGrams: $weightGrams
    }) {
      id
    }
  }
`

const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: ID!, $name: String, $slug: String, $description: String, $price: Float, $stockQuantity: Int, $imageUrl: String, $weightGrams: Int) {
    updateProduct(id: $id, input: {
      name: $name
      slug: $slug
      description: $description
      price: $price
      stockQuantity: $stockQuantity
      imageUrl: $imageUrl
      weightGrams: $weightGrams
    }) {
      id
    }
  }
`

const GENERATE_DESCRIPTION_MUTATION = gql`
  mutation GenerateProductDescription($name: String!, $keywords: String) {
    generateProductDescription(name: $name, keywords: $keywords)
  }
`

export default function ProductFormScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    name?: string
    slug?: string
    description?: string
    price?: string
    stockQuantity?: string
    weightGrams?: string
    imageUrl?: string
  }>()

  const isEditing = !!params.id
  const [token, setToken] = useState<string | null>(null)

  const [name, setName] = useState(params.name || '')
  const [slug, setSlug] = useState(params.slug || '')
  const [description, setDescription] = useState(params.description || '')
  const [keywords, setKeywords] = useState('')
  const [price, setPrice] = useState(params.price || '')
  const [stockQuantity, setStockQuantity] = useState(params.stockQuantity || '')
  const [weightGrams, setWeightGrams] = useState(params.weightGrams || '')
  const [imageUrl, setImageUrl] = useState(params.imageUrl || '')
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken)
  }, [])

  const { data: storeData } = useQuery<{ myStore: { id: string } }>(MY_STORE_QUERY, {
    skip: !token || isEditing,
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })
  const [generateDescription, { loading: generating }] = useMutation(GENERATE_DESCRIPTION_MUTATION, {
    context: { headers: { authorization: `Bearer ${token}` } },
  })

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload an image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any)

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const json = await response.json()
      setImageUrl(json.url)
    } catch (err) {
      Alert.alert('Upload failed', 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateDescription = async () => {
    if (!name) {
      Alert.alert('Missing name', 'Enter a product name first.')
      return
    }
    try {
      const result = await generateDescription({ variables: { name, keywords: keywords || null } })
      const generated = (result.data as any)?.generateProductDescription
      if (generated) setDescription(generated)
    } catch (err) {
      Alert.alert('Error', 'Failed to generate description.')
    }
  }

  const handleSubmit = async () => {
    setErrorMsg('')
    try {
      if (isEditing) {
        await updateProduct({
          variables: {
            id: params.id,
            name,
            slug,
            description,
            price: parseFloat(price),
            stockQuantity: parseInt(stockQuantity),
            imageUrl: imageUrl || null,
            weightGrams: weightGrams ? parseInt(weightGrams) : null,
          },
        })
      } else {
        const storeId = storeData?.myStore.id
        await createProduct({
          variables: {
            storeId,
            name,
            slug,
            description,
            price: parseFloat(price),
            stockQuantity: parseInt(stockQuantity),
            imageUrl: imageUrl || null,
            weightGrams: weightGrams ? parseInt(weightGrams) : null,
          },
        })
      }
      router.back()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const loading = creating || updating

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#FF6600" />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            ) : (
              <Text style={styles.imagePickerText}>Tap to upload image</Text>
            )}
          </TouchableOpacity>

          <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#9a9a9a" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Slug" placeholderTextColor="#9a9a9a" value={slug} onChangeText={setSlug} autoCapitalize="none" />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            placeholderTextColor="#9a9a9a"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.aiRow}>
            <TextInput
              style={[styles.input, styles.aiInput]}
              placeholder="AI Keywords (optional)"
              placeholderTextColor="#9a9a9a"
              value={keywords}
              onChangeText={setKeywords}
            />
            <TouchableOpacity style={styles.aiButton} onPress={handleGenerateDescription} disabled={generating}>
              {generating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.aiButtonText}>✨ AI</Text>}
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#9a9a9a" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <TextInput style={styles.input} placeholder="Stock Quantity" placeholderTextColor="#9a9a9a" value={stockQuantity} onChangeText={setStockQuantity} keyboardType="number-pad" />
          <TextInput style={styles.input} placeholder="Weight (grams)" placeholderTextColor="#9a9a9a" value={weightGrams} onChangeText={setWeightGrams} keyboardType="number-pad" />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Add Product'}</Text>}
          </TouchableOpacity>

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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  container: { padding: 20 },
  imagePicker: {
    height: 150,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePickerText: { color: '#4A4A4A' },
  previewImage: { width: '100%', height: '100%' },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    color: '#111111',
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  aiInput: { flex: 1 },
  aiButton: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aiButtonText: { color: '#FFFFFF', fontWeight: '700' },
  submitButton: { backgroundColor: '#FF6600', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  errorText: { color: '#DC2626', marginTop: 12, textAlign: 'center' },
})