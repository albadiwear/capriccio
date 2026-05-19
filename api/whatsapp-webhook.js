import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

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

    const phoneDigits = normalizePhone(waChatId.replace('@c.us', '')) // "77001234567"
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
    let { data: usersWithPhone, error: userLookupError } = await supabase
      .from('users')
      .select('id, full_name, phone, lead_source')
      .not('phone', 'is', null)

    if (userLookupError) {
      console.error('[whatsapp-webhook] users lookup failed', {
        phone,
        phoneDigits,
        waChatId,
        error: {
          message: userLookupError.message,
          details: userLookupError.details,
          hint: userLookupError.hint,
          code: userLookupError.code,
        },
      })
      throw userLookupError
    }

    let user = usersWithPhone?.find((u) => normalizePhone(u.phone) === phoneDigits) || null

    if (user?.id) {
      console.log('[merge] found existing user by phone', {
        existingId: user.id,
        phoneDigits,
      })

      if (senderName && (user.full_name === 'WhatsApp клиент' || user.full_name === 'Telegram клиент')) {
        await supabase
          .from('users')
          .update({ full_name: senderName })
          .eq('id', user.id)

        user = { ...user, full_name: senderName }
      }
    }

    if (!user?.id) {
      console.log('[whatsapp-webhook] user create start', {
        phone,
        phoneDigits,
        waChatId,
        senderName,
      })

      // Create the auth user first so users.id satisfies the FK to auth.users.
      const tempEmail = `wa_${phoneDigits}@capriccio.app`
      const tempPassword = crypto.randomUUID()

      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: senderName, provider: 'whatsapp' },
        })

      let authUserId = created?.user?.id || null

      if (createError) {
        // Auth user already exists — resolve its id by email.
        const { data: list } = await supabase.auth.admin.listUsers()
        const existingAuthUser = list?.users?.find((u) => u.email === tempEmail)
        authUserId = existingAuthUser?.id || null

        if (!authUserId) {
          console.error('[whatsapp-webhook] auth user resolve failed', {
            phone,
            phoneDigits,
            waChatId,
            tempEmail,
            error: {
              message: createError.message,
              status: createError.status,
            },
          })
          throw createError
        }
      }

      const newUserPayload = {
        id: authUserId,
        full_name: senderName || 'WhatsApp клиент',
        phone,
        email: tempEmail,
        lead_source: 'whatsapp',
        lead_status: 'Новый',
      }

      // upsert: a DB trigger may already have created the users row on
      // auth.admin.createUser — onConflict keeps this idempotent.
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .upsert(newUserPayload, { onConflict: 'id' })
        .select('id')
        .single()

      if (newUserError) {
        console.error('[whatsapp-webhook] users insert failed', {
          phone,
          phoneDigits,
          waChatId,
          senderName,
          payload: newUserPayload,
          error: {
            message: newUserError.message,
            details: newUserError.details,
            hint: newUserError.hint,
            code: newUserError.code,
          },
        })
        throw newUserError
      }

      console.log('[whatsapp-webhook] user create end', {
        phone,
        userId: newUser?.id || null,
      })

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
