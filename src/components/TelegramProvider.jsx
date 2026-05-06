import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function TelegramProvider({ children }) {
  const { setUser } = useAuthStore()
  const [debug, setDebug] = useState('init...')

  useEffect(() => {
    async function init() {
      try {
        const tg = window.Telegram?.WebApp
        setDebug('tg: ' + (tg ? 'yes' : 'no'))

        if (!tg) return
        tg.ready()
        tg.expand()

        const user = tg.initDataUnsafe?.user
        setDebug('user: ' + JSON.stringify(user))

        if (!user?.id) return

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
        setDebug('api: ' + JSON.stringify(data).slice(0, 100))
        if (data.user) setUser(data.user)
      } catch(e) {
        setDebug('error: ' + e.message)
      }
    }

    init()
  }, [])

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: 'blue', color: 'white', padding: '8px',
        fontSize: '11px', zIndex: 99999, wordBreak: 'break-all'
      }}>
        {debug}
      </div>
      {children}
    </>
  )
}
