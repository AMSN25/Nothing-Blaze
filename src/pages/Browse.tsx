import { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PosterCard from '../components/PosterCard'
import { GridSkeleton } from '../components/Skeletons'
import { useAsync } from '../hooks/useAsync'
import { fetchDiscover, fetchGenres, type Kind, type TitleSummary, PROVIDERS } from '../lib/tmdb'

interface BrowseProps {
  kind: Kind
  title: string
  eyebrow: string
}

interface PageResult {
  key: string
  page: number
  items: TitleSummary[]
  totalPages: number
  error: string | null
}

const MOVIE_SORTS = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'primary_release_date.desc', label: 'Newest' },
]

const TV_SORTS = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating' },
  { value: 'first_air_date.desc', label: 'Newest' },
]

export default function Browse({ kind, title, eyebrow }: BrowseProps) {
  const [params, setParams] = useSearchParams()
  const genreParam = params.get('genre')
  const genre: number | 'all' = genreParam ? Number(genreParam) : 'all'
  const providerParam = params.get('provider')
  const provider: number | null = providerParam ? Number(providerParam) : null
  const regionParam = params.get('region') ?? 'US'
  const sorts = kind === 'tv' ? TV_SORTS : MOVIE_SORTS
  const sortParam = params.get('sort') ?? sorts[0].value
  const sort = sorts.some((option) => option.value === sortParam) ? sortParam : sorts[0].value

  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [result, setResult] = useState<PageResult>({
    key: '',
    page: 0,
    items: [],
    totalPages: 1,
    error: null,
  })

  const { data: genres } = useAsync(() => fetchGenres(kind), [kind])
  const { data: providers } = useAsync(() => Promise.resolve(PROVIDERS.filter(p => p.region === regionParam)), [regionParam])

  const filterKey = `${kind}|${genre}|${sort}|${provider}|${regionParam}`
  const current = result.key === filterKey ? result : null
  const items = current?.items ?? []
  const totalPages = current?.totalPages ?? 1
  const error = current?.error ?? null
  const loading = current?.page !== page

  const appending = loading && page > 1
  const firstPage = !appending && items.length === 0

  useEffect(() => {
    let alive = true

    fetchDiscover(kind, { genre, sort, page, provider: provider ?? undefined, region: regionParam })
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
            error: cause instanceof Error ? cause.message : 'Could not load the catalogue',
          }
        })
      })

    return () => {
      alive = false
    }
  }, [kind, genre, sort, provider, regionParam, page, filterKey])

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setPage(1)
    setParams(next)
    setFiltersOpen(false)
  }

  const activeProvider = providers?.find(p => p.id === provider)
  const activeFilters =
    (genre !== 'all' ? 1 : 0) +
    (provider ? 1 : 0) +
    (sort !== sorts[0].value ? 1 : 0) +
    (regionParam !== 'US' ? 1 : 0)

  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-copy mono">
          {loading && firstPage
            ? 'Reading the catalogue'
            : `${items.length} titles loaded${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}`}
        </p>
      </section>

      <section className="shell filters" aria-label="Filters">
        <button
          type="button"
          className="filters__toggle"
          aria-expanded={filtersOpen}
          aria-controls="browse-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={15} strokeWidth={1.7} aria-hidden="true" />
          <span>Filters</span>
          {activeFilters > 0 ? <span className="filters__count mono">{activeFilters}</span> : null}
          <ChevronDown size={14} strokeWidth={1.8} className="filters__chevron" aria-hidden="true" />
        </button>

        <div id="browse-filters" className={`filters__content ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filters__row">
            <button
              type="button"
              className={`chip ${genre === 'all' ? 'is-active' : ''}`}
              aria-pressed={genre === 'all'}
              onClick={() => updateParam('genre', null)}
            >
              All
            </button>
            {(genres ?? []).map((option) => (
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

          <div className="filters__row filters__providers">
            <button
              type="button"
              className={`chip ${!provider ? 'is-active' : ''}`}
              aria-pressed={!provider}
              onClick={() => updateParam('provider', null)}
            >
              All Platforms
            </button>
            {(providers ?? []).map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip chip--provider ${provider === option.id ? 'is-active' : ''}`}
                aria-pressed={provider === option.id}
                onClick={() => updateParam('provider', String(option.id))}
              >
                <img src={option.logo} alt="" className="chip__logo" loading="lazy" />
                {option.name}
              </button>
            ))}
          </div>

          <label className="sort">
            <span className="mono">Sort</span>
            <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="region">
            <span className="mono">Region</span>
            <select value={regionParam} onChange={(event) => updateParam('region', event.target.value)}>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="BR">Brazil</option>
              <option value="MX">Mexico</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
            </select>
          </label>
        </div>
      </section>

      {activeProvider && (
        <section className="shell provider-banner" aria-label="Active platform">
          <img src={activeProvider.logo} alt="" className="provider-banner__logo" />
          <span className="provider-banner__text mono">Showing titles on {activeProvider.name}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => updateParam('provider', null)}>Clear</button>
        </section>
      )}

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
          <p className="empty-line mono">No titles match this filter.</p>
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
