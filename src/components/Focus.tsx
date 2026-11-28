import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { TitleSummary } from '../lib/tmdb'

interface FocusProps {
  items: TitleSummary[]
}

const pad = (value: number) => String(value).padStart(2, '0')
const MAX_FEATURES = 5
const ROTATE_MS = 9000

export default function Focus({ items }: FocusProps) {
  const features = useMemo(
    () => items.filter((item) => item.backdrop).slice(0, MAX_FEATURES),
    [items],
  )
  const count = features.length
  const [picked, setPicked] = useState(0)

  useEffect(() => {
    if (count < 2) return
    const timer = window.setInterval(() => {
      setPicked((current) => (current + 1) % count)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [count])

  if (!count) return null

  const index = picked % count
  const active = features[index]

  return (
    <section className="section">
      <div className="focus">
        <Link className="focus__media" to={`/title/${active.kind}/${active.id}`}>
          <img
            key={active.id}
            src={active.backdrop}
            alt=""
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
          />
          <span className="mono">In focus</span>
        </Link>
        <div className="focus__body">
          <p className="eyebrow mono">
            05 / Editorial · {pad(index + 1)} / {pad(count)}
          </p>
          <h2 className="focus__title">{active.title}</h2>
          <p className="focus__text">
            {active.overview || 'A weekly read on the films and series worth your evening.'}
          </p>
          <Link className="link-arrow" to={`/title/${active.kind}/${active.id}`}>
            Read the feature
            <ArrowUpRight size={11} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </section>
  )
}
