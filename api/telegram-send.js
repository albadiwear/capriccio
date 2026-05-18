export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { chat_id, text } = req.body
  if (!chat_id || !text) return res.status(400).json({ error: 'Missing params' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    // Only managers/admins may send messages through the bot.
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!['manager', 'admin'].includes(profile?.role)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: chat } = await supabase
      .from('stylist_chats')
      .select('external_id')
      .eq('id', chat_id)
      .single()

    if (!chat?.external_id) return res.status(404).json({ error: 'Chat not found' })

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat.external_id, text }),
      }
    )

    const result = await response.json()
    return res.status(200).json(result)
  } catch (e) {
    console.error('Telegram send error:', e)
    return res.status(500).json({ error: e.message })
  }
}
