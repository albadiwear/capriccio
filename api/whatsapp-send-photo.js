import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Send a WhatsApp photo via Green API (sendFileByUrl). Manager/admin only.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { chat_id, photo, caption } = req.body
  if (!chat_id || !photo) return res.status(400).json({ error: 'Missing params' })

  try {
    // Only managers/admins may send photos through the bot.
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
      .select('external_id, whatsapp_phone')
      .eq('id', chat_id)
      .single()

    const waChatId =
      chat?.external_id ||
      (chat?.whatsapp_phone ? `${chat.whatsapp_phone}@c.us` : null)
    if (!waChatId) return res.status(404).json({ error: 'Chat not found' })

    const ID = process.env.GREEN_API_ID_INSTANCE
    const GREEN_TOKEN = process.env.GREEN_API_TOKEN

    const response = await fetch(
      `https://api.green-api.com/waInstance${ID}/sendFileByUrl/${GREEN_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: waChatId,
          urlFile: photo,
          fileName: 'product.jpg',
          caption: caption || '',
        }),
      }
    )

    const result = await response.json()
    return res.status(200).json(result)
  } catch (e) {
    console.error('whatsapp-send-photo error:', e)
    return res.status(500).json({ error: e.message })
  }
}
