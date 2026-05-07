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
          }
        }
      } catch (_) {
        // аватар не критичен
      }
    }

    // Привязка user_id по номеру телефона
    if (!chat.user_id) {
      const contact = message.contact || null
      if (contact?.phone_number) {
        const cleanPhone = contact.phone_number.replace(/\D/g, '')

        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, full_name, email, telegram_id')
          .ilike('phone', `%${cleanPhone.slice(-10)}%`)
          .is('telegram_id', null)
          .order('created_at', { ascending: true })
          .limit(1)

        const existingUser = existingUsers?.[0] || null

        if (existingUser && !existingUser.telegram_id) {
          await supabase
            .from('users')
            .update({ telegram_id: chat.external_id })
            .eq('id', existingUser.id)

          await supabase
            .from('stylist_chats')
            .update({
              user_id: existingUser.id,
              source: 'telegram'
            })
            .eq('id', chat.id)

          if (chat.user_id && chat.user_id !== existingUser.id) {
            await supabase.from('users').delete().eq('id', chat.user_id)
          }

          const successText = `Отлично! Нашла ваш аккаунт, ${existingUser.full_name || 'друг'}! 🌸 Теперь всё связано.`
          await supabase.from('stylist_messages').insert({
            chat_id: chat.id,
            role: 'assistant',
            content: successText,
            created_at: new Date().toISOString(),
          })
          await sendTelegram(tgChatId, successText, { remove_keyboard: true })

        } else if (existingUser && existingUser.telegram_id) {
          const alreadyText = 'Этот номер уже привязан к другому аккаунту. Напишите нам если нужна помощь.'
          await supabase.from('stylist_messages').insert({
            chat_id: chat.id,
            role: 'assistant',
            content: alreadyText,
            created_at: new Date().toISOString(),
          })
          await sendTelegram(tgChatId, alreadyText, { remove_keyboard: true })

        } else {
          if (chat.user_id) {
            await supabase
              .from('users')
              .update({ phone: contact.phone_number })
              .eq('id', chat.user_id)
          }

          const savedText = 'Номер сохранён! 🌸 Чем могу помочь?'
          await supabase.from('stylist_messages').insert({
            chat_id: chat.id,
            role: 'assistant',
            content: savedText,
            created_at: new Date().toISOString(),
          })
          await sendTelegram(tgChatId, savedText, { remove_keyboard: true })
        }

        return res.status(200).json({ ok: true })
      }

      const welcomeText = `Привет! 👋 Я Амина, стилист Capriccio.\n\nПоделитесь номером телефона, чтобы я могла учитывать ваши предпочтения.`
      await supabase.from('stylist_messages').insert({
        chat_id: chat.id, role: 'assistant', content: welcomeText,
        created_at: new Date().toISOString(),
      })
      await sendTelegram(tgChatId, welcomeText, {
        keyboard: [[{ text: '📱 Поделиться номером телефона', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
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
