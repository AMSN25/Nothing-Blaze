type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'landscape-primary' | 'landscape-secondary' | 'portrait') => Promise<void>
  unlock?: () => void
}

export function isMobilePlayerViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 900px)').matches
}

async function requestLandscape(target?: HTMLElement | null): Promise<boolean> {
  const element = target ?? document.documentElement
  let fullscreen = Boolean(document.fullscreenElement)

  try {
    if (!fullscreen && element.requestFullscreen) {
      try {
        await element.requestFullscreen({ navigationUI: 'hide' })
      } catch {
        // Some browsers reject the navigationUI option; retry with no options.
        await element.requestFullscreen()
      }
      fullscreen = true
    }
  } catch {
    /* Fullscreen needs a direct gesture; playback continues without it. */
  }

  try {
    const orientation = screen.orientation as LockableOrientation | undefined
    if (fullscreen && orientation?.lock) await orientation.lock('landscape')
  } catch {
    /* Orientation locking is Android/Chrome-first; ignore unsupported browsers. */
  }

  return fullscreen
}

let inFlight: Promise<boolean> | null = null

/**
 * Ask the browser for a landscape fullscreen player. Both calls are best-effort:
 * iOS Safari and desktop browsers may reject one or both, so the player keeps
 * working in portrait if the request is refused. Concurrent calls (the click
 * handler and the player's mount effect) share one request.
 */
export async function enterPlayerLandscape(target?: HTMLElement | null): Promise<boolean> {
  if (typeof document === 'undefined') return false
  if (document.fullscreenElement) return true
  if (!inFlight) {
    inFlight = requestLandscape(target).finally(() => {
      inFlight = null
    })
  }
  return inFlight
}

export async function exitPlayerFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return
  try {
    const orientation = screen.orientation as LockableOrientation | undefined
    orientation?.unlock?.()
  } catch {
    /* Unsupported. */
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
  } catch {
    /* Unsupported. */
  }
}
