import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql as gqlCore } from '@apollo/client'

const PRODUCTS_QUERY = gqlCore`
  query Products($storeId: ID!, $search: String, $categoryId: ID, $limit: Int, $offset: Int) {
    products(storeId: $storeId, search: $search, categoryId: $categoryId, limit: $limit, offset: $offset) {
      id
      name
      slug
      description
      price
      stockQuantity
      categoryId
      imageUrl
      weightGrams
      suggestedPackage
    }
  }
`

const CREATE_PRODUCT_MUTATION = gqlCore`
  mutation CreateProduct($storeId: ID!, $name: String!, $slug: String!, $description: String, $price: Float!, $stockQuantity: Int!, $categoryId: ID, $imageUrl: String, $weightGrams: Int) {
    createProduct(input: {
      storeId: $storeId
      name: $name
      slug: $slug
      description: $description
      price: $price
      stockQuantity: $stockQuantity
      categoryId: $categoryId
      imageUrl: $imageUrl
      weightGrams: $weightGrams
    }) {
      id
    }
  }
`

const UPDATE_PRODUCT_MUTATION = gqlCore`
  mutation UpdateProduct($id: ID!, $name: String, $slug: String, $description: String, $price: Float, $stockQuantity: Int, $categoryId: ID, $imageUrl: String, $weightGrams: Int) {
    updateProduct(id: $id, input: {
      name: $name
      slug: $slug
      description: $description
      price: $price
      stockQuantity: $stockQuantity
      categoryId: $categoryId
      imageUrl: $imageUrl
      weightGrams: $weightGrams
    }) {
      id
    }
  }
`

const DELETE_PRODUCT_MUTATION = gqlCore`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`

const CATEGORIES_QUERY = gqlCore`
  query Categories($storeId: ID!) {
    categories(storeId: $storeId) {
      id
      name
      slug
    }
  }
`

const CREATE_CATEGORY_MUTATION = gqlCore`
  mutation CreateCategory($storeId: ID!, $name: String!, $slug: String!) {
    createCategory(input: { storeId: $storeId, name: $name, slug: $slug }) {
      id
      name
      slug
    }
  }
`

const GENERATE_DESCRIPTION_MUTATION = gqlCore`
  mutation GenerateProductDescription($name: String!, $keywords: String) {
    generateProductDescription(name: $name, keywords: $keywords)
  }
`

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stockQuantity: number
  categoryId: string | null
  imageUrl: string | null
  weightGrams: number | null
  suggestedPackage: string | null
}

type Category = {
  id: string
  name: string
  slug: string
}

type ProductManagerProps = {
  storeId: string
}

const PAGE_SIZE = 5

