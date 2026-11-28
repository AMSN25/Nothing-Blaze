import { Link } from 'react-router-dom'
import { X, Mail, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/auth'

const CURRENT_YEAR = new Date().getFullYear()

const COLUMNS = [
  {
    heading: 'Discover',
    links: [
      { label: 'Films', to: '/films' },
      { label: 'Series', to: '/series' },
      { label: 'Anime', to: '/anime' },
      { label: 'People', to: '/people' },
    ],
  },
  {
    heading: 'Films',
    links: [
      { label: 'Trending', to: '/films' },
      { label: 'Top rated', to: '/films?sort=vote_average.desc' },
      { label: 'New releases', to: '/films?sort=primary_release_date.desc' },
      { label: 'Action', to: '/films?genre=28' },
      { label: 'Animation', to: '/films?genre=16' },
    ],
  },
  {
    heading: 'Series',
    links: [
      { label: 'Popular series', to: '/series' },
      { label: 'Top rated', to: '/series?sort=vote_average.desc' },
      { label: 'New episodes', to: '/series?sort=first_air_date.desc' },
      { label: 'Anime index', to: '/anime' },
    ],
  },
]

const SOCIAL_LINKS = [
  { icon: ExternalLink, href: 'https://github.com', label: 'GitHub' },
  { icon: X, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Mail, href: 'mailto:hello@cineblaze.app', label: 'Email' },
]

export default function Footer() {
  const { user } = useAuth()

  const account = user
    ? [
        { label: 'My profile', to: '/profile' },
        { label: 'My lists', to: '/lists' },
        { label: 'Watchlist', to: '/watchlist' },
      ]
    : [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/signup' },
        { label: 'Watchlist', to: '/watchlist' },
      ]

  const columns = [...COLUMNS, { heading: 'Account', links: account }]

  return (
    <footer className="footer">
      <div className="footer__word" aria-hidden="true">
        CINEBLAZE
      </div>

      <div className="footer__cols">
        {columns.map((column) => (
          <div key={column.heading} className="footer__col">
            <h3 className="mono">{column.heading}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.label}`}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

<div className="footer__base">
        <div className="footer__legal mono">
          <span>© {CURRENT_YEAR} CineBlaze</span>
          <span>Made by <a href="https://www.facebook.com/AUAMANULLAH.OFFICIAL" target="_blank" rel="noreferrer" className="footer__credit">AMANULLAH</a></span>
        </div>

        <div className="footer__social">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              className="footer__social-link"
            >
              <social.icon size={15} strokeWidth={1.6} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}


