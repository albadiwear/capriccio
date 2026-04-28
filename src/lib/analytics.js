import { supabase } from './supabase'

const SESSION_KEY = 'cap_session_id'

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

export async function trackEvent(type, payload = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').insert({
      type,
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      product_id: payload.product_id ?? null,
      category: payload.category ?? null,
      query: payload.query ?? null,
      meta: payload.meta ?? null,
    })
  } catch (e) {}
}
