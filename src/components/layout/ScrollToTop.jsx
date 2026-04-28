import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Our app uses an internal scroll container (main) on mobile to avoid layout bounce.
    // Scroll both the window and the container to be safe.
    window.scrollTo(0, 0)
    const el = document.querySelector('[data-scroll-container="app"]')
    if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
