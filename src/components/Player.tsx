import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Loader,
  Maximize,
  Minimize,
  RefreshCw,
  X,
} from 'lucide-react'
import type { Kind, TitleDetails } from '../lib/tmdb'
import { enterPlayerLandscape, exitPlayerFullscreen } from '../lib/mobilePlayer'
import {
  EMBED_PROVIDERS,
  STREAM_PROVIDERS,
  embedUrlFor,
  type StreamMode,
  type StreamProvider,
} from '../lib/streaming'

interface PlayerProps {
  title: TitleDetails
  kind: Kind
  initialSeason?: number
  initialEpisode?: number
  onClose: () => void
}

/** If a source has not loaded by now, automatically try the next provider. */
const PROVIDER_TIMEOUT = 12000
const EMBED_KEY = 'cineblaze.player.embed'
const ALL_SOURCES_ERROR =
  'Every source timed out. Pick another source below or try again in a moment.'

function readStoredEmbed(): string {
  try {
    const saved = window.localStorage.getItem(EMBED_KEY)
    if (saved && EMBED_PROVIDERS.some((provider) => provider.id === saved)) return saved
  } catch {
    // Storage may be blocked; fall back to the first embed server.
  }
  return EMBED_PROVIDERS[0]?.id ?? ''
}

export default function Player({ title, kind, initialSeason, initialEpisode, onClose }: PlayerProps) {
  const [mode, setMode] = useState<StreamMode>('direct')
  const [embedId, setEmbedId] = useState<string>(readStoredEmbed)
  const [menuOpen, setMenuOpen] = useState(false)
  const [season, setSeason] = useState(() => initialSeason ?? title.seasons[0]?.number ?? 1)
  const [episode, setEpisode] = useState(() => initialEpisode ?? 1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [tick, setTick] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  const isSeries = kind === 'tv' && title.seasons.length > 0
  const activeSeason = title.seasons.find((entry) => entry.number === season)

  const candidates = useMemo<StreamProvider[]>(() => {
    if (mode === 'embed' && EMBED_PROVIDERS.length) {
      const first = EMBED_PROVIDERS.find((provider) => provider.id === embedId) ?? EMBED_PROVIDERS[0]
      return [first, ...EMBED_PROVIDERS.filter((provider) => provider.id !== first.id)]
    }
    return STREAM_PROVIDERS
  }, [mode, embedId])

  const current = candidates[index] ?? null

  const src = useMemo(() => {
    if (!current) return null
    return embedUrlFor(current, kind, title.id, season, episode)
  }, [current, kind, title.id, season, episode])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const advance = useCallback(() => {
    if (index + 1 < candidates.length) {
      setIndex(index + 1)
      return
    }
    setLoading(false)
    setError(ALL_SOURCES_ERROR)
  }, [index, candidates.length])

  useEffect(() => {
    if (!src || !loading) return
    const timer = window.setTimeout(advance, PROVIDER_TIMEOUT)
    return () => window.clearTimeout(timer)
  }, [src, loading, advance])

  const apply = useCallback((nextMode: StreamMode, nextEmbed?: string) => {
    setMode(nextMode)
    if (nextEmbed) {
      setEmbedId(nextEmbed)
      try {
        window.localStorage.setItem(EMBED_KEY, nextEmbed)
      } catch {
        // Ignore storage failures; the switch still works for this session.
      }
    }
    setIndex(0)
    setLoading(true)
    setError(null)
    setMenuOpen(false)
  }, [])

  const retry = useCallback(() => {
    setIndex(0)
    setLoading(true)
    setError(null)
    setTick((value) => value + 1)
  }, [])

  const close = useCallback(() => {
    void exitPlayerFullscreen()
    onClose()
  }, [onClose])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await shellRef.current?.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      // Some browsers block fullscreen without a direct gesture; ignore.
    }
  }, [])

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Play now asks for fullscreen on the original click. This covers browsers
  // that ignore that call by targeting the player element once it mounts.
  useEffect(() => {
    if (document.fullscreenElement) return
    void enterPlayerLandscape(shellRef.current)
  }, [])

  useEffect(() => {
    return () => {
      void exitPlayerFullscreen()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false)
          return
        }
        close()
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, menuOpen, toggleFullscreen])

  const key = `${current?.id ?? 'src'}#${index}#${tick}#${season}#${episode}`

  const sourceRow = (provider: StreamProvider) => {
    const active = provider.id === current?.id
    return (
      <button
        key={provider.id}
        type="button"
        role="menuitemradio"
        aria-checked={active}
        className={`srcrow ${active ? 'is-active' : ''}`}
        onClick={() => apply(provider.mode, provider.mode === 'embed' ? provider.id : undefined)}
      >
        <span className="srcrow__name">{provider.name}</span>
        <span className="srcrow__note mono">{provider.note}</span>
        {active ? <Check size={13} strokeWidth={2} /> : null}
      </button>
    )
  }

  return (
    <div
      ref={shellRef}
      className="player"
      role="dialog"
      aria-modal="true"
      aria-label={`Player: ${title.title}`}
    >
      <div className="player__bar">
        <div className="player__id">
          <span className="player__brand">CINEBLAZE</span>
          <span className="player__title">{title.title}</span>
          {isSeries ? (
            <span className="player__tag mono">
              S{String(season).padStart(2, '0')} · E{String(episode).padStart(2, '0')}
            </span>
          ) : null}
        </div>

        <div className="player__tools">
          <div className="player__src">
            <button
              type="button"
              className="player__srcbtn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Source: ${current?.name ?? 'unknown'}. Change source`}
            >
              <span>{current?.name ?? 'Source'}</span>
              <ChevronDown size={14} strokeWidth={1.8} className={menuOpen ? 'is-open' : ''} />
            </button>

            {menuOpen ? (
              <div className="player__menu" role="menu" aria-label="Streaming sources">
                <p className="player__menuhead mono">Direct</p>
                {STREAM_PROVIDERS.filter((provider) => provider.mode === 'direct').map(sourceRow)}
                <p className="player__menuhead mono">Embed servers</p>
                {EMBED_PROVIDERS.map(sourceRow)}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="player__icon"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          >
            {fullscreen ? <Minimize size={16} strokeWidth={1.8} /> : <Maximize size={16} strokeWidth={1.8} />}
          </button>

          <button
            type="button"
            className="player__icon"
            onClick={close}
            aria-label="Close player"
            title="Close (Esc)"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="player__scrim"
          tabIndex={-1}
          aria-label="Close source menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="player__stage">
        {src ? (
          <iframe
            key={key}
            src={src}
            className="player__frame"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            title={`Playing ${title.title}`}
            onLoad={() => setLoading(false)}
            onError={advance}
          />
        ) : null}

        {loading ? (
          <div className="player__state">
            <Loader size={26} strokeWidth={1.6} className="player__spin" />
            <p className="mono">Loading from {current?.name ?? 'source'}</p>
          </div>
        ) : error ? (
          <div className="player__state">
            <p className="player__err">{error}</p>
            <div className="player__actions">
              <button type="button" className="btn btn--solid" onClick={retry}>
                <RefreshCw size={12} strokeWidth={2} />
                Retry
              </button>
              <button type="button" className="btn btn--ghost" onClick={close}>
                Close
              </button>
            </div>
            <div className="player__sources">
              {STREAM_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="chip"
                  onClick={() =>
                    apply(provider.mode, provider.mode === 'embed' ? provider.id : undefined)
                  }
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isSeries && title.seasons.length > 1 ? (
        <div className="player__eps">
          <label className="player__epfield">
            <span className="mono">Season</span>
            <select
              value={season}
              onChange={(event) => {
                setSeason(Number(event.target.value))
                setEpisode(1)
                retry()
              }}
            >
              {title.seasons.map((entry) => (
                <option key={entry.id} value={entry.number}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="player__epfield">
            <span className="mono">Episode</span>
            <select
              value={episode}
              onChange={(event) => {
                setEpisode(Number(event.target.value))
                retry()
              }}
            >
              {Array.from({ length: Math.max(activeSeason?.episodes ?? 1, 1) }).map((_, position) => (
                <option key={position} value={position + 1}>
                  Episode {position + 1}
                </option>
              ))}
            </select>
          </label>

          <p className="player__epnote mono">
            {activeSeason ? `${activeSeason.episodes} episodes in this season` : 'Season data pending'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
