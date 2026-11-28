import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PosterCard from '../components/PosterCard'
import SectionHead from '../components/SectionHead'
import { GridSkeleton } from '../components/Skeletons'
import { useAsync } from '../hooks/useAsync'
import { fetchPerson } from '../lib/tmdb'

export default function Person() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(() => fetchPerson(id), [id])

  if (loading) {
    return (
      <div className="page shell">
        <div className="person-head">
          <div className="person-head__photo skeleton" />
          <div className="person-head__body">
            <div className="skel-line skel-line--wide" />
            <div className="skel-line" />
            <div className="skel-line skel-line--short" />
          </div>
        </div>
        <div className="section">
          <GridSkeleton count={6} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="empty shell">
        <p className="mono muted">People index</p>
        <h1 className="empty__title">Could not open this profile</h1>
        <p className="empty__text">{error ?? 'This person is not in the index.'}</p>
        <Link className="btn btn--solid" to="/people">
          Back to people
        </Link>
      </div>
    )
  }

  const meta = [data.birthday, data.deathday ? `— ${data.deathday}` : null, data.place]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="page">
      <section className="shell person-head">
        <button className="icon-btn detail__back" type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.6} />
        </button>

        <div className="person-head__photo">
          {data.profile ? (
            <img src={data.profile} alt={`${data.name} portrait`} />
          ) : (
            <span className="poster-fallback">
              <span>{data.name}</span>
            </span>
          )}
        </div>

        <div className="person-head__body">
          <p className="kicker">{data.department}</p>
          <h1 className="person-head__name">{data.name}</h1>
          {meta ? <p className="person-head__meta mono">{meta}</p> : null}
          {data.biography ? <p className="person-head__bio">{data.biography}</p> : null}
        </div>
      </section>

      <section className="section">
        <SectionHead eyebrow="Credits" title="Known For" />
        {data.credits.length ? (
          <div className="grid">
            {data.credits.map((item) => (
              <PosterCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <p className="empty-line mono">No credits indexed for this person yet.</p>
        )}
      </section>
    </div>
  )
}
