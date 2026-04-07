export function useSEO({ title, description, url, image } = {}) {
  const siteName = 'Capriccio'
  const baseUrl = 'https://capriccio.vercel.app'
  const defaultImage = `${baseUrl}/og-image.jpg`

  const fullTitle = title ? `${title} — ${siteName}` : `${siteName} — Женская одежда премиум`
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const fullImage = image || defaultImage

  if (typeof document !== 'undefined') {
    document.title = fullTitle

    const setMeta = (selector, content) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const attr = selector.includes('[name') ? 'name' : 'property'
        const val = selector.match(/["']([^"']+)["']/)?.[1]
        if (attr && val) el.setAttribute(attr, val)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('[name="description"]', description || 'Интернет-магазин женской одежды премиум класса.')
    setMeta('[property="og:title"]', fullTitle)
    setMeta('[property="og:description"]', description || '')
    setMeta('[property="og:url"]', fullUrl)
    setMeta('[property="og:image"]', fullImage)
    setMeta('[name="twitter:title"]', fullTitle)
    setMeta('[name="twitter:description"]', description || '')
    setMeta('[name="twitter:image"]', fullImage)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', fullUrl)
  }
}
