export type Kind = 'movie' | 'tv'

const API = 'https://api.themoviedb.org/3'
const IMAGE = 'https://image.tmdb.org/t/p'
const KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined

export const imageUrl = (path: string | null | undefined, size = 'w780') =>
  path ? `${IMAGE}/${size}${path}` : ''

export interface TitleSummary {
  id: number
  kind: Kind
  title: string
  year: string
  rating: string
  poster: string
  backdrop: string
  /** 780px backdrop for phone viewports; `backdrop` stays at 1280px for desktop. */
  backdropCompact: string
  overview: string
  genres: number[]
  popularity: number
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile: string
}

export interface Season {
  id: number
  name: string
  number: number
  episodes: number
  year: string
  poster: string
}

export interface Episode {
  id: number
  name: string
  number: number
  season: number
  overview: string
  airDate: string
  rating: string
  still: string
  runtime: number | null
}

export interface TitleDetails extends TitleSummary {
  tagline: string
  status: string
  language: string
  runtime: string
  voteCount: number
  cast: CastMember[]
  seasons: Season[]
  similar: TitleSummary[]
  trailerKey: string | null
}

export interface Genre {
  id: number
  name: string
}

export interface PersonSummary {
  id: number
  name: string
  department: string
  profile: string
  popularity: number
}

export interface PersonDetails extends PersonSummary {
  biography: string
  birthday: string | null
  deathday: string | null
  place: string | null
  credits: TitleSummary[]
}

export interface DiscoverPage {
  items: TitleSummary[]
  page: number
  totalPages: number
}

const cache = new Map<string, unknown>()
const CACHE_LIMIT = 200

async function api<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  if (!KEY) throw new Error('Missing TMDB key. Add VITE_TMDB_API_KEY to your .env file and restart.')
  const url = new URL(`${API}${path}`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined) url.searchParams.set(name, String(value))
  })

  const href = url.toString()
  if (cache.has(href)) return cache.get(href) as T

  const response = await fetch(href)
  if (!response.ok) throw new Error(`Catalogue request failed (${response.status})`)
  const data = (await response.json()) as T
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(href, data)
  return data
}

const kindOf = (raw: any): Kind =>
  raw?.media_type === 'tv' || raw?.first_air_date || (raw?.name && !raw?.title) ? 'tv' : 'movie'

const KNOWN_FOR_LIMIT = 24

export const mapTitle = (raw: any, forcedKind?: Kind): TitleSummary => {
  const score = Number(raw?.vote_average ?? 0)
  return {
    id: Number(raw?.id),
    kind: forcedKind ?? kindOf(raw),
    title: raw?.title ?? raw?.name ?? raw?.original_name ?? 'Untitled',
    year: String(raw?.release_date ?? raw?.first_air_date ?? '').slice(0, 4) || '----',
    rating: score > 0 ? score.toFixed(1) : 'NR',
    poster: imageUrl(raw?.poster_path, 'w500'),
    backdrop: imageUrl(raw?.backdrop_path, 'w1280'),
    backdropCompact: imageUrl(raw?.backdrop_path, 'w780'),
    overview: raw?.overview ?? '',
    genres: Array.isArray(raw?.genre_ids)
      ? raw.genre_ids
      : Array.isArray(raw?.genres)
        ? raw.genres.map((genre: any) => genre.id)
        : [],
    popularity: Number(raw?.popularity ?? 0),
  }
}

