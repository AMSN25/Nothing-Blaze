import { Link } from 'react-router-dom'
import type { PersonSummary } from '../lib/tmdb'

interface PersonCardProps {
  person: PersonSummary
}

export default function PersonCard({ person }: PersonCardProps) {
  return (
    <Link className="person-card" to={`/person/${person.id}`} aria-label={`Open ${person.name}`}>
      <span className="person-card__poster">
        {person.profile ? (
          <img
            src={person.profile}
            alt={`${person.name} portrait`}
            width={200}
            height={300}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="poster-fallback">
            <span>{person.name}</span>
          </span>
        )}
        <span className="person-card__tag mono">{person.department}</span>
      </span>
      <span className="person-card__name">{person.name}</span>
    </Link>
  )
}
