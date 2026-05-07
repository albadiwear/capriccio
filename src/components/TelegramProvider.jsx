import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export default function TelegramProvider({ children }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    async function init() {
      const tg = window.Telegram?.WebApp
      if (!tg) return
      tg.ready()
      tg.expand()

      const user = tg.initDataUnsafe?.user
      if (!user?.id) return

      try {
        const res = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: user.id,
            full_name: [user.first_name, user.last_name].filter(Boolean).join(' '),
            username: user.username || null,
            phone: user.phone_number || null,
          }),
        })
        const data = await res.json()
        if (data.user) setUser(data.user)
      } catch {}
    }

    init()
  }, [])

  return children
}
