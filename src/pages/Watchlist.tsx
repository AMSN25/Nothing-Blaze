import { Link } from 'react-router-dom'
import PosterCard from '../components/PosterCard'
import { useWatchlist } from '../hooks/useWatchlist'
import type { TitleSummary } from '../lib/tmdb'

export default function Watchlist() {
  const { items, remove } = useWatchlist()

  const asTitle = (entry: (typeof items)[number]): TitleSummary => ({
    ...entry,
    overview: '',
    genres: [],
    popularity: 0,
    backdrop: '',
    backdropCompact: '',
  })

  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">Your index</p>
        <h1 className="page-title">Watchlist</h1>
        <p className="page-copy mono">
          {items.length
            ? `${items.length} ${items.length === 1 ? 'title' : 'titles'} saved`
            : '0 titles saved'}
        </p>
      </section>

      <section className="section shell">
        {items.length ? (
          <div className="grid">
            {items.map((entry) => (
              <PosterCard
                key={`${entry.kind}-${entry.id}`}
                item={asTitle(entry)}
                onRemove={() => remove(entry.kind, entry.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty empty--inline">
            <h2 className="empty__title">Nothing saved yet</h2>
            <p className="empty__text">
              Add a film or series and it will wait here until you are ready.
            </p>
            <Link className="btn btn--solid" to="/films">
              Browse films
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
