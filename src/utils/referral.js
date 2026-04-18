const KEY = 'capriccio_ref'
const TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

export function saveRefCode(code) {
  if (!code) return
  localStorage.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }))
}

export function getRefCode() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > TTL) {
      clearRefCode()
      return null
    }
    return code
  } catch {
    clearRefCode()
    return null
  }
}

export function clearRefCode() {
  localStorage.removeItem(KEY)
}
