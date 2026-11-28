import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { TitleSummary } from '../lib/tmdb'
import { MOODS } from '../lib/moods'

interface MoodGridProps {
  items: TitleSummary[]
}

export default function MoodGrid({ items }: MoodGridProps) {
  const used = new Set<number>()
  const backdrops = MOODS.map((mood) => {
    let match = items.find(
      (item) => item.backdrop && !used.has(item.id) && item.genres.some((genre) => mood.genres.includes(genre)),
    )
    // Every tile stays cinematic even when a genre is missing from the top titles.
    if (!match) match = items.find((item) => item.backdrop && !used.has(item.id))
    if (match) used.add(match.id)
    return match?.backdrop ?? ''
  })

  return (
    <div className="moods">
      {MOODS.map((mood, index) => (
        <Link className="mood" key={mood.index} to={mood.href}>
          {backdrops[index] ? (
            <img
              className="mood__bg"
              src={backdrops[index]}
              alt=""
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <span className="mood__num">{mood.index} — Genre</span>
          <span className="mood__name">
            {mood.title[0]}
            <br />
            {mood.title[1]}
          </span>
          <span className="mood__foot">
            <span className="mood__count">{mood.note}</span>
            <span className="mood__arrow" aria-hidden="true">
              <ArrowUpRight size={11} strokeWidth={1.8} />
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
