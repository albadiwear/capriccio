import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req
    if (query['hub.verify_token'] === process.env.TELEGRAM_VERIFY_TOKEN) {
      return res.status(200).send(query['hub.challenge'])
    }
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { message } = req.body
    if (!message) return res.status(200).json({ ok: true })

    const tgChatId = String(message.chat.id)
    const text = message.text || ''
    const fromName = [message.from?.first_name, message.from?.last_name]
      .filter(Boolean).join(' ') || 'Telegram пользователь'
    const username = message.from?.username || null

    // Найти или создать чат
    let { data: chat } = await supabase
      .from('stylist_chats')
      .select('*')
      .eq('source', 'telegram')
      .eq('external_id', tgChatId)
      .single()

    if (!chat) {
      const { data: newChat } = await supabase
        .from('stylist_chats')
        .insert({
          source: 'telegram',
          external_id: tgChatId,
          title: fromName,
          username: username,
          mode: 'ai',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      chat = newChat

      // Создать лид
      await supabase.from('leads').insert({
        name: fromName,
        source: 'telegram',
        username: username,
        chat_id: chat.id,
        status: 'new',
        created_at: new Date().toISOString(),
      })
    }

    // Сохранить сообщение
    await supabase.from('stylist_messages').insert({
      chat_id: chat.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    })

    // Обновить updated_at чата
    await supabase
      .from('stylist_chats')
      .update({ updated_at: new Date().toISOString(), last_message: text })
      .eq('id', chat.id)

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Telegram webhook error:', e)
    return res.status(200).json({ ok: true })
  }
}
