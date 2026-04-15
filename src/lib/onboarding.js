import { supabase } from './supabase'

export async function getPostSignupRedirect(userId) {
  if (!userId) return '/catalog'

  const { data, error } = await supabase
    .from('stylist_profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('getPostSignupRedirect error:', error)
    return '/onboarding'
  }

  if (!data || data.onboarding_completed !== true) {
    return '/onboarding'
  }

  return '/catalog'
}

