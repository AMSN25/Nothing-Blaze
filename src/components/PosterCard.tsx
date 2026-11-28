import { Link } from 'react-router-dom'
import { Play, X } from 'lucide-react'
import type { TitleSummary } from '../lib/tmdb'

interface PosterCardProps {
  item: TitleSummary
  index?: number
  onRemove?: () => void
}

const pad = (value: number) => String(value).padStart(2, '0')

export default function PosterCard({ item, index, onRemove }: PosterCardProps) {
  return (
    <div className="card-wrap">
      <Link
        className="card"
        to={`/title/${item.kind}/${item.id}`}
      >
        <span className="card__poster">
          {index !== undefined ? <span className="card__idx">{pad(index)}</span> : null}
          {item.poster ? (
            <img
              src={item.poster}
              alt={`${item.title} poster`}
              width={200}
              height={300}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="poster-fallback">
              <span>{item.title}</span>
            </span>
          )}
          <span className="card__play" aria-hidden="true">
            <Play size={11} fill="currentColor" />
          </span>
        </span>
        <span className="card__title">{item.title}</span>
        <span className="card__meta">
          <b>{item.rating}</b>
          <i />
          {item.year}
          <i />
          {item.kind === 'tv' ? 'Series' : 'Film'}
        </span>
      </Link>

      {onRemove ? (
        <button
          className="card__remove"
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.title} from watchlist`}
        >
          <X size={12} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  )
}
