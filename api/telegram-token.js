import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })

  const { data, error } = await supabase
    .from('telegram_auth_tokens')
    .insert({ user_id })
    .select('token')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ token: data.token })
}
