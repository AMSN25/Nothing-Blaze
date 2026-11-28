import Focus from '../components/Focus'
import ContinueWatching from '../components/ContinueWatching'
import Hero from '../components/Hero'
import Marquee from '../components/Marquee'
import MoodGrid from '../components/MoodGrid'
import Newsletter from '../components/Newsletter'
import PosterCard from '../components/PosterCard'
import SectionHead from '../components/SectionHead'
import Stats from '../components/Stats'
import { GridSkeleton } from '../components/Skeletons'
import { useAsync } from '../hooks/useAsync'
import { fetchCatalogueTotals, fetchDiscover, fetchTrending } from '../lib/tmdb'

export default function Home() {
  const { data, loading, error } = useAsync(fetchTrending, [])
  const { data: totals } = useAsync(fetchCatalogueTotals, [])
  const { data: anime } = useAsync(() => fetchDiscover('tv', { genre: 16, sort: 'popularity.desc' }), [])
  const { data: movies } = useAsync(
    () => fetchDiscover('movie', { sort: 'popularity.desc' }),
    [],
  )
  const { data: webSeries } = useAsync(
    () => fetchDiscover('tv', { genre: 10759, sort: 'popularity.desc' }),
    [],
  )
  const items = data ?? []

  return (
    <>
      <Hero items={items} loading={loading} />
      <Marquee items={items.slice(0, 7).map((item) => item.title)} />

      <ContinueWatching />

      <section className="section">
        <SectionHead eyebrow="01 / Browse" title="By Mood" action={{ label: 'All titles', to: '/films' }} />
        <MoodGrid items={items} />
      </section>

      <section className="section">
        <SectionHead
          eyebrow="02 / Catalogue"
          title="Trending Now"
          action={{ label: 'Full index', to: '/films' }}
        />
        {error ? <p className="notice mono">Catalogue unavailable: {error}</p> : null}
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="grid">
            {items.slice(0, 12).map((item, index) => (
              <PosterCard key={`${item.kind}-${item.id}`} item={item} index={index + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <SectionHead eyebrow="Index / Movies" title="Movies" action={{ label: 'All movies', to: '/films' }} />
        {movies ? (
          <div className="grid">
            {movies.items.slice(0, 12).map((item, index) => (
              <PosterCard key={`${item.kind}-${item.id}`} item={item} index={index + 1} />
            ))}
          </div>
        ) : (
          <GridSkeleton />
        )}
      </section>

      <section className="section">
        <SectionHead
          eyebrow="Index / Web Series"
          title="Web Series"
          action={{ label: 'All web series', to: '/series?genre=10759' }}
        />
        {webSeries ? (
          <div className="grid">
            {webSeries.items.slice(0, 12).map((item, index) => (
              <PosterCard key={`${item.kind}-${item.id}`} item={item} index={index + 1} />
            ))}
          </div>
        ) : (
          <GridSkeleton />
        )}
      </section>

      <section className="section">
        <SectionHead eyebrow="Index / Anime" title="Anime" action={{ label: 'All anime', to: '/anime' }} />
        {anime ? (
          <div className="grid">
            {anime.items.slice(0, 12).map((item, index) => (
              <PosterCard key={`${item.kind}-${item.id}`} item={item} index={index + 1} />
            ))}
          </div>
        ) : (
          <GridSkeleton />
        )}
      </section>

      <Focus items={items.slice(3)} />

      <Stats films={totals?.films ?? null} series={totals?.series ?? null} genres={totals?.genres ?? null} />
      <Newsletter />
    </>
  )
}
