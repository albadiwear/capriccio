export async function authWithTelegram() {
  const tg = window.Telegram?.WebApp
  if (!tg) return null

  const tgUser = tg.initDataUnsafe?.user
  if (!tgUser?.id) return null

  try {
    const res = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: tgUser.id,
        full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
        username: tgUser.username || null,
        phone: tgUser.phone_number || null,
      }),
    })
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}
