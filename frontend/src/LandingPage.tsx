import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function LandingPage() {
  const [openMenu, setOpenMenu] = useState<'why' | 'products' | 'pricing' | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const whyReveal = useScrollReveal()
  const productsReveal = useScrollReveal()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMenu = (menu: 'why' | 'products' | 'pricing') => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  return (
    <div>
      <nav
        ref={navRef}
        style={{
          background: 'var(--color-nav)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.jpg" alt="Cartly" style={{ height: '44px', borderRadius: '4px' }} />
            Cartly
          </h1>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span
              onClick={() => toggleMenu('why')}
              style={{
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
              }}
            >
              Why Cartly <span style={{ fontSize: '11px' }}>{openMenu === 'why' ? '▲' : '▼'}</span>
            </span>

            {openMenu === 'why' && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '-20px',
                  width: '480px',
                  padding: '24px',
                  zIndex: 10,
                }}
              >
                <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ marginBottom: '12px', cursor: 'pointer' }}>
                    <strong>⚡ Fast Setup</strong>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                      Start selling in minutes, not days
                    </p>
                  </div>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ marginBottom: '12px', cursor: 'pointer' }}>
                    <strong>📦 All-in-One Dashboard</strong>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                      Manage everything from one place
                    </p>
                  </div>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ cursor: 'pointer' }}>
                    <strong>🔒 Secure by Default</strong>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                      Authentication and role-based access built in
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <span
              onClick={() => toggleMenu('products')}
              style={{
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
              }}
            >
              Products <span style={{ fontSize: '11px' }}>{openMenu === 'products' ? '▲' : '▼'}</span>
            </span>

            {openMenu === 'products' && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '-20px',
                  width: '520px',
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  zIndex: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '10px' }}>
                    RUN YOUR STORE
                  </div>
                  <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ marginBottom: '12px', cursor: 'pointer' }}>
                      <strong>🏬 Store Management</strong>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                        Create and customize your storefront
                      </p>
                    </div>
                  </Link>
                  <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ cursor: 'pointer' }}>
                      <strong>🛍️ Product Catalog</strong>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                        Full CRUD, categories, image uploads
                      </p>
                    </div>
                  </Link>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '10px' }}>
                    SELL & FULFILL
                  </div>
                  <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ marginBottom: '12px', cursor: 'pointer' }}>
                      <strong>🔍 Search & Filters</strong>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                        Help customers find products fast
                      </p>
                    </div>
                  </Link>
                  <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ cursor: 'pointer' }}>
                      <strong>📦 Order Management</strong>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0' }}>
                        Track and update order status
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <span
              onClick={() => toggleMenu('pricing')}
              style={{
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
              }}
            >
              Pricing <span style={{ fontSize: '11px' }}>{openMenu === 'pricing' ? '▲' : '▼'}</span>
            </span>

            {openMenu === 'pricing' && (
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '28px',
                    left: '-20px',
                    width: '280px',
                    padding: '20px',
                    textAlign: 'center',
                    zIndex: 10,
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: '26px', color: 'var(--color-muted)', fontWeight: 700, margin: '0 0 6px' }}>
                    Free
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 10px' }}>
                    Currently free during early access.
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 700, margin: 0 }}>
                    Get Started →
                  </p>
                </div>
              </Link>
            )}
          </div>

          <Link to="/store/mona-shop" style={{ color: 'white', textDecoration: 'none' }}>
            Visit Demo Store
          </Link>
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
            Log in
          </Link>
          <Link to="/register">
            <button className="secondary">Start for free</button>
          </Link>
        </div>
      </nav>

      <div
        style={{
          textAlign: 'center',
          padding: '90px 20px 50px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>
          Build your store. Sell anywhere.
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--color-muted)', marginBottom: '32px' }}>
          Cartly gives you everything you need to create a store, manage products,
          and start selling — in minutes.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/register">
            <button style={{ fontSize: '16px', padding: '12px 28px' }}>
              Start for free
            </button>
          </Link>
          <Link to="/store/mona-shop">
            <button className="secondary" style={{ fontSize: '16px', padding: '12px 28px' }}>
              Visit Demo Store
            </button>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '36px' }}>Build fast on Cartly</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
        >
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 700, marginBottom: '8px' }}>
                01
              </div>
              <h3 style={{ marginBottom: '6px' }}>Add your first product</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Set a name, price, and photo — your catalog starts here.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
                Get Started →
              </p>
            </div>
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 700, marginBottom: '8px' }}>
                02
              </div>
              <h3 style={{ marginBottom: '6px' }}>Customize your store</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Give your storefront a name, description, and your own web address.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
                Get Started →
              </p>
            </div>
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 700, marginBottom: '8px' }}>
                03
              </div>
              <h3 style={{ marginBottom: '6px' }}>Start selling</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Share your store link and watch the orders come in.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
                Get Started →
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div
        ref={whyReveal.ref}
        className={`scroll-reveal ${whyReveal.visible ? 'visible' : ''}`}
        id="why"
        style={{ maxWidth: '1100px', margin: '20px auto 60px', padding: '0 20px', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: '16px', fontWeight: whyReveal.visible ? 800 : 700 }}>Why Cartly</h2>
        <p
          style={{
            color: 'var(--color-muted)',
            maxWidth: '700px',
            margin: '0 auto 28px',
            fontSize: '15px',
            lineHeight: 1.6,
            fontWeight: whyReveal.visible ? 600 : 400,
          }}
        >
          Most commerce platforms make you choose between simplicity and control.
          Cartly doesn't. Whether you're launching your first storefront or replacing
          a clunky spreadsheet-and-email workflow, Cartly gets you selling without
          the setup fatigue — no plugins to configure, no server to manage, no
          separate systems to keep in sync. Just a store, your products, and your
          customers, connected from day one.
        </p>
        <div
          className="scroll-row"
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '12px',
            justifyContent: 'center',
          }}
        >
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
              <h3 style={{ marginBottom: '8px' }}>Fast Setup</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Create your store and start selling in minutes, not days. No servers to
                configure, no plugins to install.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                Get Started →
              </p>
            </div>
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
              <h3 style={{ marginBottom: '8px' }}>All-in-One Dashboard</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Manage products, categories, and inventory from one place — everything
                stays in sync automatically.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                Get Started →
              </p>
            </div>
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
              <h3 style={{ marginBottom: '8px' }}>Secure by Default</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Built-in authentication and role-based access control, so owners and
                customers each see exactly what they should.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                Get Started →
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div
        ref={productsReveal.ref}
        className={`scroll-reveal ${productsReveal.visible ? 'visible' : ''}`}
        id="products"
        style={{ maxWidth: '1100px', margin: '20px auto 60px', padding: '0 20px', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: '16px', fontWeight: productsReveal.visible ? 800 : 700 }}>Products</h2>
        <p
          style={{
            color: 'var(--color-muted)',
            maxWidth: '700px',
            margin: '0 auto 28px',
            fontSize: '15px',
            lineHeight: 1.6,
            fontWeight: productsReveal.visible ? 600 : 400,
          }}
        >
          Every tool a small store actually needs, none of the bloat larger platforms
          bolt on. Build your catalog, organize it the way your customers shop, and
          let them find what they're looking for without digging through menus.
        </p>
        <div
          className="scroll-row"
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '12px',
            justifyContent: 'center',
          }}
        >
          <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏬</div>
              <h3 style={{ marginBottom: '8px' }}>Store Management</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Create and customize your storefront in a few clicks — name, branding,
                and description, all editable anytime.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                View Store →
              </p>
            </div>
          </Link>
          <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
              <h3 style={{ marginBottom: '8px' }}>Product Catalog</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Full CRUD, categories, and image uploads built in — add a product and
                it's live on your storefront instantly.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                View Store →
              </p>
            </div>
          </Link>
          <Link to="/store/mona-shop" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', minWidth: '280px', flexShrink: 0 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              <h3 style={{ marginBottom: '8px' }}>Search & Filters</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                Help customers find exactly what they're looking for, with search and
                category filtering built into every storefront.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>
                View Store →
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div
        id="pricing"
        className="card"
        style={{ maxWidth: '600px', margin: '20px auto 80px', textAlign: 'center' }}
      >
        <h2>Pricing</h2>
        <p style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: 700, margin: '8px 0' }}>
          Free
        </p>
        <p style={{ color: 'var(--color-muted)', marginBottom: '20px' }}>
          Cartly is currently free to use while in early access.
        </p>
        <Link to="/register">
          <button>Start for free</button>
        </Link>
      </div>

      <Footer />
    </div>
  )
}

export default LandingPage
