import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty shell">
      <p className="mono muted">Index / 404</p>
      <h1 className="empty__title">Nothing here</h1>
      <p className="empty__text">That page is not in the catalogue.</p>
      <Link className="btn btn--solid" to="/">
        Back to index
      </Link>
    </div>
  )
}
