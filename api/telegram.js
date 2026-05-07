import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId, text, replyMarkup = null) {
  const body = { chat_id: chatId, text }
  if (replyMarkup) body.reply_markup = replyMarkup

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
      .maybeSingle()

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

      // Получаем фото профиля из Telegram
      try {
        const photosRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${tgChatId}&limit=1`
        )
        const photosData = await photosRes.json()
        const fileId = photosData?.result?.photos?.[0]?.[0]?.file_id

        if (fileId) {
          const fileRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
          )
          const fileData = await fileRes.json()
          const filePath = fileData?.result?.file_path

          if (filePath) {
            const avatarUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
            await supabase.from('stylist_chats').update({ avatar_url: avatarUrl }).eq('id', chat.id)
            chat.avatar_url = avatarUrl

            if (chat.user_id) {
              await supabase
                .from('users')
                .update({ avatar_url: avatarUrl })
                .eq('id', chat.user_id)
            }
          }
        }
      } catch (_) {
        // аватар не критичен
      }
    }

    const contact = message.contact || null
    if (contact?.phone_number) {
      const { data: tgUser } = await supabase
        .from('users')
        .select('id, full_name, phone, telegram_id')
        .eq('telegram_id', Number(tgChatId))
        .maybeSingle()

      if (tgUser) {
        await supabase
          .from('users')
          .update({ phone: contact.phone_number })
          .eq('id', tgUser.id)

        if (!chat.user_id) {
          await supabase
            .from('stylist_chats')
            .update({ user_id: tgUser.id })
            .eq('id', chat.id)
        }
      }

      const savedText = 'Номер сохранён! 🌸 Теперь открывайте каталог через кнопку выше.'
      await supabase.from('stylist_messages').insert({
        chat_id: chat.id,
        role: 'assistant',
        content: savedText,
        created_at: new Date().toISOString(),
      })
      await sendTelegram(tgChatId, savedText, { remove_keyboard: true })
      return res.status(200).json({ ok: true })
    }

    if (text === '/start') {
      const startText = 'Привет! 👋 Я Амина, стилист Capriccio.\n\nОткрывайте каталог 1500+ образов прямо сейчас 👇'
      await supabase.from('stylist_messages').insert({
        chat_id: chat.id,
        role: 'assistant',
        content: startText,
        created_at: new Date().toISOString(),
      })
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: startText,
          reply_markup: {
            inline_keyboard: [[
              { text: '🛍 Открыть каталог', web_app: { url: 'https://capriccio.vercel.app' } }
            ]],
          },
        }),
      })

      const phonePromptText = 'И поделитесь номером телефона, чтобы я могла сохранить ваши предпочтения 👇'
      await supabase.from('stylist_messages').insert({
        chat_id: chat.id,
        role: 'assistant',
        content: phonePromptText,
        created_at: new Date().toISOString(),
      })
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: phonePromptText,
          reply_markup: {
            keyboard: [[{ text: '📱 Поделиться номером', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }),
      })
      return res.status(200).json({ ok: true })
    }

    // Сохранить сообщение пользователя
    await supabase.from('stylist_messages').insert({
      chat_id: chat.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    })

    // Обновить updated_at и last_message чата
    await supabase
      .from('stylist_chats')
      .update({ updated_at: new Date().toISOString(), last_message: text })
      .eq('id', chat.id)

    return res.status(200).json({ ok: true })
  } catch (_) {
    return res.status(200).json({ ok: true })
  }
}
