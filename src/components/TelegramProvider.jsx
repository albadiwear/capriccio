import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { authWithTelegram } from '../lib/telegramAuth'

export default function TelegramProvider({ children }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    tg.ready()
    tg.expand()

    const tgUser = tg.initDataUnsafe?.user
    if (!tgUser?.id) return

    authWithTelegram().then(user => {
      if (user) setUser(user)
    })
  }, [])

  return children
}
