import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql as gqlCore } from '@apollo/client'
import { Link, useNavigate } from 'react-router-dom'
import ProductManager from './ProductManager'
import OrderList from './OrderList'

const MY_STORE_QUERY = gqlCore`
  query MyStore {
    myStore {
      id
      name
      slug
      description
    }
  }
`

const CREATE_STORE_MUTATION = gqlCore`
  mutation CreateStore($name: String!, $slug: String!, $description: String) {
    createStore(input: { name: $name, slug: $slug, description: $description }) {
      id
      name
      slug
      description
    }
  }
`

const UPDATE_STORE_MUTATION = gqlCore`
  mutation UpdateStore($name: String, $slug: String, $description: String) {
    updateStore(input: { name: $name, slug: $slug, description: $description }) {
      id
      name
      slug
      description
    }
  }
`

const DELETE_STORE_MUTATION = gqlCore`
  mutation DeleteStore {
    deleteStore
  }
`

function StoreDashboard() {
  const { data, loading, error, refetch } = useQuery(MY_STORE_QUERY)
  const [createStore] = useMutation(CREATE_STORE_MUTATION)
  const [updateStore] = useMutation(UPDATE_STORE_MUTATION)
  const [deleteStore] = useMutation(DELETE_STORE_MUTATION)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const store = data?.myStore

  useEffect(() => {
    if (store) {
      setName(store.name)
      setSlug(store.slug)
      setDescription(store.description || '')
    }
  }, [store])

  if (loading) return <p>Loading store...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    await createStore({ variables: { name, slug, description } })
    refetch()
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    await updateStore({ variables: { name, slug, description } })
    refetch()
  }

  const handleDeleteStore = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your store? This will permanently delete all products, categories, and order history. This cannot be undone.'
    )
    if (!confirmed) return

    await deleteStore()
    navigate('/')
  }

  if (!store) {
    return (
      <div className="card">
        <form onSubmit={handleCreate}>
          <h2>Create Your Store</h2>
          <div style={{ marginBottom: '12px' }}>
            <label>Name:</label>
            <br />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Slug:</label>
            <br />
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Description:</label>
            <br />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit">Create Store</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Your Store</h2>
            <p>
              <strong>Name:</strong> {store.name}
            </p>
            <p>
              <strong>Slug:</strong> {store.slug}
            </p>
            <p>
              <strong>Description:</strong> {store.description}
            </p>
          </div>
          <Link to={`/store/${store.slug}`}>
            <button className="secondary">View Your Store</button>
          </Link>
        </div>

        <form onSubmit={handleUpdate}>
          <h3>Edit Store</h3>
          <div style={{ marginBottom: '12px' }}>
            <label>Name:</label>
            <br />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Slug:</label>
            <br />
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Description:</label>
            <br />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit">Save Changes</button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '10px' }}>
            Danger Zone
          </p>
          <button
            onClick={handleDeleteStore}
            style={{ background: 'var(--color-error)' }}
          >
            Delete Store
          </button>
        </div>
      </div>

      <ProductManager storeId={store.id} />
      <OrderList />
    </div>
  )
}

export default StoreDashboard