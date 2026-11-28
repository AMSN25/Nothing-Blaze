import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink, Play, Plus, Star, ThumbsUp, ThumbsDown, Flag, ListPlus } from 'lucide-react'
import Player from '../components/Player'
import TitleRow from '../components/TitleRow'
import { useAsync } from '../hooks/useAsync'
import { fetchDetails, fetchEpisodes, fetchGenres, type Episode, type Kind, type Season } from '../lib/tmdb'
import { toWatchEntry } from '../context/WatchlistContext'
import { useWatchlist } from '../hooks/useWatchlist'
import { useAuth } from '../context/auth'
import { useMockStore } from '../context/MockStoreContext'
import { enterPlayerLandscape } from '../lib/mobilePlayer'
import {
  addListItem,
  deleteRating,
  fetchRatings,
  recordHistory as recordHistoryFn,
  saveRating,
  saveWatchProgress,
  type RatingEntry,
} from '../lib/supabaseData'

function DetailsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="detail__hero detail__hero--skeleton skeleton" />
      <div className="shell detail__grid">
        <div className="detail__side">
          <div className="detail__poster skeleton" />
        </div>
        <div className="detail__body">
          <div className="skel-line skel-line--wide" />
          <div className="skel-line" />
          <div className="skel-line" />
          <div className="skel-line skel-line--short" />
        </div>
      </div>
    </div>
  )
}

