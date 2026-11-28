import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Search, User, LogOut, ChevronDown } from 'lucide-react'
import { useWatchlist } from '../hooks/useWatchlist'
import { useAuth } from '../context/auth'

interface NavProps {
  onSearch: () => void
}

export default function Nav({ onSearch }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { count } = useWatchlist()
  const { user, logout, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <>
      <header className="nav">
        <Link className="brand" to="/">
          CINEBLAZE<i>®</i>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {link.label}
              {link.to === '/watchlist' && count > 0 ? (
                <span className="nav__count">{count}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="nav__tools">
          <button className="icon-btn nav__search-btn" type="button" onClick={onSearch} aria-label="Search the catalogue">
            <Search size={15} strokeWidth={1.6} />
          </button>

          {loading ? (
            <div className="nav__user-skeleton" aria-hidden="true" />
          ) : user ? (
            <div className="nav__user" onClick={() => setUserMenuOpen((open) => !open)}>
              <div className="nav__avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="" />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <ChevronDown size={12} strokeWidth={2} className="nav__chevron" />
            </div>
          ) : !isAuthPage ? (
            <NavLink to="/login" className="nav__auth-link">
              Sign in
            </NavLink>
          ) : null}

          <button
            className="nav__menu"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {user && userMenuOpen && (
          <div className="nav__user-menu" onClick={(e) => e.stopPropagation()}>
            <div className="nav__user-menu-header">
              <div className="nav__user-menu-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="" />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="nav__user-menu-name">{user.name}</p>
                <p className="nav__user-menu-email mono">{user.email}</p>
              </div>
            </div>
            <NavLink to="/profile" className="nav__user-menu-item" onClick={() => setUserMenuOpen(false)}>
              <User size={14} strokeWidth={1.6} />
              Profile
            </NavLink>
            {user?.isAdmin ? (
              <NavLink to="/admin" className="nav__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                <User size={14} strokeWidth={1.6} />
                Admin
              </NavLink>
            ) : null}
            <button className="nav__user-menu-item btn--danger" onClick={handleLogout}>
              <LogOut size={14} strokeWidth={1.6} />
              Sign out
            </button>
          </div>
        )}
      </header>

      <div className="mobilemenu" id="mobile-menu" data-open={menuOpen}>
        <nav className="menu-list" aria-label="Mobile">
          {LINKS.map((link, index) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              <span className="idx">{String(index + 1).padStart(2, '0')}</span>
              <span className="name">{link.label}</span>
            </NavLink>
          ))}
          {user ? (
            <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
              <span className="idx">{String(LINKS.length + 1).padStart(2, '0')}</span>
              <span className="name">Profile</span>
            </NavLink>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>
              <span className="idx">{String(LINKS.length + 1).padStart(2, '0')}</span>
              <span className="name">Sign in</span>
            </NavLink>
          )}
        </nav>
        <div className="mobilemenu__foot">
          <div className="mobilemenu__quick">
            <NavLink to="/films?sort=vote_average.desc" onClick={() => setMenuOpen(false)}>
              <span className="mono">Top rated</span>
            </NavLink>
            <NavLink to="/films?sort=primary_release_date.desc" onClick={() => setMenuOpen(false)}>
              <span className="mono">New releases</span>
            </NavLink>
            <NavLink to="/series" onClick={() => setMenuOpen(false)}>
              <span className="mono">Series index</span>
            </NavLink>
            <NavLink to="/anime" onClick={() => setMenuOpen(false)}>
              <span className="mono">Anime</span>
            </NavLink>
          </div>

          <button
            type="button"
            className="mobilemenu__search"
            onClick={() => {
              setMenuOpen(false)
              onSearch()
            }}
          >
            <Search size={14} strokeWidth={1.6} />
            Search the catalogue
          </button>

          <p className="mobilemenu__note mono">
            <span>CineBlaze index</span>
            <span>Data by TMDB</span>
          </p>
        </div>
      </div>
    </>
  )
}

const LINKS = [
  { to: '/films', label: 'Films' },
  { to: '/series', label: 'Series' },
  { to: '/anime', label: 'Anime' },
  { to: '/people', label: 'People' },
  { to: '/watchlist', label: 'Watchlist' },
]


