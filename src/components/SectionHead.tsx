import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SectionHeadProps {
  eyebrow: string
  title: string
  action?: { label: string; to: string }
}

export default function SectionHead({ eyebrow, title, action }: SectionHeadProps) {
  return (
    <div className="section__head">
      <div>
        <p className="eyebrow mono">{eyebrow}</p>
        <h2 className="section__title">{title}</h2>
      </div>
      {action ? (
        <Link className="section__link" to={action.to}>
          {action.label}
          <ArrowUpRight size={11} strokeWidth={1.8} />
        </Link>
      ) : null}
    </div>
  )
}
