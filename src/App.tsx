import { useCallback, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/auth'
import { MockStoreProvider } from './context/MockStoreContext'
import { fetchMaintenance, setMaintenanceSnapshot, useMaintenance } from './lib/maintenance'
import Anime from './pages/Anime'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import Footer from './components/Footer'
import Nav from './components/Nav'
import SearchOverlay from './components/SearchOverlay'
import Browse from './pages/Browse'
import Details from './pages/Details'
import Home from './pages/Home'
import ListDetail from './pages/ListDetail'
import Lists from './pages/Lists'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import People from './pages/People'
import Person from './pages/Person'
import Platforms from './pages/Platforms'
import Profile from './pages/Profile'
import Signup from './pages/Signup'
import Watchlist from './pages/Watchlist'
import Admin from './pages/Admin'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'CineBlaze — Films, Series, People',
  '/films': 'Films — CineBlaze',
  '/series': 'Series — CineBlaze',
  '/platforms': 'Streaming platforms — CineBlaze',
  '/anime': 'Anime — CineBlaze',
  '/people': 'People — CineBlaze',
  '/watchlist': 'Watchlist — CineBlaze',
  '/login': 'Sign in — CineBlaze',
  '/signup': 'Create account — CineBlaze',
  '/profile': 'Profile — CineBlaze',
  '/lists': 'My lists — CineBlaze',
  '/admin': 'Admin — CineBlaze',
}

function titleFor(pathname: string, maintenance: boolean): string {
  if (maintenance) return 'Under construction — CineBlaze'
  if (pathname.startsWith('/title/')) return 'Title details — CineBlaze'
  if (pathname.startsWith('/person/')) return 'Person — CineBlaze'
  if (pathname.startsWith('/list/')) return 'List — CineBlaze'
  return ROUTE_TITLES[pathname] ?? 'Page not found — CineBlaze'
}

function MaintenancePage() {
  return (
    <div className="empty shell">
      <p className="mono muted">CINEBLAZE / MAINTENANCE</p>
      <h1 className="empty__title">Under construction</h1>
      <p className="empty__text">
        CineBlaze is being updated. Please check back shortly. Admins can still sign in.
      </p>
      <Link className="btn btn--solid" to="/login">
        Admin sign in
      </Link>
      <Link className="link-arrow" to="/signup">
        Create account
      </Link>
    </div>
  )
}

export default function App() {
  return <AppShell />
}

function AppShell() {
  const { user, loading: authLoading } = useAuth()
  const maintenance = useMaintenance()
  const [searchOpen, setSearchOpen] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const location = useLocation()
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    void Promise.resolve()
      .then(fetchMaintenance)
      .then(setMaintenanceSnapshot)
      .catch(() => undefined)
      .finally(() => setConfigLoading(false))
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target ? /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) : false
      if (event.key === '/' && !typing) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const authPage = location.pathname === '/login' || location.pathname === '/signup'
  const showingMaintenance = maintenance && !user?.isAdmin && !authPage

  useEffect(() => {
    document.title = titleFor(location.pathname, showingMaintenance)
  }, [location.pathname, showingMaintenance])

  if (configLoading || authLoading) {
    return (
      <div className="shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    )
  }

  if (showingMaintenance) return <MaintenancePage />

  return (
    <MockStoreProvider>
      <div className="app">
        <a className="skip" href="#main">
          Skip to content
        </a>

        <Nav onSearch={() => setSearchOpen(true)} />

        <main id="main" className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/films" element={<Browse kind="movie" title="Films" eyebrow="Index / Films" />} />
            <Route path="/series" element={<Browse kind="tv" title="Series" eyebrow="Index / Series" />} />
            <Route path="/platforms" element={<Platforms />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/title/:kind/:id" element={<Details />} />
            <Route path="/people" element={<People />} />
            <Route path="/person/:id" element={<Person />} />
            <Route path="/watchlist" element={<Watchlist />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/list/:id" element={<ListDetail />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

        {searchOpen ? <SearchOverlay onClose={closeSearch} /> : null}
      </div>
    </MockStoreProvider>
  )
}
