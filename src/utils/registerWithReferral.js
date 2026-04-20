import { supabase } from '../lib/supabase'
import { markReferralConverted, clearRefCode } from './referral'

export async function registerWithReferral({ userId, refCode }) {
  if (!userId || !refCode) return

  try {
    const { data: referrer } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', refCode)
      .maybeSingle()

    if (referrer?.id && referrer.id !== userId) {
      await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', userId)
        .is('referred_by', null)
    }

    await markReferralConverted(refCode)
  } catch (e) {
    console.error('[referral] registerWithReferral error:', e)
  } finally {
    clearRefCode()
  }
}
