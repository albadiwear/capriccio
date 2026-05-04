export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { chat_id, photo, caption } = req.body
  if (!chat_id || !photo) return res.status(400).json({ error: 'Missing params' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    const { data: chat } = await supabase
      .from('stylist_chats')
      .select('external_id')
      .eq('id', chat_id)
      .single()

    if (!chat?.external_id) return res.status(404).json({ error: 'Chat not found' })

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat.external_id,
        photo,
        caption,
      }),
    })

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Telegram send photo error:', e)
    return res.status(500).json({ error: e.message })
  }
}
