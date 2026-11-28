import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TitleSummary } from '../lib/tmdb'
import PosterCard from './PosterCard'
import SectionHead from './SectionHead'

interface TitleRowProps {
  eyebrow?: string
  title: string
  items: TitleSummary[]
}

export default function TitleRow({ eyebrow = 'Next', title, items }: TitleRowProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (!items.length) return null

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="section row">
      <SectionHead eyebrow={eyebrow} title={title} />

      <div className="row__wrap">
        <button
          className="row__nav row__nav--prev"
          type="button"
          onClick={() => scroll(-1)}
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
        </button>

        <div className="row__track" ref={trackRef}>
          {items.map((item) => (
            <div className="row__item" key={`${item.kind}-${item.id}`}>
              <PosterCard item={item} />
            </div>
          ))}
        </div>

        <button
          className="row__nav row__nav--next"
          type="button"
          onClick={() => scroll(1)}
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight size={16} strokeWidth={1.8} />
        </button>
      </div>
    </section>
  )
}
