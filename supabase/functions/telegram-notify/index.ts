// deno-lint-ignore-file no-explicit-any
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!

async function sendMessage(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async (req) => {
  const payload = await req.json()
  const { table, record } = payload

  if (table === 'orders') {
    const o = record
    await sendMessage(
      `🛍 <b>Новый заказ #${o.id.slice(0, 8)}</b>\n` +
      `💰 Сумма: ${Number(o.total_amount).toLocaleString()} ₸\n` +
      `📦 Доставка: ${o.delivery_method ?? '—'}\n` +
      `📞 Телефон: ${o.phone ?? '—'}`
    )
  }

  if (table === 'users') {
    const u = record
    await sendMessage(
      `👤 <b>Новый лид</b>\n` +
      `📧 Email: ${u.email}\n` +
      `🕐 Только что зарегистрировался`
    )
  }

  return new Response('ok')
})
