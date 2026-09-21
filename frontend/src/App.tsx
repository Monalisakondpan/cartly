import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { client } from './main'
import Login from './Login'
import Register from './Register'
import StoreDashboard from './StoreDashboard'
import LandingPage from './LandingPage'
import Storefront from './Storefront'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Checkout from './Checkout'
import BackButton from './BackButton'
import Terms from './Terms'
import Privacy from './Privacy'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import ExploreStores from './ExploreStores'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import SessionIndicator from './SessionIndicator'

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('adminToken')
  )

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    client.clearStore()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    client.clearStore()
  }

  const handleAdminLoginSuccess = (newToken: string) => {
    localStorage.setItem('adminToken', newToken)
    setAdminToken(newToken)
    client.clearStore()
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    setAdminToken(null)
    client.clearStore()
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExploreStores />} />
        <Route path="/store/:slug" element={<Storefront />} />
        <Route path="/store/:slug/product/:productSlug" element={<ProductDetail />} />
        <Route path="/store/:slug/cart" element={<Cart />} />
        <Route path="/store/:slug/checkout" element={<Checkout />} />
        <Route
          path="/login"
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/register"
          element={<Register onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/admin/login"
          element={<AdminLogin onLoginSuccess={handleAdminLoginSuccess} />}
        />
        <Route
          path="/admin"
          element={
            adminToken ? (
              <AdminDashboard onLogout={handleAdminLogout} />
            ) : (
              <Navigate to="/admin/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            token ? (
              <div>
                <header
                  style={{
                    background: 'var(--color-nav)',
                    color: 'white',
                    padding: '16px 32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h1 style={{ color: 'white', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/logo.jpg" alt="Cartly" style={{ height: '36px', borderRadius: '4px' }} />
                    Cartly
                  </h1>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <SessionIndicator token={token} />
                    <BackButton to="/" label="Home" />
                    <button className="secondary" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </header>
                <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
                  <StoreDashboard />
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App