import { supabase } from './supabase'

export async function authWithTelegram() {
  const tg = window.Telegram?.WebApp
  if (!tg) return null

  const tgUser = tg.initDataUnsafe?.user
  if (!tgUser?.id) return null

  const telegramId = tgUser.id
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Telegram User'
  const username = tgUser.username || null
  const phone = tgUser.phone_number || null

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  if (existingUser) return existingUser

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    const { data: userByPhone } = await supabase
      .from('users')
      .select('*')
      .ilike('phone', `%${cleanPhone.slice(-10)}%`)
      .maybeSingle()

    if (userByPhone) {
      await supabase.from('users').update({ telegram_id: telegramId }).eq('id', userByPhone.id)
      return { ...userByPhone, telegram_id: telegramId }
    }
  }

  const { data: newUser } = await supabase
    .from('users')
    .insert({
      full_name: fullName,
      phone: phone || null,
      telegram_id: telegramId,
      lead_status: 'Новый',
      role: 'user',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (newUser) {
    const { data: existingChat } = await supabase
      .from('stylist_chats')
      .select('id')
      .eq('source', 'telegram')
      .eq('external_id', String(telegramId))
      .maybeSingle()

    if (!existingChat) {
      await supabase.from('stylist_chats').insert({
        user_id: newUser.id,
        source: 'telegram',
        external_id: String(telegramId),
        username: username,
        title: fullName,
        mode: 'ai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      await supabase.from('stylist_chats')
        .update({ user_id: newUser.id })
        .eq('id', existingChat.id)
    }
  }

  return newUser
}
