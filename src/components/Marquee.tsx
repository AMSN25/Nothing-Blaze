interface MarqueeProps {
  items: string[]
}

export default function Marquee({ items }: MarqueeProps) {
  const names = items.length ? items : ['CineBlaze', 'Now trending']

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {[0, 1].map((half) => (
          <div className="ticker__group" key={half}>
            <span className="ticker__tag">● Now trending</span>
            {names.map((name) => (
              <span key={`${half}-${name}`}>{name}</span>
            ))}
            <span>New this week</span>
            <span>Curated daily</span>
          </div>
        ))}
      </div>
    </div>
  )
}
