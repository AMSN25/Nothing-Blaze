import PersonCard from '../components/PersonCard'
import { PeopleSkeleton } from '../components/Skeletons'
import { useAsync } from '../hooks/useAsync'
import { fetchPopularPeople } from '../lib/tmdb'

export default function People() {
  const { data, loading, error } = useAsync(() => fetchPopularPeople(), [])
  const people = data ?? []

  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">Index / People</p>
        <h1 className="page-title">People</h1>
        <p className="page-copy mono">
          {loading ? 'Reading the index' : `${people.length} names on the first page`}
        </p>
      </section>

      <section className="section shell">
        {error ? <p className="notice mono">People index unavailable: {error}</p> : null}
        {loading ? (
          <PeopleSkeleton />
        ) : (
          <div className="people-grid">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
