import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Pause, Play, Plus } from 'lucide-react'
import type { TitleSummary } from '../lib/tmdb'
import { toWatchEntry } from '../context/WatchlistContext'
import { useWatchlist } from '../hooks/useWatchlist'

interface HeroProps {
  items: TitleSummary[]
  loading: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')
const HERO_SLIDES = 6

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Hero({ items, loading }: HeroProps) {
  const [picked, setPicked] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [userPaused, setUserPaused] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const paused = hovered || userPaused
  const { has, toggle } = useWatchlist()

  const slides = useMemo(() => {
    const movies = items.filter((item) => item.kind === 'movie')
    return shuffle(movies).slice(0, HERO_SLIDES)
  }, [items])

  const slideCount = slides.length
  const index = slideCount ? picked % slideCount : 0
  const active = slides[index]
  const saved = active ? has(active.kind, active.id) : false

  useEffect(() => {
    if (paused || slideCount < 2) return
    const timer = window.setInterval(() => {
      setPicked((current) => (current + 1) % slideCount)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [paused, slideCount])

  return (
    <section
      className="hero"
      data-enter="rise"
      aria-label="Featured this week"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="hero__media" aria-hidden="true">
        {slides.map((item, slideIndex) => {
          const isActiveSlide = slideIndex === index
          // Only the visible slide gets a background image: other slides would
          // otherwise download a full-size backdrop nobody is looking at.
          const style = isActiveSlide && item.backdrop
            ? {
                '--hero-img-lg': `url("${item.backdrop}")`,
                '--hero-img-sm': `url("${item.backdropCompact || item.backdrop}")`,
              } as CSSProperties
            : undefined
          return (
            <div
              key={`${item.kind}-${item.id}`}
              className={`hero__slide ${isActiveSlide ? 'is-active' : ''}`}
              style={style}
            />
          )
        })}
        {loading ? <div className="hero__slide is-active hero__slide--empty skeleton" /> : null}
      </div>

      <div className="hero__inner shell">
        <div className="hero__copy">
          <p className="kicker">
            {loading
              ? 'Reading the catalogue'
              : active
                ? `Featured · ${pad(index + 1)} / ${pad(slides.length)}`
                : 'CineBlaze index'}
          </p>

          {loading || !active ? (
            <>
              <h1 className="hero__title">CINEBLAZE</h1>
              <div className="hero__meta">
                <span>
                  <b>Films</b>
                </span>
                <span>Series</span>
                <span>Anime</span>
              </div>
              <p className="hero__desc">
                A catalogue for people who care how a frame looks. Loading this week&apos;s spotlight.
              </p>
            </>
          ) : (
            <>
              <h1 key={active.id} className="hero__title">
                {active.title}
              </h1>
              <div className="hero__meta">
                <span>
                  <b>{active.year}</b>
                </span>
                <span>Film</span>
                <span>{active.rating === 'NR' ? 'Not rated' : `${active.rating} / 10`}</span>
              </div>
              <p className="hero__desc">{active.overview || 'No synopsis has been filed for this title yet.'}</p>
              <div className="hero__actions">
                <Link className="btn btn--solid" to={`/title/${active.kind}/${active.id}`}>
                  Open title
                  <ArrowUpRight size={12} strokeWidth={2} />
                </Link>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => toggle(toWatchEntry(active))}
                >
                  {saved ? <Check size={12} strokeWidth={2} /> : <Plus size={12} strokeWidth={2} />}
                  {saved ? 'In your list' : 'Add to list'}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="hero__rail" aria-label="Title specifications">
          <dl>
            <div className="spec">
              <dt>Rating</dt>
              <dd>{active && active.rating !== 'NR' ? `★ ${active.rating}` : '—'}</dd>
            </div>
            <div className="spec">
              <dt>Released</dt>
              <dd>{active?.year ?? '—'}</dd>
            </div>
            <div className="spec">
              <dt>Format</dt>
              <dd>Film</dd>
            </div>
            <div className="spec">
              <dt>Source</dt>
              <dd>TMDB</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="hero__foot shell">
        <p className="hero__note mono">
          <span className="hero__note-dot" aria-hidden="true" />
          Rotating spotlight · {pad(slides.length || HERO_SLIDES)} titles
        </p>
        <div className="hero__foot-controls">
          <button
            className="hero__pause"
            type="button"
            aria-pressed={userPaused}
            aria-label={userPaused ? 'Resume spotlight rotation' : 'Pause spotlight rotation'}
            onClick={() => setUserPaused((value) => !value)}
          >
            {userPaused ? (
              <Play size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            ) : (
              <Pause size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            )}
            <span className="mono">{userPaused ? 'Play' : 'Pause'}</span>
          </button>
          <div className="hero__dots" role="tablist" aria-label="Spotlight titles">
            {slides.map((item, dotIndex) => (
              <button
                key={`${item.kind}-${item.id}`}
                className="hero__dot"
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Spotlight ${pad(dotIndex + 1)}: ${item.title}`}
                onClick={() => setPicked(dotIndex)}
              >
                {pad(dotIndex + 1)}
              </button>
            ))}
            {!slides.length ? (
              <>
                <span className="hero__dot" aria-hidden="true">01</span>
                <span className="hero__dot" aria-hidden="true">02</span>
                <span className="hero__dot" aria-hidden="true">03</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
