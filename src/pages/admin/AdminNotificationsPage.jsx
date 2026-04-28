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
                      {!r.sent && (
                        <button
                          onClick={() => markSent(r.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors whitespace-nowrap"
                        >
                          Отмечено
                        </button>
                      )}
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
