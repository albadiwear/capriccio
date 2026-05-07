import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

function verifyTelegramAuth(data) {
  const { hash, ...fields } = data
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest()
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

  return hmac === hash
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const tgUser = req.body
  if (!tgUser || !tgUser.id || !tgUser.hash) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  if (!verifyTelegramAuth(tgUser)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const telegramId = Number(tgUser.id)
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')

  // Ищем существующего пользователя по telegram_id
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  let email = existingUser?.email

  if (!existingUser) {
    // Создаём нового пользователя
    const tempEmail = `tg_${tgUser.id}@capriccio.app`

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        telegram_id: telegramId,
        avatar_url: tgUser.photo_url || null,
        username: tgUser.username || null,
      },
    })

    if (createError) {
      return res.status(500).json({ error: createError.message })
    }

    await supabase
      .from('users')
      .update({
        telegram_id: telegramId,
        avatar_url: tgUser.photo_url || null,
        username: tgUser.username || null,
      })
      .eq('id', created.user.id)

    email = tempEmail
  }

  // Генерируем ссылку для входа и извлекаем токены
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError) {
    return res.status(500).json({ error: linkError.message })
  }

  const { access_token, refresh_token } = linkData.properties

  return res.status(200).json({ access_token, refresh_token })
}
