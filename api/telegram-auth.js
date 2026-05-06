import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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

    if (existing) return res.status(200).json({ user: existing })

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      const { data: byPhone } = await supabase
        .from('users')
        .select('*')
        .ilike('phone', `%${cleanPhone.slice(-10)}%`)
        .maybeSingle()

      if (byPhone) {
        await supabase.from('users').update({ telegram_id }).eq('id', byPhone.id)
        return res.status(200).json({ user: { ...byPhone, telegram_id } })
      }
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        full_name: full_name || 'Telegram User',
        phone: phone || null,
        telegram_id,
        lead_status: 'Новый',
        role: 'user',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

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

    return res.status(200).json({ user: newUser })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
