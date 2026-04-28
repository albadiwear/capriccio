import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function fmt(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('.')
}

function fmtPrice(val) {
  if (!val) return '—'
  return Number(val).toLocaleString('ru-RU') + ' ₸'
}

export default function AdminNotificationsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications_queue')
      .select('*, users(full_name, email)')
      .eq('type', 'restock')
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markSent(id) {
    await supabase
      .from('notifications_queue')
      .update({ sent: true })
      .eq('id', id)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sent: true } : r))
    )
  }

  const total = rows.length
  const pending = rows.filter((r) => !r.sent).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Уведомления о поступлении</h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-500">
            Всего: {total} · Ожидают: {pending}
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Загрузка...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-400">Запросов пока нет</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Покупатель</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const p = r.payload || {}
                const user = r.users
                const customerName = user?.full_name || user?.email || 'Гость'
                const customerEmail = user?.full_name && user?.email ? user.email : null
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.product_image ? (
                          <img
                            src={p.product_image}
                            alt=""
                            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-100" />
                        )}
                        <Link
                          to={`/product/${p.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[180px] font-medium text-gray-900 hover:text-[#D4537E] hover:underline line-clamp-2 leading-tight"
                        >
                          {p.product_name || '—'}
                        </Link>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {fmtPrice(p.product_price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{customerName}</div>
                      {customerEmail && (
                        <div className="text-xs text-gray-400">{customerEmail}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {p.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.sent ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Отправлено
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Ожидает
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const phone = p.phone?.replace(/\D/g, '')
                            const productName = p.product_name ?? 'Товар'
                            const productId = p.product_id ?? ''
                            const productLink = `https://capriccio.vercel.app/product/${productId}`
                            const text = encodeURIComponent(
                              `Здравствуйте! Товар "${productName}" снова в наличии. Успейте заказать: ${productLink}`
                            )
                            window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.84L0 24l6.336-1.501A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.732.883.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/>
                          </svg>
                          WhatsApp
                        </button>
                        {!r.sent && (
                          <button
                            onClick={() => markSent(r.id)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors whitespace-nowrap"
                          >
                            Отмечено
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
