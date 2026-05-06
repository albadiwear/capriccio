import { getTelegramUser, isTelegramWebApp, WebApp } from '../lib/telegram'
import { useAuthStore } from '../store/authStore'

export function useTelegram() {
  const user = useAuthStore((state) => state.user)
  const isTMA = isTelegramWebApp()
  const tgUser = getTelegramUser()

  return {
    isTMA,
    tgUser,
    webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : WebApp,
    user,
  }
}
