import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { isTelegramWebApp, expandTelegramApp } from '../lib/telegram'
import { authWithTelegram } from '../lib/telegramAuth'

export default function TelegramProvider({ children }) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    if (!isTelegramWebApp()) return

    expandTelegramApp()

    authWithTelegram()
      .then((user) => {
        if (user) {
          setUser(user)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [setLoading, setUser])

  return children
}
