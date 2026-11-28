import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState<{ state: 'ok' | 'error'; text: string } | null>(null)

  return (
    <section className="community" aria-labelledby="community-title">
      <div className="community__inner">
        <div className="community__copy">
          <p className="mono muted">04 / Community</p>
          <h2 id="community-title">
            Never Miss
            <br />A Release
          </h2>
          <p>One email a week. New films, new series, nothing else.</p>
        </div>

        <div className="community__form">
          <label className="subscribe__label mono" htmlFor="newsletter-email">
            Email address
          </label>

          <form
            className="subscribe"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
              setNote(
                valid
                  ? { state: 'ok', text: 'Thanks — this demo does not send email.' }
                  : { state: 'error', text: 'Enter a valid email address.' },
              )
              if (valid) setEmail('')
            }}
          >
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="btn btn--solid">Sign up</button>
          </form>

          <p className="form-note mono" data-state={note?.state ?? ''} role="status" aria-live="polite">
            {note?.text ?? ''}
          </p>
        </div>
      </div>
    </section>
  )
}
