export type StreamMode = 'direct' | 'embed'

export interface StreamProvider {
  id: string
  name: string
  mode: StreamMode
  note: string
  getMovieUrl: (id: number | string) => string
  getTvUrl: (id: number | string, season?: number, episode?: number) => string
}

/** Ask every source to start playback as soon as its iframe loads. */
const withAutoplay = (url: string): string => {
  if (/[?&]autoplay=1(?:&|$)/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}autoplay=1`
}

/**
 * Sources carried over from the original CineBlaze build.
 * Vidly is the direct player; the rest are embed servers used as fallbacks.
 */
export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    id: 'vidly',
    name: 'Vidly',
    mode: 'direct',
    note: 'Primary - autoplay',
    getMovieUrl: (id) => `https://vidly.pro/movie/${id}`,
    getTvUrl: (id, season = 1, episode = 1) =>
      `https://vidly.pro/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidbolt',
    name: 'Vidbolt',
    mode: 'embed',
    note: 'Embed server',
    getMovieUrl: (id) => `https://vidbolt.xyz/movie/${id}`,
    getTvUrl: (id, season = 1, episode = 1) => `https://vidbolt.xyz/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidrift',
    name: 'Vidrift',
    mode: 'embed',
    note: 'Embed server',
    getMovieUrl: (id) => `https://embed.vidrift.in/embed/movie/${id}`,
    getTvUrl: (id, season = 1, episode = 1) =>
      `https://embed.vidrift.in/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidy',
    name: 'Vidy',
    mode: 'embed',
    note: 'Embed server',
    getMovieUrl: (id) => `https://www.vidy.st/movie/${id}`,
    getTvUrl: (id, season = 1, episode = 1) => `https://www.vidy.st/tv/${id}/${season}/${episode}`,
  },
]

export const EMBED_PROVIDERS = STREAM_PROVIDERS.filter((provider) => provider.mode === 'embed')

export const providerById = (id: string): StreamProvider | undefined =>
  STREAM_PROVIDERS.find((provider) => provider.id === id)

export const embedUrlFor = (
  provider: StreamProvider,
  kind: 'movie' | 'tv',
  id: number | string,
  season = 1,
  episode = 1,
) => withAutoplay(kind === 'tv' ? provider.getTvUrl(id, season, episode) : provider.getMovieUrl(id))
