import { useEffect, useRef, useState } from 'react'

interface StatsProps {
  films: number | null
  series: number | null
  genres: number | null
}

function Stat({ value, label, capped = false }: { value: number | null; label: string; capped?: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const node = ref.current
    if (!node || value === null) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setProgress(0)
        const start = performance.now()
        const tick = (now: number) => {
          const elapsed = Math.min((now - start) / 1400, 1)
          setProgress(1 - Math.pow(1 - elapsed, 3))
          if (elapsed < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  const display =
    value === null
      ? '—'
      : `${Math.round(value * progress).toLocaleString('en-US')}${capped && progress >= 1 ? '+' : ''}`

  return (
    <div className="stat">
      <p ref={ref} className="stat__num">
        {display}
      </p>
      <p className="stat__label mono">{label}</p>
    </div>
  )
}

export default function Stats({ films, series, genres }: StatsProps) {
  const stats = [
    { value: films, label: 'Films indexed', capped: true },
    { value: series, label: 'Series indexed', capped: true },
    { value: genres, label: 'Genres', capped: false },
  ]

  return (
    <section className="stats" aria-label="Catalogue index">
      <svg className="stats__mark" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="8" x2="100" y2="192" stroke="currentColor" strokeWidth="1" />
        <line x1="8" y1="100" x2="192" y2="100" stroke="currentColor" strokeWidth="1" />
      </svg>
      {stats.map((stat) => (
        <Stat key={stat.label} value={stat.value} label={stat.label} capped={stat.capped} />
      ))}
    </section>
  )
}
