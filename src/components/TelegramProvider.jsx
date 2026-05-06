import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { authWithTelegram } from '../lib/telegramAuth'

export default function TelegramProvider({ children }) {
  const { setUser } = useAuthStore()
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    tg.ready()
    tg.expand()

    setTimeout(() => {
      const initData = tg.initData
      const tgUser = tg.initDataUnsafe?.user

      setDebugInfo({
        hasInitData: !!initData,
        initDataLength: initData?.length || 0,
        hasUser: !!tgUser,
        userId: tgUser?.id || null,
        userName: tgUser?.first_name || null,
      })

      if (!tgUser?.id) return

      authWithTelegram().then(user => {
        if (user) setUser(user)
      })
    }, 500)
  }, [])

  return (
    <>
      {debugInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'red', color: 'white', padding: '8px',
          fontSize: '12px', zIndex: 99999
        }}>
          initData: {debugInfo.hasInitData ? `yes(${debugInfo.initDataLength})` : 'NO'} |
          user: {debugInfo.hasUser ? `yes(${debugInfo.userId})` : 'NO'} |
          name: {debugInfo.userName || 'none'}
        </div>
      )}
      {children}
    </>
  )
}
