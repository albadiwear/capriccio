import { supabase } from '../lib/supabase'

const KEY = 'capriccio_ref'
const TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
const CLICK_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function saveRefCode(code) {
  if (!code) return
  localStorage.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }))
}

export function getRefCode() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > TTL) {
      clearRefCode()
      return null
    }
    return code
  } catch {
    clearRefCode()
    return null
  }
}

export function clearRefCode() {
  localStorage.removeItem(KEY)
}

export async function trackReferralClick(code) {
  if (!code) return

  const clickKey = `capriccio_ref_clicked_${code}`
  const raw = localStorage.getItem(clickKey)
  if (raw) {
    try {
      const { clickedAt } = JSON.parse(raw)
      if (Date.now() - clickedAt < CLICK_TTL) return // already tracked within 24h
    } catch { /* ignore */ }
  }

  const { error } = await supabase
    .from('referral_clicks')
    .insert({ referral_code: code, converted: false })

  if (error) {
    console.error('[referral] trackReferralClick failed:', error)
    return // don't mark localStorage so the next visit retries
  }

  localStorage.setItem(clickKey, JSON.stringify({ clickedAt: Date.now() }))
}

export async function markReferralConverted(code) {
  if (!code) return
  // Find the most recent unconverted click for this code and mark it converted
  const { data: click } = await supabase
    .from('referral_clicks')
    .select('id')
    .eq('referral_code', code)
    .eq('converted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (click?.id) {
    await supabase
      .from('referral_clicks')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', click.id)
  }
}
