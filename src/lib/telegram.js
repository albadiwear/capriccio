import WebApp from '@twa-dev/sdk'

export function isTelegramWebApp() {
  if (typeof window === 'undefined') return false
  return window.Telegram?.WebApp?.initData !== ''
}

export function getTelegramUser() {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null
}

export function expandTelegramApp() {
  if (typeof window === 'undefined') return
  window.Telegram?.WebApp?.expand()
}

export function closeTelegramApp() {
  if (typeof window === 'undefined') return
  window.Telegram?.WebApp?.close()
}

export function getTelegramTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.Telegram?.WebApp?.colorScheme || 'light'
}

export { WebApp }
