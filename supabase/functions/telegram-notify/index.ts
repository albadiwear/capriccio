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
    const orderNumber = o.order_number ?? `CAP-${String(o.id).slice(0, 5).toUpperCase()}`
    const phone = o.delivery_address?.phone ?? '—'
    const city = o.delivery_address?.city ?? '—'

    const paymentLabel =
      o.payment_method === 'card'
        ? 'Карта'
        : o.payment_method === 'cod'
        ? 'Наложенный платёж'
        : o.payment_method === 'crypto'
        ? 'Криптовалюта'
        : (o.payment_method ?? '—')

    const deliveryLabel =
      o.delivery_method === 'courier'
        ? 'Курьер'
        : o.delivery_method === 'pickup'
        ? 'Самовывоз'
        : o.delivery_method === 'kazpost'
        ? 'Казпочта'
        : o.delivery_method === 'cdek'
        ? 'СДЭК'
        : o.delivery_method === 'yandex'
        ? 'Яндекс'
        : o.delivery_method === 'indriver'
        ? 'InDriver'
        : (o.delivery_method ?? '—')

    const adminLink = `https://capriccio.vercel.app/admin/orders/${o.id}`
    await sendMessage(
      `🛍 Новый заказ #${orderNumber}\n` +
      `💰 Сумма: ${Number(o.total_amount).toLocaleString('ru-RU')} ₸\n` +
      `📞 Телефон: ${phone}\n` +
      `📦 Доставка: ${deliveryLabel} • ${city}\n` +
      `💳 Оплата: ${paymentLabel}\n` +
      `🔗 ${adminLink}`
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

  if (table === 'notifications_queue') {
    const n = record
    const productLink = `https://capriccio.vercel.app/product/${n.product_id}`
    const phone = n.meta?.phone ?? '—'
    const name = n.meta?.product_name ?? '—'
    const price = n.meta?.product_price
      ? Number(n.meta.product_price).toLocaleString('ru-RU') + ' ₸'
      : '—'
    await sendMessage(
      `🔔 Запрос на поступление\n` +
      `👗 Товар: ${name}\n` +
      `💰 Цена: ${price}\n` +
      `📞 Телефон: ${phone}\n` +
      `🔗 ${productLink}`
    )
  }

  return new Response('ok')
})
