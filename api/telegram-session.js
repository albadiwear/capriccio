import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Missing token' })

  const { data: tokenData, error: tokenError } = await supabase
    .from('telegram_auth_tokens')
    .select('id, user_id, used, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (tokenError || !tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  if (tokenData.used || new Date(tokenData.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  await supabase
    .from('telegram_auth_tokens')
    .update({ used: true })
    .eq('id', tokenData.id)

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', tokenData.user_id)
    .maybeSingle()

  if (userError || !userData?.email) {
    return res.status(500).json({ error: 'User not found' })
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.email,
  })

  if (linkError) return res.status(500).json({ error: linkError.message })

  const { access_token, refresh_token } = linkData.properties

  return res.status(200).json({ access_token, refresh_token })
}
