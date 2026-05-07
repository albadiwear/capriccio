import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getSessionForUser(userId, telegramId) {
  const email = `tg_${telegramId}@capriccio.app`
  const password = `tg_${telegramId}_secret`

  const { data: signInData } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInData?.session) return signInData.session
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { telegram_id, full_name, username, phone } = req.body

    if (!telegram_id) return res.status(400).json({ error: 'No telegram_id' })

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .maybeSingle()

    if (existing) {
      const session = await getSessionForUser(existing.id, telegram_id)
      return res.status(200).json({ user: existing, session })
    }

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      const { data: byPhone } = await supabase
        .from('users')
        .select('*')
        .ilike('phone', `%${cleanPhone.slice(-10)}%`)
        .maybeSingle()

      if (byPhone) {
        await supabase.from('users').update({ telegram_id }).eq('id', byPhone.id)
        const session = await getSessionForUser(byPhone.id, telegram_id)
        return res.status(200).json({ user: { ...byPhone, telegram_id }, session })
      }
    }

    const fakeEmail = `tg_${telegram_id}@capriccio.app`
    const fakePassword = `tg_${telegram_id}_secret`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: fakePassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || 'Telegram User',
        telegram_id,
      }
    })

    if (authError) return res.status(500).json({ error: authError.message })

    const userId = authData.user.id
    await supabase.from('users').update({
      telegram_id,
      full_name: full_name || 'Telegram User',
      phone: phone || null,
      lead_status: 'Новый',
    }).eq('id', userId)

    const { data: newUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: existingChat } = await supabase
      .from('stylist_chats')
      .select('id')
      .eq('source', 'telegram')
      .eq('external_id', String(telegram_id))
      .maybeSingle()

    if (!existingChat) {
      await supabase.from('stylist_chats').insert({
        user_id: newUser.id,
        source: 'telegram',
        external_id: String(telegram_id),
        username: username || null,
        title: full_name || 'Telegram User',
        mode: 'ai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      await supabase.from('stylist_chats')
        .update({ user_id: newUser.id })
        .eq('id', existingChat.id)
    }

    const session = await getSessionForUser(userId, telegram_id)
    return res.status(200).json({ user: newUser, session })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
