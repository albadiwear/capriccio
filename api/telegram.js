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

async function sendTelegramWithButton(chatId, text, buttonText, buttonUrl) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
      },
    }),
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

    // Привязка user_id по номеру телефона
    if (!chat.user_id) {
      const contact = message.contact || null
      if (contact?.phone_number) {
        const cleanPhone = contact.phone_number.replace(/\D/g, '')

        // Сначала проверяем есть ли уже аккаунт с этим telegram_id
        const { data: tgUser } = await supabase
          .from('users')
          .select('id, full_name, phone, telegram_id')
          .eq('telegram_id', Number(tgChatId))
          .maybeSingle()

        if (tgUser) {
          // Аккаунт уже есть (создан через Mini App) — просто сохраняем номер
          await supabase
            .from('users')
            .update({ phone: contact.phone_number })
            .eq('id', tgUser.id)

          // Привязываем чат если ещё не привязан
          if (!chat.user_id) {
            await supabase
              .from('stylist_chats')
              .update({ user_id: tgUser.id })
              .eq('id', chat.id)
          }

          const savedText = `Номер сохранён! 🌸`
          await supabase.from('stylist_messages').insert({
            chat_id: chat.id, role: 'assistant', content: savedText,
            created_at: new Date().toISOString(),
          })
          await sendTelegram(tgChatId, savedText, { remove_keyboard: true })
          await sendTelegramWithButton(
            tgChatId,
            '🛍 Открывайте каталог прямо в Telegram:',
            '🛍 Открыть Capriccio',
            'https://t.me/Cap_Ricciobot/catalog'
          )

          return res.status(200).json({ ok: true })
        }

        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, full_name, email, telegram_id')
          .ilike('phone', `%${cleanPhone.slice(-10)}%`)
          .is('telegram_id', null)
          .order('created_at', { ascending: true })
          .limit(1)

        const existingUser = existingUsers?.[0] || null

        if (existingUser && !existingUser.telegram_id) {
          // 1. Записать telegram_id в существующий аккаунт
          await supabase
            .from('users')
            .update({
              telegram_id: Number(tgChatId),
            })
            .eq('id', existingUser.id)

          // 1.5 Подтянуть аватар из Telegram в users.avatar_url
          // Берём аватар из chat.avatar_url (он уже загружен при создании чата)
          // Если есть — обновляем users.avatar_url
          if (chat.avatar_url) {
            await supabase
              .from('users')
              .update({ avatar_url: chat.avatar_url })
              .eq('id', existingUser.id)
          }

          // 2. Привязать Telegram чат к существующему аккаунту
          await supabase
            .from('stylist_chats')
            .update({
              user_id: existingUser.id,
              source: 'telegram',
            })
            .eq('id', chat.id)

          // 3. Найти и удалить временный Telegram аккаунт (created via Mini App)
          // Ищем в users по telegram_id = tgChatId, но только temp аккаунты (email like 'tg_%@capriccio.app')
          const { data: tempUser } = await supabase
            .from('users')
            .select('id')
            .eq('telegram_id', Number(tgChatId))
            .ilike('email', 'tg_%@capriccio.app')
            .maybeSingle()

          if (tempUser) {
            // Перепривязать все чаты временного аккаунта на существующий
            await supabase
              .from('stylist_chats')
              .update({ user_id: existingUser.id })
              .eq('user_id', tempUser.id)

            // Удалить временный аккаунт из auth
            await supabase.auth.admin.deleteUser(tempUser.id)
          }

          const successText = `Отлично! Нашла ваш аккаунт, ${existingUser.full_name || 'друг'}! 🌸 Теперь всё связано.`
          await supabase.from('stylist_messages').insert({
            chat_id: chat.id,
            role: 'assistant',
            content: successText,
            created_at: new Date().toISOString(),
          })
          await sendTelegram(tgChatId, successText, { remove_keyboard: true })

          await sendTelegramWithButton(
            tgChatId,
            '🛍 Открывайте каталог прямо в Telegram:',
            '🛍 Открыть Capriccio',
            'https://t.me/Cap_Ricciobot/catalog'
          )

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
            // Уже есть аккаунт (Mini App) — сохраняем номер и отправляем ссылку
            await supabase
              .from('users')
              .update({ phone: contact.phone_number })
              .eq('id', chat.user_id)

            const savedText = 'Номер сохранён! 🌸'
            await supabase.from('stylist_messages').insert({
              chat_id: chat.id, role: 'assistant', content: savedText,
              created_at: new Date().toISOString(),
            })
            await sendTelegram(tgChatId, savedText, { remove_keyboard: true })
            await sendTelegramWithButton(
              tgChatId,
              '🛍 Открывайте каталог прямо в Telegram:',
              '🛍 Открыть Capriccio',
              'https://t.me/Cap_Ricciobot/catalog'
            )
          } else {
            // Нет аккаунта вообще — создаём новый через supabase.auth.admin.createUser
            const tgEmail = `tg_${tgChatId}@capriccio.app`

            const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
              email: tgEmail,
              email_confirm: true,
              user_metadata: {
                full_name: fromName,
                telegram_id: Number(tgChatId),
              }
            })

            if (!createError && newAuthUser?.user) {
              // Обновляем users: telegram_id + phone + avatar
              await supabase
                .from('users')
                .update({
                  telegram_id: Number(tgChatId),
                  phone: contact.phone_number,
                  avatar_url: chat.avatar_url || null,
                })
                .eq('id', newAuthUser.user.id)

              // Привязываем чат к новому аккаунту
              await supabase
                .from('stylist_chats')
                .update({ user_id: newAuthUser.user.id })
                .eq('id', chat.id)

              const createdText = `Отлично, ${fromName}! 🌸 Аккаунт создан, номер сохранён.`
              await supabase.from('stylist_messages').insert({
                chat_id: chat.id, role: 'assistant', content: createdText,
                created_at: new Date().toISOString(),
              })
              await sendTelegram(tgChatId, createdText, { remove_keyboard: true })
              await sendTelegramWithButton(
                tgChatId,
                '🛍 Открывайте каталог прямо в Telegram:',
                '🛍 Открыть Capriccio',
                'https://t.me/Cap_Ricciobot/catalog'
              )
            }
          }
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
