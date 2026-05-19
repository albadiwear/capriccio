import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Incoming WhatsApp messages from Green API.
// Webhook URL must include ?token=<GREEN_API_WEBHOOK_TOKEN>.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (req.query.token !== process.env.GREEN_API_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const body = req.body || {}

    // Only handle inbound messages; ignore status/outgoing webhooks.
    if (body.typeWebhook !== 'incomingMessageReceived') {
      return res.status(200).json({ ok: true })
    }

    const waChatId = body.senderData?.chatId // e.g. "77001234567@c.us"
    if (!waChatId || !waChatId.endsWith('@c.us')) {
      return res.status(200).json({ ok: true }) // skip groups/status broadcasts
    }

    const phoneDigits = waChatId.replace('@c.us', '') // "77001234567"
    const phone = `+${phoneDigits}` // "+77001234567"
    const senderName =
      body.senderData?.senderName || body.senderData?.chatName || null

    const md = body.messageData || {}
    const text =
      md.textMessageData?.textMessage ??
      md.extendedTextMessageData?.text ??
      ''
    if (!text) return res.status(200).json({ ok: true }) // skip non-text for now

    // Find or create the lead in `users`.
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          full_name: senderName || 'WhatsApp клиент',
          phone,
          email: null,
          lead_source: 'whatsapp',
          lead_status: 'Новый',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      user = newUser
    }

    const userId = user?.id || null

    // Find or create the chat.
    let { data: chat } = await supabase
      .from('stylist_chats')
      .select('*')
      .eq('source', 'whatsapp')
      .eq('external_id', waChatId)
      .maybeSingle()

    if (!chat) {
      const { data: newChat } = await supabase
        .from('stylist_chats')
        .insert({
          source: 'whatsapp',
          external_id: waChatId,
          whatsapp_phone: phoneDigits,
          user_id: userId,
          title: senderName || `WhatsApp ${phoneDigits}`,
          mode: 'ai',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      chat = newChat
    } else if (!chat.user_id && userId) {
      // Link an older chat that has no user attached yet.
      await supabase
        .from('stylist_chats')
        .update({ user_id: userId })
        .eq('id', chat.id)
      chat.user_id = userId
    }

    if (!chat) return res.status(200).json({ ok: true })

    await supabase.from('stylist_messages').insert({
      chat_id: chat.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    })

    await supabase
      .from('stylist_chats')
      .update({ updated_at: new Date().toISOString(), last_message: text })
      .eq('id', chat.id)

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('whatsapp-webhook error:', e)
    return res.status(200).json({ ok: true })
  }
}
