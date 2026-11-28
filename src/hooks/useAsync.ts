import { useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface Result<T> {
  key: string
  data: T | null
  error: string | null
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const key = JSON.stringify(deps)
  const loaderRef = useRef(loader)
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let alive = true

    loaderRef
      .current()
      .then((data) => {
        if (alive) setResult({ key, data, error: null })
      })
      .catch((error: unknown) => {
        if (!alive) return
        setResult({
          key,
          data: null,
          error: error instanceof Error ? error.message : 'Something went wrong',
        })
      })

    return () => {
      alive = false
    }
  }, [key])

  if (!result || result.key !== key) return { data: null, loading: true, error: null }
  return { data: result.data, loading: false, error: result.error }
}