const uniqueTitles = (items: TitleSummary[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.kind}-${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchTrending(): Promise<TitleSummary[]> {
  const data = await api<any>('/trending/all/week')
  const results: any[] = Array.isArray(data?.results) ? data.results : []
  return uniqueTitles(
    results
      .filter((item) => item?.media_type !== 'person')
      .map((item) => mapTitle(item)),
  )
}

export interface Provider {
  id: number
  name: string
  logo: string
  region: string
}

export const PROVIDERS: Provider[] = [
  { id: 8, name: 'Netflix', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/netflix.svg', region: 'US' },
  { id: 9, name: 'Prime Video', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/amazonprime.svg', region: 'US' },
  { id: 337, name: 'Disney+', logo: '/logos/disney-plus.svg', region: 'US' },
  { id: 384, name: 'Max', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hbomax.svg', region: 'US' },
  { id: 350, name: 'Apple TV+', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/appletv.svg', region: 'US' },
  { id: 531, name: 'Paramount+', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/paramountplus.svg', region: 'US' },
  { id: 386, name: 'Peacock', logo: '/logos/peacock.svg', region: 'US' },
  { id: 15, name: 'Hulu', logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hulu.svg', region: 'US' },
]

export async function fetchDiscover(
  kind: Kind,
  options: { genre?: number | 'all'; sort?: string; page?: number; provider?: number; region?: string } = {},
): Promise<DiscoverPage> {
  const sort = options.sort ?? 'popularity.desc'
  const params: Record<string, string | number | undefined> = {
    sort_by: sort,
    page: options.page ?? 1,
    include_adult: 'false',
    'vote_count.gte': sort === 'vote_average.desc' ? 400 : undefined,
    with_genres: options.genre && options.genre !== 'all' ? options.genre : undefined,
    with_watch_providers: options.provider,
    watch_region: options.region ?? 'US',
  }
  const data = await api<any>(`/discover/${kind}`, params)
  return {
    items: uniqueTitles((data?.results ?? []).map((item: any) => mapTitle(item, kind))),
    page: Number(data?.page ?? 1),
    totalPages: Math.min(Number(data?.total_pages ?? 1), 500),
  }
}

export interface CatalogueTotals {
  films: number
  series: number
  genres: number
}

export async function fetchCatalogueTotals(): Promise<CatalogueTotals> {
  const [movies, shows, movieGenres, tvGenres] = await Promise.all([
    api<any>('/discover/movie', { include_adult: 'false' }),
    api<any>('/discover/tv', { include_adult: 'false' }),
    api<any>('/genre/movie/list'),
    api<any>('/genre/tv/list'),
  ])
  const genreIds = new Set<number>([
    ...(movieGenres?.genres ?? []).map((genre: any) => Number(genre.id)),
    ...(tvGenres?.genres ?? []).map((genre: any) => Number(genre.id)),
  ])
  return {
    films: Number(movies?.total_results ?? 0),
    series: Number(shows?.total_results ?? 0),
    genres: genreIds.size,
  }
}

export async function fetchGenres(kind: Kind): Promise<Genre[]> {
  const data = await api<any>(`/genre/${kind}/list`)
  return Array.isArray(data?.genres) ? data.genres : []
}

export async function fetchDetails(kind: Kind, id: number): Promise<TitleDetails> {
  const raw = await api<any>(`/${kind}/${id}`, {
    append_to_response: 'credits,recommendations,similar,videos',
  })

  const base = mapTitle(raw, kind)
  const recommendations: any[] = Array.isArray(raw?.recommendations?.results)
    ? raw.recommendations.results
    : []
  const similarRaw: any[] = Array.isArray(raw?.similar?.results) ? raw.similar.results : []

  const similar = uniqueTitles(
    [...recommendations, ...similarRaw]
      .map((item) => mapTitle(item, kind))
      .filter((item) => item.id !== base.id && item.poster),
  ).slice(0, 12)

  const cast: CastMember[] = (raw?.credits?.cast ?? []).slice(0, 24).map((person: any) => ({
    id: Number(person.id),
    name: person.name ?? 'Unknown',
    character: person.character ?? '',
    profile: imageUrl(person.profile_path, 'w185'),
  }))

  const seasons: Season[] = Array.isArray(raw?.seasons)
    ? raw.seasons
        .filter((season: any) => season?.season_number >= 1)
        .map((season: any) => ({
          id: Number(season.id),
          name: season.name ?? `Season ${season.season_number}`,
          number: Number(season.season_number),
          episodes: Number(season.episode_count ?? 0),
          year: String(season.air_date ?? '').slice(0, 4),
          poster: imageUrl(season.poster_path, 'w342'),
        }))
    : []

  const videos: any[] = Array.isArray(raw?.videos?.results) ? raw.videos.results : []
  const trailer =
    videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
    videos.find((video) => video.site === 'YouTube' && video.type === 'Teaser') ??
    null

  const runtime =
    kind === 'tv'
      ? `${raw?.number_of_seasons ?? 0} ${raw?.number_of_seasons === 1 ? 'season' : 'seasons'}`
      : raw?.runtime
        ? `${raw.runtime} min`
        : 'Runtime TBC'

  return {
    ...base,
    genres: Array.isArray(raw?.genres) ? raw.genres.map((genre: any) => genre.id) : base.genres,
    tagline: raw?.tagline ?? '',
    status: raw?.status ?? 'Released',
    language: String(raw?.original_language ?? 'EN').toUpperCase(),
    runtime,
    voteCount: Number(raw?.vote_count ?? 0),
    cast,
    seasons,
    similar,
    trailerKey: trailer?.key ?? null,
  }
}

export async function searchTitles(query: string): Promise<TitleSummary[]> {
  const data = await api<any>('/search/multi', { query, include_adult: 'false' })
  const results: any[] = Array.isArray(data?.results) ? data.results : []
  return uniqueTitles(
    results
      .filter((item) => item?.media_type === 'movie' || item?.media_type === 'tv')
      .map((item) => mapTitle(item)),
  ).slice(0, 12)
}

export async function fetchPopularPeople(page = 1): Promise<PersonSummary[]> {
  const data = await api<any>('/person/popular', { page })
  return (Array.isArray(data?.results) ? data.results : []).map((person: any) => ({
    id: Number(person.id),
    name: person.name ?? 'Unknown',
    department: person.known_for_department ?? 'Talent',
    profile: imageUrl(person.profile_path, 'w500'),
    popularity: Number(person.popularity ?? 0),
  }))
}

export async function fetchPerson(id: number): Promise<PersonDetails> {
  const [person, credits] = await Promise.all([
    api<any>(`/person/${id}`),
    api<any>(`/person/${id}/combined_credits`),
  ])

  const cast: any[] = Array.isArray(credits?.cast) ? credits.cast : []
  const titles = uniqueTitles(
    cast
      .filter((credit) => credit?.poster_path && Number(credit?.vote_count ?? 0) > 0)
      .map((credit) => mapTitle(credit)),
  )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, KNOWN_FOR_LIMIT)

  return {
    id: Number(person?.id),
    name: person?.name ?? 'Unknown',
    department: person?.known_for_department ?? 'Talent',
    profile: imageUrl(person?.profile_path, 'w500'),
    popularity: Number(person?.popularity ?? 0),
    biography: person?.biography ?? '',
    birthday: person?.birthday ?? null,
    deathday: person?.deathday ?? null,
    place: person?.place_of_birth ?? null,
    credits: titles,
  }
}

export async function fetchEpisodes(showId: number, seasonNumber: number): Promise<Episode[]> {
  const raw = await api<any>(`/tv/${showId}/season/${seasonNumber}`)
  const episodes: any[] = Array.isArray(raw?.episodes) ? raw.episodes : []
  return episodes.map((ep) => ({
    id: Number(ep?.id),
    name: ep?.name ?? `Episode ${ep?.episode_number}`,
    number: Number(ep?.episode_number ?? 0),
    season: Number(ep?.season_number ?? seasonNumber),
    overview: ep?.overview ?? '',
    airDate: ep?.air_date ?? '',
    rating: ep?.vote_average ? ep.vote_average.toFixed(1) : 'NR',
    still: imageUrl(ep?.still_path, 'w300'),
    runtime: ep?.runtime ?? null,
  }))
}
