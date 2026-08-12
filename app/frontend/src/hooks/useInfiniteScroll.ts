import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  enabled: boolean
  onLoadMore: () => void
  rootMargin?: string
}

export const useInfiniteScroll = ({
  enabled,
  onLoadMore,
  rootMargin = '500px 0px',
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!enabled || !sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore()
      },
      { rootMargin },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, onLoadMore, rootMargin])

  return sentinelRef
}
