import { Link } from 'react-router-dom'
import { PROVIDERS, type Provider } from '../lib/tmdb'

export default function Platforms() {
  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">Browse by Platform</p>
        <h1 className="page-title">Streaming Services</h1>
        <p className="page-copy mono">Filter the catalogue by where it streams</p>
      </section>

      <section className="section shell">
        <div className="platforms-grid" role="list" aria-label="Streaming platforms">
          {PROVIDERS.map((provider: Provider) => (
            <Link
              key={provider.id}
              to={`/films?provider=${provider.id}&region=${provider.region}`}
              className="platform-card"
              role="listitem"
            >
              <div className="platform-card__logo">
                <img src={provider.logo} alt="" loading="lazy" decoding="async" />
              </div>
              <span className="platform-card__name mono">{provider.name}</span>
              <span className="platform-card__region mono">{provider.region}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section shell">
        <div className="shell page-head" style={{ paddingTop: 0 }}>
          <p className="eyebrow mono">Quick Links</p>
          <h2 className="page-title" style={{ fontSize: 'clamp(22px, 3vw, 36px)' }}>Popular on Netflix</h2>
        </div>
        <div className="platform-quicklinks">
          <Link to="/films?provider=8&region=US&sort=popularity.desc" className="quicklink">
            <span className="mono">Trending Movies</span>
          </Link>
          <Link to="/series?provider=8&region=US&sort=popularity.desc" className="quicklink">
            <span className="mono">Trending Series</span>
          </Link>
          <Link to="/films?provider=8&region=US&sort=vote_average.desc" className="quicklink">
            <span className="mono">Top Rated Movies</span>
          </Link>
          <Link to="/series?provider=8&region=US&sort=vote_average.desc" className="quicklink">
            <span className="mono">Top Rated Series</span>
          </Link>
          <Link to="/films?provider=8&region=US&sort=primary_release_date.desc" className="quicklink">
            <span className="mono">New Releases</span>
          </Link>
          <Link to="/series?provider=8&region=US&sort=first_air_date.desc" className="quicklink">
            <span className="mono">Latest Seasons</span>
          </Link>
        </div>
      </section>
    </div>
  )
}