import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from, Observable } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import './index.css'
import App from './App.tsx'

const httpLink = new HttpLink({ uri: 'http://localhost:8080/query' })

type TokenSet = {
  tokenKey: string
  refreshKey: string
}

const TOKEN_SETS: TokenSet[] = [
  { tokenKey: 'token', refreshKey: 'refreshToken' },
  { tokenKey: 'customerToken', refreshKey: 'customerRefreshToken' },
  { tokenKey: 'adminToken', refreshKey: 'adminRefreshToken' },
]

function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

function isExpiredOrExpiringSoon(token: string): boolean {
  const expiryMs = decodeJwtExpiry(token)
  if (!expiryMs) return false
  const bufferMs = 30 * 1000
  return Date.now() + bufferMs >= expiryMs
}

async function refreshAccessToken(refreshTokenValue: string): Promise<string | null> {
  try {
    const res = await fetch('http://localhost:8080/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token
          }
        }`,
        variables: { refreshToken: refreshTokenValue },
      }),
    })
    const json = await res.json()
    if (json.errors || !json.data?.refreshToken?.token) {
      console.log('[refresh] failed:', json.errors)
      return null
    }
    console.log('[refresh] success')
    return json.data.refreshToken.token
  } catch (err) {
    console.log('[refresh] exception:', err)
    return null
  }
}

async function getValidToken(tokenKey: string, refreshKey: string): Promise<string | null> {
  const current = localStorage.getItem(tokenKey)
  if (!current) return null

  if (!isExpiredOrExpiringSoon(current)) {
    return current
  }

  console.log(`[getValidToken] ${tokenKey} expired or expiring soon, refreshing...`)
  const refreshValue = localStorage.getItem(refreshKey)
  if (!refreshValue) return current

  const newToken = await refreshAccessToken(refreshValue)
  if (newToken) {
    localStorage.setItem(tokenKey, newToken)
    return newToken
  }
  return current
}

const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    ;(async () => {
      const existingHeaders = operation.getContext().headers || {}

      if (existingHeaders.authorization) {
        const rawToken = existingHeaders.authorization.replace('Bearer ', '')
        for (const set of TOKEN_SETS) {
          const stored = localStorage.getItem(set.tokenKey)
          if (stored === rawToken) {
            const validToken = await getValidToken(set.tokenKey, set.refreshKey)
            operation.setContext({
              headers: { ...existingHeaders, authorization: `Bearer ${validToken}` },
            })
            break
          }
        }
      } else {
        const validToken = await getValidToken('token', 'refreshToken')
        operation.setContext({
          headers: { ...existingHeaders, authorization: validToken ? `Bearer ${validToken}` : '' },
        })
      }

      forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      })
    })()
  })
})

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)