import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PERIODS = [
  { label: 'Сегодня', days: 0 },
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: 'Всё время', days: null },
]

function getDateFrom(days) {
  if (days === null) return null
  if (days === 0) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('.')
}

function MetricCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-[#f0ede8] bg-white px-5 py-4">
      <div className="text-3xl font-bold text-gray-900">
        {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-100" /> : value}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState(1)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [productsMap, setProductsMap] = useState({})
  const [report, setReport] = useState('')
  const [loadingReport, setLoadingReport] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const dateFrom = getDateFrom(PERIODS[period].days)
      let query = supabase
        .from('events')
        .select('type, user_id, session_id, product_id, query, created_at')
      if (dateFrom) query = query.gte('created_at', dateFrom)

      const { data } = await query
      const rows = data || []
      setEvents(rows)

      const views = rows.filter((e) => e.type === 'product_view' && e.product_id)
      const countById = {}
      for (const e of views) {
        countById[e.product_id] = (countById[e.product_id] || 0) + 1
      }
      const sorted = Object.entries(countById)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
      setTopProducts(sorted)

      if (sorted.length > 0) {
        const ids = sorted.map(([id]) => id)
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, images, price')
          .in('id', ids)
        const map = {}
        for (const p of prods || []) map[p.id] = p
        setProductsMap(map)
      } else {
        setProductsMap({})
      }

      setLoading(false)
    }

    load()
  }, [period])

  async function generateReport() {
    setLoadingReport(true)
    setReport('')
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - 30)

      const { data: eventsData } = await supabase
        .from('events')
        .select('type, product_id, query, category, meta')
        .gte('created_at', dateFrom.toISOString())

      const { data: restockData } = await supabase
        .from('notifications_queue')
        .select('payload')
        .eq('type', 'restock')
        .eq('sent', false)

      const viewCounts = {}
      eventsData?.filter((e) => e.type === 'product_view').forEach((e) => {
        if (e.product_id) {
          viewCounts[e.product_id] = (viewCounts[e.product_id] || 0) + 1
        }
      })
      const topProductIds = Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id)

      const { data: topProds } = topProductIds.length > 0
        ? await supabase
            .from('products')
            .select('name, category, price')
            .in('id', topProductIds)
        : { data: [] }

      const searchQueries = eventsData
        ?.filter((e) => e.type === 'search' && e.query)
        .map((e) => e.query)
        .slice(0, 20)

      const restockItems = restockData
        ?.map((r) => r.payload?.product_name)
        .filter(Boolean)
        .slice(0, 10)

      let wordstatData = ''
      try {
        const keywords = [
          'женская одежда Казахстан',
          'пуховик женский',
          'трикотаж женский',
          'кардиган женский',
          'костюм женский',
        ]
        const wordstatResults = await Promise.all(
          keywords.map(async (keyword) => {
            const res = await fetch(
              'https://searchapi.api.cloud.yandex.net/v2/wordstat/top?' +
                new URLSearchParams({
                  folderId: import.meta.env.VITE_YANDEX_FOLDER_ID,
                  keywords: keyword,
                  limit: '5',
                }),
              {
                headers: {
                  Authorization: `Api-Key ${import.meta.env.VITE_YANDEX_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            if (res.ok) {
              const d = await res.json()
              return `${keyword}: ${JSON.stringify(d)}`
            }
            return `${keyword}: нет данных`
          })
        )
        wordstatData = wordstatResults.join('\n')
      } catch (e) {
        wordstatData = 'Яндекс Wordstat недоступен'
      }

      const prompt = `Ты аналитик закупок для интернет-магазина женской одежды Capriccio (Казахстан, аудитория женщины 35+, размеры 48-60, средний чек 18 000 ₸).

Данные за последние 30 дней:

ТОП ПРОСМАТРИВАЕМЫХ ТОВАРОВ:
${topProds?.map((p) => `- ${p.name} (${p.category}, ${p.price} ₸)`).join('\n') || 'нет данных'}

ПОИСКОВЫЕ ЗАПРОСЫ ПОКУПАТЕЛЕЙ:
${searchQueries?.join(', ') || 'нет данных'}

ЗАПРОСЫ НА ПОСТУПЛЕНИЕ (товары которых нет в наличии):
${restockItems?.join(', ') || 'нет данных'}

ДАННЫЕ ЯНДЕКС WORDSTAT:
${wordstatData}

На основе этих данных дай конкретные рекомендации:
1. Какие категории товаров закупить в первую очередь
2. Какие конкретные позиции добавить
3. На какие размеры сделать акцент
4. Какие тренды видны по Wordstat
      5. Общий вывод и приоритеты закупа

	Отвечай на русском, конкретно и по делу. Формат: заголовки и списки.`

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        setReport('Ошибка: ' + res.status)
        return
      }

      const result = await res.json()
      setReport(result?.text || 'Нет ответа от Claude')
    } catch (e) {
      setReport('Ошибка при генерации отчёта')
    } finally {
      setLoadingReport(false)
    }
  }

  const views = events.filter((e) => e.type === 'product_view').length
  const sessions = new Set(events.map((e) => e.session_id)).size
  const cartAdds = events.filter((e) => e.type === 'add_to_cart').length
  const wishlists = events.filter((e) => e.type === 'wishlist_toggle').length

  const searchCounts = {}
  for (const e of events) {
    if (e.type === 'search' && e.query) {
      searchCounts[e.query] = (searchCounts[e.query] || 0) + 1
    }
  }
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const dayCounts = {}
  for (const e of events) {
    if (!e.created_at) continue
    const day = e.created_at.slice(0, 10)
    dayCounts[day] = (dayCounts[day] || 0) + 1
  }
  const dayRows = Object.entries(dayCounts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30)
  const maxDayCount = dayRows.length > 0 ? Math.max(...dayRows.map(([, c]) => c)) : 1

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Аналитика</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriod(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                period === i
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Просмотры товаров" value={views} loading={loading} />
        <MetricCard label="Уникальные сессии" value={sessions} loading={loading} />
        <MetricCard label="Добавлений в корзину" value={cartAdds} loading={loading} />
        <MetricCard label="В вишлист" value={wishlists} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Топ товаров */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Топ просматриваемых товаров</h2>
          </div>
          {loading ? (
            <div className="px-5 py-4 text-sm text-gray-400">Загрузка...</div>
          ) : topProducts.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-400">Нет данных</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map(([id, count], idx) => {
                const prod = productsMap[id]
                return (
                  <div key={id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-xs text-gray-400 flex-shrink-0">{idx + 1}</span>
                    {prod?.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm font-medium text-gray-900 hover:text-[#D4537E] hover:underline"
                      >
                        {prod?.name || id}
                      </Link>
                      {prod?.price && (
                        <span className="text-xs text-gray-400">
                          {Number(prod.price).toLocaleString('ru-RU')} ₸
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Поисковые запросы */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Популярные поисковые запросы</h2>
          </div>
          {loading ? (
            <div className="px-5 py-4 text-sm text-gray-400">Загрузка...</div>
          ) : topSearches.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-400">Нет данных</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topSearches.map(([q, count], idx) => (
                <div key={q} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-xs text-gray-400 flex-shrink-0">{idx + 1}</span>
                  <span className="flex-1 text-sm text-gray-900 truncate">{q}</span>
                  <span className="flex-shrink-0 text-sm font-semibold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* График активности */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Активность по дням</h2>
        </div>
        {loading ? (
          <div className="px-5 py-4 text-sm text-gray-400">Загрузка...</div>
        ) : dayRows.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-400">Нет данных</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 w-32">Дата</th>
                  <th className="px-5 py-3">События</th>
                  <th className="px-5 py-3 w-16 text-right">Кол-во</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dayRows.map(([day, count]) => {
                  const pct = Math.round((count / maxDayCount) * 100)
                  return (
                    <tr key={day} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-5 py-2.5 text-gray-600">{fmtDate(day)}</td>
                      <td className="px-5 py-2.5">
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-[#D4537E]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right font-medium text-gray-900">
                        {count}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ИИ отчёт */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">ИИ отчёт перед закупом</h2>
        </div>
        <div className="px-5 py-5">
          <p className="mb-4 text-sm text-gray-500">
            Claude проанализирует поведение покупателей и даст рекомендации что закупать
          </p>
          <button
            onClick={generateReport}
            disabled={loadingReport}
            className="rounded-xl bg-[#D4537E] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loadingReport ? 'Анализируем...' : 'Сгенерировать отчёт'}
          </button>
          {loadingReport && (
            <div className="mt-4 text-sm text-gray-500 animate-pulse">
              Claude анализирует данные...
            </div>
          )}
          {report && (
            <div className="mt-4 rounded-xl border border-[#f0ede8] bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {report}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
