import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useAsync } from '../hooks/useAsync'
import { fetchHistory } from '../lib/supabaseData'
import SectionHead from './SectionHead'

const pad = (value: number) => String(value).padStart(2, '0')

function resumeParam(kind: string, season: number | null, episode: number | null) {
  if (season && episode) return `?resume=s${season}e${episode}`
  return kind === 'movie' ? '?resume=1' : ''
}

export default function ContinueWatching() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data } = useAsync(
    () => (userId ? fetchHistory(userId) : Promise.resolve([])),
    [userId],
  )
  const trackRef = useRef<HTMLDivElement>(null)

  const items = (data ?? [])
    .filter((entry) => entry.progress > 0 && entry.progress < 100)
    .slice(0, 12)

  if (!items.length) return null

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="section row">
      <SectionHead eyebrow="00 / Resume" title="Continue Watching" />

      <div className="row__wrap">
        <button
          className="row__nav row__nav--prev"
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll Continue Watching left"
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
        </button>

        <div className="row__track" ref={trackRef}>
          {items.map((entry) => (
            <div className="row__item" key={entry.titleId}>
              <div className="card-wrap">
                <Link
                  className="card"
                  to={`/title/${entry.kind}/${entry.titleId}${resumeParam(entry.kind, entry.season, entry.episode)}`}
                >
                  <span className="card__poster">
                    {entry.poster ? (
                      <img
                        src={entry.poster}
                        alt={`${entry.title} poster`}
                        width={200}
                        height={300}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="poster-fallback">
                        <span>{entry.title}</span>
                      </span>
                    )}
                    <span className="continue__bar" aria-hidden="true">
                      <span className="continue__fill" style={{ width: `${entry.progress}%` }} />
                    </span>
                    <span className="card__play" aria-hidden="true">
                      <Play size={11} fill="currentColor" />
                    </span>
                  </span>
                  <span className="card__title">{entry.title}</span>
                  <span className="card__meta">
                    <b>{entry.progress}%</b>
                    <i />
                    {entry.season && entry.episode
                      ? `S${pad(entry.season)} · E${pad(entry.episode)}`
                      : 'Resume'}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <button
          className="row__nav row__nav--next"
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll Continue Watching right"
        >
          <ChevronRight size={16} strokeWidth={1.8} />
        </button>
      </div>
    </section>
  )
}