function ProductManager({ storeId }: ProductManagerProps) {
  const [searchText, setSearchText] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [page, setPage] = useState(0)

  const { data, loading, error, refetch } = useQuery(PRODUCTS_QUERY, {
    variables: {
      storeId,
      search: searchText || null,
      categoryId: filterCategoryId || null,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
  })
  const [createProduct] = useMutation(CREATE_PRODUCT_MUTATION)
  const [updateProduct] = useMutation(UPDATE_PRODUCT_MUTATION)
  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION)
  const [generateDescription, { loading: generating }] = useMutation(GENERATE_DESCRIPTION_MUTATION)

  const { data: categoryData, refetch: refetchCategories } = useQuery(CATEGORIES_QUERY, {
    variables: { storeId },
  })
  const [createCategory] = useMutation(CREATE_CATEGORY_MUTATION)

  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [price, setPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [weightGrams, setWeightGrams] = useState('')
  const [uploading, setUploading] = useState(false)

  if (loading) return <p>Loading products...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>

  const products: Product[] = data?.products || []
  const categories: Category[] = categoryData?.categories || []

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setDescription('')
    setKeywords('')
    setPrice('')
    setStockQuantity('')
    setCategoryId('')
    setImageUrl('')
    setWeightGrams('')
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setName(product.name)
    setSlug(product.slug)
    setDescription(product.description || '')
    setKeywords('')
    setPrice(String(product.price))
    setStockQuantity(String(product.stockQuantity))
    setCategoryId(product.categoryId || '')
    setImageUrl(product.imageUrl || '')
    setWeightGrams(product.weightGrams ? String(product.weightGrams) : '')
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      setImageUrl(result.url)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateDescription = async () => {
    if (!name) {
      alert('Please enter a product name first.')
      return
    }
    try {
      const result = await generateDescription({
        variables: { name, keywords: keywords || null },
      })
      const generated = (result.data as any)?.generateProductDescription
      if (generated) {
        setDescription(generated)
      }
    } catch (err) {
      console.error('AI description generation failed:', err)
      alert('Failed to generate description. Please try again.')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateProduct({
        variables: {
          id: editingId,
          name,
          slug,
          description,
          price: parseFloat(price),
          stockQuantity: parseInt(stockQuantity),
          categoryId: categoryId || null,
          imageUrl: imageUrl || null,
          weightGrams: weightGrams ? parseInt(weightGrams) : null,
        },
      })
    } else {
      await createProduct({
        variables: {
          storeId,
          name,
          slug,
          description,
          price: parseFloat(price),
          stockQuantity: parseInt(stockQuantity),
          categoryId: categoryId || null,
          imageUrl: imageUrl || null,
          weightGrams: weightGrams ? parseInt(weightGrams) : null,
        },
      })
    }
    resetForm()
    refetch()
  }

  const handleDelete = async (id: string) => {
    await deleteProduct({ variables: { id } })
    refetch()
  }

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    await createCategory({
      variables: { storeId, name: newCategoryName, slug: newCategorySlug },
    })
    setNewCategoryName('')
    setNewCategorySlug('')
    refetchCategories()
  }

  return (
    <div>
      <div className="card">
        <h2>Categories</h2>
        <form
          onSubmit={handleCreateCategory}
          style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div>
            <label>Name:</label>
            <br />
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div>
            <label>Slug:</label>
            <br />
            <input
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <button type="submit">Add Category</button>
        </form>
        <div style={{ marginTop: '12px' }}>
          {categories.map((cat) => (
            <span key={cat.id} className="tag" style={{ marginRight: '8px' }}>
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Products</h2>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <label>Search:</label>
            <br />
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setPage(0)
              }}
              placeholder="Search by name..."
            />
          </div>
          <div>
            <label>Filter by Category:</label>
            <br />
            <select
              value={filterCategoryId}
              onChange={(e) => {
                setFilterCategoryId(e.target.value)
                setPage(0)
              }}
            >
              <option value="">-- All --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Name:</label>
              <br />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>Slug:</label>
              <br />
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                maxLength={255}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Description:</label>
              <br />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                style={{ width: '100%', minHeight: '60px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '4px 0 0' }}>
                {description.length}/1000 characters
              </p>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>AI Keywords (optional):</label>
                <br />
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. handmade, durable, gift"
                  maxLength={255}
                  style={{ width: '100%' }}
                />
              </div>
              <button
                type="button"
                className="secondary"
                onClick={handleGenerateDescription}
                disabled={generating}
              >
                {generating ? 'Generating...' : '✨ Generate with AI'}
              </button>
            </div>
            <div>
              <label>Price:</label>
              <br />
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>Stock Quantity:</label>
              <br />
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>Weight (grams):</label>
              <br />
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                placeholder="e.g. 350"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>Category:</label>
              <br />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- None --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Image:</label>
              <br />
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {uploading && <span> Uploading...</span>}
            </div>
          </div>

          {imageUrl && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={imageUrl}
                alt="Preview"
                width="80"
                style={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button type="submit">{editingId ? 'Save Changes' : 'Add Product'}</button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                style={{ marginLeft: '8px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  width="60"
                  height="60"
                  style={{ borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: 'var(--color-border)',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong
                  title={product.name}
                  style={{
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {product.name}
                </strong>
                <div style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
                  ${product.price} · Stock: {product.stockQuantity}
                  {product.suggestedPackage && ` · 📦 ${product.suggestedPackage}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => startEdit(product)}>Edit</button>
                <button className="secondary" onClick={() => handleDelete(product.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button disabled={products.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductManager