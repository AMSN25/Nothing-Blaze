import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { searchTitles, type TitleSummary } from '../lib/tmdb'

interface SearchOverlayProps {
  onClose: () => void
}

interface SearchResponse {
  term: string
  items: TitleSummary[]
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const term = query.trim()
  const searchable = term.length >= 2
  const results = searchable && response?.term === term ? response.items : []
  const loading = searchable && response?.term !== term

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  useEffect(() => {
    if (!searchable) return

    let alive = true
    const timer = window.setTimeout(() => {
      searchTitles(term)
        .then((items) => {
          if (alive) setResponse({ term, items })
        })
        .catch(() => {
          if (alive) setResponse({ term, items: [] })
        })
    }, 280)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [term, searchable])

  const openTitle = (item: TitleSummary) => {
    onClose()
    navigate(`/title/${item.kind}/${item.id}`)
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Search the catalogue">
      <div className="overlay__head">
        <span className="overlay__label mono">Search</span>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close search">
          <X size={15} strokeWidth={1.6} />
        </button>
      </div>

      <div className="overlay__body">
        <input
          ref={inputRef}
          className="overlay__search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search films and series…"
          autoComplete="off"
          autoFocus
          inputMode="search"
          spellCheck={false}
          aria-label="Search films and series"
        />
        <p className="overlay__hint mono">Live catalogue search · Esc to close</p>

        {loading ? <p className="overlay__hint mono">Searching…</p> : null}

        {!loading && searchable && results.length === 0 ? (
          <p className="overlay__empty mono">No matches for “{term}”. Try another word.</p>
        ) : null}

        {results.length > 0 ? (
          <div className="results">
            {results.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                className="result"
                type="button"
                onClick={() => openTitle(item)}
              >
                {item.poster ? (
                  <img className="result__thumb" src={item.poster} alt="" loading="lazy" />
                ) : (
                  <span className="result__thumb">
                    <span className="poster-fallback">
                      <span>{item.title}</span>
                    </span>
                  </span>
                )}
                <span>
                  <span className="result__title">{item.title}</span>
                  <span className="result__meta">
                    {item.year} · {item.kind === 'tv' ? 'Series' : 'Film'} · ★ {item.rating}
                  </span>
                </span>
                <span className="result__go">Open ↗</span>
              </button>
            ))}
          </div>
        ) : null}

        {!loading && !searchable ? (
          <p className="overlay__empty mono">
            Search pulls from the live catalogue. Try “dune”, “severance” or “villeneuve”.
          </p>
        ) : null}
      </div>
    </div>
  )
}
