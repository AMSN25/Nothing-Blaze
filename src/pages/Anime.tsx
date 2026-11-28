import { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PosterCard from '../components/PosterCard'
import { GridSkeleton } from '../components/Skeletons'
import { useAsync } from '../hooks/useAsync'
import { fetchDiscover, fetchGenres, type TitleSummary } from '../lib/tmdb'

const ANIME_GENRE_ID = 16

const ANIME_SORTS = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'first_air_date.desc', label: 'Newest' },
]

export default function Anime() {
  const [params, setParams] = useSearchParams()
  const genreParam = params.get('genre')
  const genre: number | 'all' = genreParam ? Number(genreParam) : 'all'
  const sortParam = params.get('sort') ?? ANIME_SORTS[0].value
  const sort = ANIME_SORTS.some((option) => option.value === sortParam) ? sortParam : ANIME_SORTS[0].value

  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [result, setResult] = useState<{
    key: string
    page: number
    items: TitleSummary[]
    totalPages: number
    error: string | null
  }>({
    key: '',
    page: 0,
    items: [],
    totalPages: 1,
    error: null,
  })

  const { data: genres } = useAsync(() => fetchGenres('tv'), [])

  const filterKey = `anime|${genre}|${sort}`
  const current = result.key === filterKey ? result : null
  const items = current?.items ?? []
  const totalPages = current?.totalPages ?? 1
  const error = current?.error ?? null
  const loading = current?.page !== page

  const appending = loading && page > 1
  const firstPage = !appending && items.length === 0

  useEffect(() => {
    let alive = true

    fetchDiscover('tv', { genre: genre === 'all' ? ANIME_GENRE_ID : genre, sort, page })
      .then((next) => {
        if (!alive) return
        setResult((previous) => {
          const sameFilter = previous.key === filterKey
          const carried = sameFilter ? previous.items : []
          return {
            key: filterKey,
            page,
            items: page === 1 || !sameFilter ? next.items : [...carried, ...next.items],
            totalPages: next.totalPages,
            error: null,
          }
        })
      })
      .catch((cause: unknown) => {
        if (!alive) return
        setResult((previous) => {
          const sameFilter = previous.key === filterKey
          return {
            key: filterKey,
            page,
            items: sameFilter ? previous.items : [],
            totalPages: sameFilter ? previous.totalPages : 1,
            error: cause instanceof Error ? cause.message : 'Could not load anime catalogue',
          }
        })
      })

    return () => {
      alive = false
    }
  }, [genre, sort, page, filterKey])

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setPage(1)
    setParams(next)
    setFiltersOpen(false)
  }

  const activeFilters = (genre !== 'all' ? 1 : 0) + (sort !== ANIME_SORTS[0].value ? 1 : 0)

  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">04 / Anime</p>
        <h1 className="page-title">Anime</h1>
        <p className="page-copy mono">
          {loading && firstPage
            ? 'Reading the anime catalogue'
            : `${items.length} titles loaded${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}`}
        </p>
      </section>

      <section className="shell filters" aria-label="Filters">
        <button
          type="button"
          className="filters__toggle"
          aria-expanded={filtersOpen}
          aria-controls="anime-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>Filters</span>
          {activeFilters > 0 ? <span className="filters__count mono">{activeFilters}</span> : null}
          <ChevronDown size={14} strokeWidth={1.8} className="filters__chevron" aria-hidden="true" />
        </button>

        <div id="anime-filters" className={`filters__content ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filters__row">
            <button
              type="button"
              className={`chip ${genre === 'all' ? 'is-active' : ''}`}
              aria-pressed={genre === 'all'}
              onClick={() => updateParam('genre', null)}
            >
              All
            </button>
            {(genres ?? [])
              .filter((g) => g.id !== ANIME_GENRE_ID)
              .map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`chip ${genre === option.id ? 'is-active' : ''}`}
                  aria-pressed={genre === option.id}
                  onClick={() => updateParam('genre', String(option.id))}
                >
                  {option.name}
                </button>
              ))}
          </div>

          <label className="sort">
            <span className="mono">Sort</span>
            <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
              {ANIME_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="section shell" aria-live="polite">
        {error ? <p className="notice mono">Catalogue unavailable: {error}</p> : null}

        {loading && firstPage ? (
          <GridSkeleton />
        ) : (
          <>
            <div className="grid">
              {items.map((item) => (
                <PosterCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>

            {appending ? (
              <p className="empty-line mono" role="status" aria-live="polite">
                Loading page {page}…
              </p>
            ) : null}
          </>
        )}

        {!loading && !error && items.length === 0 ? (
          <p className="empty-line mono">No anime match this filter.</p>
        ) : null}

        {page < totalPages ? (
          <div className="pager">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading}
              onClick={() => setPage((value) => value + 1)}
            >
              {appending ? 'Loading' : 'Load more'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}