export default function Details() {
  const params = useParams()
  const kind: Kind = params.kind === 'tv' ? 'tv' : 'movie'
  const id = Number(params.id)
  const navigate = useNavigate()
  const { has, toggle } = useWatchlist()
  const { data, loading, error } = useAsync(() => fetchDetails(kind, id), [kind, id])
  const { data: genreList } = useAsync(() => fetchGenres(kind), [kind])
  const { user } = useAuth()
  const { recordHistory, lists, refresh } = useMockStore()
  const castRef = useRef<HTMLDivElement>(null)
  const playerHostRef = useRef<HTMLDivElement>(null)
  const startedAtRef = useRef(0)
  const resumeHandledRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [playTarget, setPlayTarget] = useState<{ season: number; episode: number } | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [showAllSeasons, setShowAllSeasons] = useState(false)
  const episodesRef = useRef<HTMLDivElement>(null)
  const [listMenuOpen, setListMenuOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const startPlayback = (season: number, episode: number) => {
    if (!data) return
    // The host is always mounted, so fullscreen can be requested on this click
    // and the player will inherit the fullscreen state when it renders inside.
    void enterPlayerLandscape(playerHostRef.current)
    startedAtRef.current = Date.now()
    setPlayTarget({ season, episode })
    recordHistory(data, { season, episode })
  }

  // The source plays in an embed we cannot seek or inspect, so progress is
  // measured as time spent watching against the title's runtime.
  useEffect(() => {
    if (!playTarget || !user || !data) return

    const save = () => {
      const started = startedAtRef.current
      if (!started) return
      const elapsed = (Date.now() - started) / 1000
      if (elapsed < 1) return

      let minutes: number
      if (kind === 'tv') {
        const current = episodes.find((entry) => entry.number === playTarget.episode)
        minutes = current?.runtime ?? 45
      } else {
        const match = /^(\d+) min$/.exec(data.runtime)
        minutes = match ? Number(match[1]) : 120
      }

      const pct = Math.min(100, Math.max(1, Math.round((elapsed / (minutes * 60)) * 100)))
      void saveWatchProgress(user.id, kind, data.id, pct).catch(() => undefined)
    }

    const timer = window.setInterval(save, 15000)
    const onHide = () => {
      if (document.visibilityState === 'hidden') save()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      save()
    }
  }, [playTarget, user, kind, data, episodes])

  // A Continue Watching card opens this title straight into the last episode.
  useEffect(() => {
    if (resumeHandledRef.current || loading || !data) return
    const resume = searchParams.get('resume')
    if (!resume) return
    resumeHandledRef.current = true

    const match = /^s(\d+)e(\d+)$/.exec(resume)
    const season = match ? Number(match[1]) : (data.seasons[0]?.number ?? 1)
    const episode = match ? Number(match[2]) : 1
    const userId = user?.id

    void Promise.resolve().then(() => {
      setSearchParams({}, { replace: true })
      startedAtRef.current = Date.now()
      setPlayTarget({ season, episode })
      if (userId) {
        void recordHistoryFn(userId, data, { season, episode }).catch(() => undefined)
      }
    })
  }, [searchParams, setSearchParams, loading, data, user])

  if (loading) return <DetailsSkeleton />

  if (error || !data) {
    return (
      <div className="empty shell">
        <p className="mono muted">Catalogue error</p>
        <h1 className="empty__title">Could not open this title</h1>
        <p className="empty__text">{error ?? 'The title is not available.'}</p>
        <Link className="btn btn--solid" to="/">
          Back to the index
        </Link>
      </div>
    )
  }

  const saved = has(data.kind, data.id)
  const genreNames = (genreList ?? [])
    .filter((genre) => data.genres.includes(genre.id))
    .map((genre) => genre.name)

  const addToList = (listId: string) => {
    if (!user) return
    void addListItem(user.id, listId, {
      id: data.id,
      kind: data.kind,
      title: data.title,
      year: data.year,
      poster: data.poster,
    })
      .then(refresh)
      .catch(() => undefined)
    setListMenuOpen(false)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const scrollCast = (direction: -1 | 1) => {
    const track = castRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' })
  }

  const isPlayingEpisode = (num: number) =>
    playTarget?.season === selectedSeason?.number && playTarget?.episode === num

  const activeEpisodeNumber = playTarget?.season === selectedSeason?.number ? playTarget?.episode ?? 1 : 1

  const focusEpisode = (epNum: number) => {
    const node = episodesRef.current?.querySelector(`[data-ep="${epNum}"]`) as HTMLElement | null
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const stepEpisode = (dir: 1 | -1) => {
    const idx = episodes.findIndex((e) => e.number === activeEpisodeNumber)
    const next = episodes[Math.min(Math.max(idx + dir, 0), Math.max(0, episodes.length - 1))]
    if (next) focusEpisode(next.number)
  }

  const handleSeasonClick = async (season: Season) => {
    if (selectedSeason?.id === season.id) {
      setSelectedSeason(null)
      setEpisodes([])
      return
    }
    setSelectedSeason(season)
    setEpisodesLoading(true)
    try {
      const eps = await fetchEpisodes(id, season.number)
      setEpisodes(eps)
    } catch {
      setEpisodes([])
    } finally {
      setEpisodesLoading(false)
    }
  }

  return (
    <article className="detail">
      <div className="detail__hero">
        <div
          className="detail__bg"
          style={data.backdrop ? { backgroundImage: `url(${data.backdrop})` } : undefined}
        />
        <div className="detail__shade" />

        <div className="shell detail__hero-inner">
          <button
            className="icon-btn detail__back"
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            aria-label="Go back"
          >
            <ArrowLeft size={16} strokeWidth={1.6} />
          </button>

          <div className="detail__headline">
            <p className="kicker">
              {data.kind === 'tv' ? 'Series' : 'Film'} · {data.status}
            </p>
            <h1 className="detail__title">{data.title}</h1>
            <div className="hero__meta">
              <span>
                <b>{data.year}</b>
              </span>
              <span>{data.runtime}</span>
              <span>{data.rating === 'NR' ? 'Not rated' : `${data.rating} / 10`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shell detail__grid">
        <aside className="detail__side">
          <div className="detail__poster">
            {data.poster ? (
              <img src={data.poster} alt={`${data.title} poster`} />
            ) : (
              <span className="poster-fallback">
                <span>{data.title}</span>
              </span>
            )}
          </div>

          <div className="detail__actions">
            <button
              className="btn btn--solid btn--full"
              type="button"
              onClick={() => startPlayback(data.seasons[0]?.number ?? 1, 1)}
            >
              <Play size={11} fill="currentColor" strokeWidth={0} />
              Play now
            </button>

            <button
              className="btn btn--ghost btn--full"
              type="button"
              onClick={() => toggle(toWatchEntry(data))}
            >
              {saved ? <Check size={12} strokeWidth={2} /> : <Plus size={12} strokeWidth={2} />}
              {saved ? 'In your list' : 'Add to list'}
            </button>

            {user && (
              <div className="detail__list-menu">
                <button
                  className="btn btn--ghost btn--full"
                  type="button"
                  onClick={() => setListMenuOpen(!listMenuOpen)}
                >
                  <ListPlus size={12} strokeWidth={2} />
                  My lists
                </button>
                {listMenuOpen ? (
                  <div className="detail__list-dropdown" role="menu">
                    {lists.length === 0 ? (
                      <div className="detail__list-empty">
                        <p className="mono">No lists yet</p>
                        <Link to="/lists" className="btn btn--sm btn--solid" onClick={() => setListMenuOpen(false)}>
                          <Plus size={10} strokeWidth={1.5} />
                          Create list
                        </Link>
                      </div>
                    ) : (
                      lists.map((list) => (
                        <button
                          key={list.id}
                          className="detail__list-option"
                          type="button"
                          role="menuitem"
                          onClick={() => addToList(list.id)}
                        >
                          <span>{list.name}</span>
                          <span className="mono">{list.items.length} titles</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )}

{data.trailerKey ? (
              <a
                className="btn btn--ghost btn--full"
                href={`https://www.youtube.com/watch?v=${data.trailerKey}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={12} strokeWidth={2} />
                Watch trailer
              </a>
            ) : null}

            <button className="btn btn--ghost btn--full" type="button" onClick={share}>
              {copied ? 'Link copied' : 'Share title'}
            </button>
          </div>
        </aside>

        <div className="detail__body">
          {data.tagline ? <p className="detail__tagline">“{data.tagline}”</p> : null}
          <p className="detail__overview">
            {data.overview || 'No synopsis has been filed for this title yet.'}
          </p>

          {genreNames.length ? (
            <div className="chips">
              {genreNames.map((name) => (
                <span className="chip" key={name}>
                  {name}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="facts facts--inline">
            <div className="spec">
              <dt>Status</dt>
              <dd>{data.status}</dd>
            </div>
            <div className="spec">
              <dt>Runtime</dt>
              <dd>{data.runtime}</dd>
            </div>
            <div className="spec">
              <dt>Language</dt>
              <dd>{data.language}</dd>
            </div>
            <div className="spec">
              <dt>Votes</dt>
              <dd>{data.voteCount.toLocaleString('en-US')}</dd>
            </div>
          </dl>

          {data.cast.length ? (
            <section className="detail__section" aria-labelledby="cast-title">
              <h2 className="detail__section-title" id="cast-title">
                Cast
              </h2>
              <div className="row__wrap">
                <button
                  className="row__nav row__nav--prev"
                  type="button"
                  onClick={() => scrollCast(-1)}
                  aria-label="Scroll cast left"
                >
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <div className="cast" ref={castRef}>
                  {data.cast.map((person) => (
                    <Link className="castcard" to={`/person/${person.id}`} key={person.id}>
                      <span className="castcard__photo">
                        {person.profile ? (
                          <img src={person.profile} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span className="poster-fallback">
                            <span>{person.name}</span>
                          </span>
                        )}
                      </span>
                      <span className="castcard__name">{person.name}</span>
                      <span className="castcard__role mono">{person.character || 'Cast'}</span>
                    </Link>
                  ))}
                </div>
                <button
                  className="row__nav row__nav--next"
                  type="button"
                  onClick={() => scrollCast(1)}
                  aria-label="Scroll cast right"
                >
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            </section>
          ) : null}

{data.seasons.length ? (
            <section className="detail__section" aria-labelledby="seasons-title">
              <div className="detail__section-head">
                <h2 className="detail__section-title" id="seasons-title">
                  Seasons
                </h2>
                <div className="seasons-bar" role="group" aria-label="Season groups">
                  <div className="season-group" aria-expanded={showAllSeasons}>
                    <div className="season-pills season-pills-slot1">
                      {data.seasons
                        .filter((s) => s.number === 1)
                        .map((season) => (
                          <button
                            key={season.id}
                            type="button"
                            role="tab"
                            aria-selected={selectedSeason?.id === season.id}
                            aria-controls={`episodes-panel-s${season.number}`}
                            id={`season-tab-s${season.number}`}
                            data-slot="1"
                            className={`season-pill ${selectedSeason?.id === season.id ? 'is-active' : ''}`}
                            onClick={() => handleSeasonClick(season)}
                          >
                            <span className="season-pill__label mono">S{String(season.number).padStart(2, '0')}</span>
                            <span className="season-pill__count mono">{season.episodes} eps</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="season-group" aria-expanded={showAllSeasons}>
                    <div className="season-pills season-pills-slot2">
                      {data.seasons
                        .filter((s) => s.number !== 1)
                        .map((season) => (
                          <button
                            key={season.id}
                            type="button"
                            role="tab"
                            aria-selected={selectedSeason?.id === season.id}
                            aria-controls={`episodes-panel-s${season.number}`}
                            id={`season-tab-s${season.number}`}
                            data-slot="2"
                            className={`season-pill ${selectedSeason?.id === season.id ? 'is-active' : ''}`}
                            onClick={() => handleSeasonClick(season)}
                          >
                            <span className="season-pill__label mono">S{String(season.number).padStart(2, '0')}</span>
                            <span className="season-pill__count mono">{season.episodes} eps</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  {data.seasons.filter((s) => s.number !== 1).length ? (
                    <button
                      className="season-all"
                      type="button"
                      aria-expanded={showAllSeasons}
                      onClick={() => setShowAllSeasons(!showAllSeasons)}
                    >
                      {showAllSeasons ? 'Less ▴' : 'All ▾'}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {selectedSeason && (episodesLoading || episodes.length) ? (
            <section className="detail__section" aria-labelledby={`episodes-title-s${selectedSeason.number}`}>
              <div className="detail__section-head">
                <h2 className="detail__section-title" id={`episodes-title-s${selectedSeason.number}`}>
                  {selectedSeason.name} — Episodes
                </h2>
                {episodes.length ? (
                  <div className="episode-nav" aria-label="Episode navigation">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => stepEpisode(-1)}
                      aria-label="Previous episode"
                    >
                      <ChevronUp size={14} strokeWidth={1.8} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => stepEpisode(1)}
                      aria-label="Next episode"
                    >
                      <ChevronDown size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                ) : null}
              </div>
              {episodesLoading ? (
                <div className="episode-timeline" aria-busy="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div className="episode-row skeleton" key={i}>
                      <span className="episode-row__rail" />
                      <span className="episode-row__main">
                        <span className="skel-line skel-line--wide" />
                        <span className="skel-line skel-line--short" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="episode-timeline"
                  id={`episodes-panel-s${selectedSeason.number}`}
                  role="tabpanel"
                  aria-labelledby={`season-tab-s${selectedSeason.number}`}
                  ref={episodesRef}
                >
                  {episodes.map((episode) => (
                    <button
                      type="button"
                      key={episode.id}
                      data-ep={episode.number}
                      className={`episode-row ${isPlayingEpisode(episode.number) ? 'is-playing' : ''}`}
                      onClick={() => startPlayback(selectedSeason.number, episode.number)}
                      aria-label={`Play ${selectedSeason.name}, episode ${episode.number}: ${episode.name}`}
                    >
                      <span className="episode-row__rail" aria-hidden="true">
                        <span className="episode-row__dot" />
                      </span>
                      <span className="episode-row__num mono">E{String(episode.number).padStart(2, '0')}</span>
                      <span className="episode-row__main">
                        <span className="episode-row__title">{episode.name}</span>
                        <span className="episode-row__overview">
                          {episode.overview || 'No synopsis available.'}
                        </span>
                        <span className="episode-row__meta mono">
                          {episode.airDate ? <span>{episode.airDate}</span> : null}
                          {episode.runtime ? <span>{episode.runtime} min</span> : null}
                          <span>{episode.rating} / 10</span>
                        </span>
                      </span>
                      <span className="episode-row__play" aria-hidden="true">
                        <Play size={12} fill="currentColor" strokeWidth={0} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <RatingsReviews titleId={data.id} kind={kind} title={data.title} />
        </div>
      </div>

      <TitleRow eyebrow="Next" title="More Like This" items={data.similar} />

      <div className="detail__quickbar shell">
        <button
          className="btn btn--solid"
          type="button"
          onClick={() => startPlayback(data.seasons[0]?.number ?? 1, 1)}
        >
          <Play size={12} fill="currentColor" strokeWidth={0} />
          Play now
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => toggle(toWatchEntry(data))}
        >
          {saved ? <Check size={12} strokeWidth={2} /> : <Plus size={12} strokeWidth={2} />}
          {saved ? 'In your list' : 'Add to list'}
        </button>
      </div>

      <div
        ref={playerHostRef}
        className={`player-host ${playTarget ? 'is-active' : ''}`}
      >
        {playTarget ? (
          <Player
            key={`${playTarget.season}-${playTarget.episode}`}
            title={data}
            kind={kind}
            initialSeason={playTarget.season}
            initialEpisode={playTarget.episode}
            onClose={() => setPlayTarget(null)}
          />
        ) : null}
      </div>
    </article>
  )
}

// Ratings & Reviews component
interface RatingsReviewsProps {
  titleId: number
  kind: Kind
  title: string
}

function RatingsReviews({ titleId, kind, title }: RatingsReviewsProps) {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<RatingEntry[]>([])
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [score, setScore] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hoverScore, setHoverScore] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void fetchRatings(kind, titleId)
      .then((rows) => {
        if (active) setRatings(rows)
      })
      .catch(() => {
        if (active) setRatings([])
      })
      .finally(() => {
        if (active) setLoadingRatings(false)
      })
    return () => {
      active = false
    }
  }, [kind, titleId])

  const userRating = user ? ratings.find((rating) => rating.userId === user.id) ?? null : null
  const avgScore = ratings.length
    ? (ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(1)
    : '—'

  const openRatingForm = () => {
    setScore(userRating?.score ?? 0)
    setReview(userRating?.review ?? '')
    setShowForm(true)
  }

  const reloadRatings = async () => {
    setRatings(await fetchRatings(kind, titleId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!score || !user) return
    setSubmitting(true)
    try {
      await saveRating(user.id, kind, titleId, score, review, {
        name: user.name,
        avatar: user.avatar ?? '',
      })
      await reloadRatings()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your rating')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    try {
      await deleteRating(user.id, kind, titleId)
      await reloadRatings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your rating')
    }
  }

  return (
    <section className="detail__section ratings-reviews" aria-labelledby="ratings-title">
      <h2 className="detail__section-title" id="ratings-title">
        Ratings & Reviews
      </h2>

      {error ? (
        <div className="auth-error" role="alert">
          <AlertCircle size={14} strokeWidth={2} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="ratings-summary">
        <div className="ratings-score">
          <span className="ratings-score-value">{avgScore}</span>
          <span className="ratings-score-label mono">/ 10</span>
        </div>
        <div className="ratings-stars">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Star
              key={n}
              size={18}
              strokeWidth={n <= Math.round(Number(avgScore)) ? 0 : 1.5}
              fill={n <= Math.round(Number(avgScore)) ? 'currentColor' : 'none'}
              color={n <= Math.round(Number(avgScore)) ? 'var(--accent)' : 'var(--dim)'}
              className="ratings-star"
            />
          ))}
        </div>
        <p className="ratings-count mono">
          {loadingRatings ? 'Loading ratings…' : `${ratings.length} ${ratings.length === 1 ? 'rating' : 'ratings'}`}
        </p>
      </div>

      {user && !userRating ? (
        <button className="btn btn--solid" type="button" onClick={openRatingForm}>
          <Star size={14} strokeWidth={2} fill="currentColor" />
          Rate this
        </button>
      ) : null}

      {showForm && (
        <form onSubmit={handleSubmit} className="rating-form">
          <fieldset className="rating-stars-input">
            <legend className="mono">Your rating</legend>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <label key={n} className="rating-star-label">
                <input
                  type="radio"
                  name="score"
                  value={n}
                  checked={score === n}
                  onChange={() => setScore(n)}
                  className="visually-hidden"
                />
                <Star
                  size={24}
                  strokeWidth={score >= n || hoverScore >= n ? 0 : 1.5}
                  fill={score >= n || hoverScore >= n ? 'currentColor' : 'none'}
                  color={score >= n || hoverScore >= n ? 'var(--accent)' : 'var(--dim)'}
                  onMouseEnter={() => setHoverScore(n)}
                  onMouseLeave={() => setHoverScore(0)}
                />
              </label>
            ))}
          </fieldset>

          <div className="field">
            <label htmlFor="review" className="field-label mono">Review (optional)</label>
            <textarea
              id="review"
              className="field-input field-textarea"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
            />
          </div>

          <div className="rating-form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--solid" disabled={!score || submitting}>
              {submitting ? 'Submitting…' : userRating ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {userRating && !showForm && (
        <div className="user-rating-card">
          <div className="user-rating-header">
            <div className="user-rating-avatar">
              {userRating.authorAvatar ? (
                <img src={userRating.authorAvatar} alt="" />
              ) : (
                <span>{userRating.authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="user-rating-name">{userRating.authorName}</p>
              <p className="user-rating-date mono">{new Date(userRating.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="user-rating-score">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Star
                  key={n}
                  size={14}
                  strokeWidth={n <= userRating.score ? 0 : 1.5}
                  fill={n <= userRating.score ? 'currentColor' : 'none'}
                  color={n <= userRating.score ? 'var(--accent)' : 'var(--dim)'}
                />
              ))}
            </div>
          </div>
          {userRating.review && <p className="user-rating-review">{userRating.review}</p>}
          <div className="user-rating-actions">
            <button className="btn btn--ghost btn--sm" onClick={openRatingForm}>
              <Star size={12} strokeWidth={1.5} />
              Edit
            </button>
            <button className="btn btn--ghost btn--sm btn--danger" onClick={handleDelete}>
              <Flag size={12} strokeWidth={1.5} />
              Delete
            </button>
          </div>
        </div>
      )}

      {ratings.length > 0 && (
        <div className="ratings-list">
          {ratings
            .filter((rating) => !userRating || rating.userId !== userRating.userId)
            .slice(0, 10)
            .map((rating) => (
              <article key={rating.id} className="rating-card">
                <div className="rating-card-header">
                  <div className="rating-card-avatar">
                    {rating.authorAvatar ? (
                      <img src={rating.authorAvatar} alt="" />
                    ) : (
                      <span>{rating.authorName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="rating-card-name">{rating.authorName}</p>
                    <p className="rating-card-date mono">{new Date(rating.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rating-card-score">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        strokeWidth={n <= rating.score ? 0 : 1.5}
                        fill={n <= rating.score ? 'currentColor' : 'none'}
                        color={n <= rating.score ? 'var(--accent)' : 'var(--dim)'}
                      />
                    ))}
                  </div>
                </div>
                {rating.review && <p className="rating-card-review">{rating.review}</p>}
                <div className="rating-card-actions">
                  <button className="rating-helpful" aria-label="Helpful">
                    <ThumbsUp size={14} strokeWidth={1.5} />
                    <span>{rating.helpful}</span>
                  </button>
                  <button className="rating-helpful" aria-label="Not helpful">
                    <ThumbsDown size={14} strokeWidth={1.5} />
                  </button>
                  <button className="rating-helpful" aria-label="Report">
                    <Flag size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}

      {ratings.length === 0 && !showForm && !loadingRatings && (
        <p className="empty-line mono">No ratings yet. Be the first to rate <strong>{title}</strong>!</p>
      )}
    </section>
  )
}


