export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="card card--skeleton" key={index}>
          <div className="card__poster skeleton" />
          <div className="skel-line" />
          <div className="skel-line skel-line--short" />
        </div>
      ))}
    </div>
  )
}

export function PeopleSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="people-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="person-card person-card--skeleton" key={index}>
          <div className="person-card__poster skeleton" />
          <div className="skel-line" />
        </div>
      ))}
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="row__track" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="row__item" key={index}>
          <div className="card card--skeleton">
            <div className="card__poster skeleton" />
            <div className="skel-line" />
          </div>
        </div>
      ))}
    </div>
  )
}
