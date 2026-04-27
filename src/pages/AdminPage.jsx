import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, TrendingUp, Users, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
]

const STATUS_ORDER = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']

const STATUS_META = {
  pending:   { label: 'Новый',       color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Подтверждён', color: '#3B82F6', bg: '#DBEAFE' },
  shipping:  { label: 'В пути',      color: '#8B5CF6', bg: '#EDE9FE' },
  delivered: { label: 'Доставлен',   color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Отменён',     color: '#EF4444', bg: '#FEE2E2' },
}

const STATUS_ALIASES = {
  Новый: 'pending',
  'Подтверждён': 'confirmed',
  'В доставке': 'shipping',
  'В пути': 'shipping',
  Доставлен: 'delivered',
  Отменён: 'cancelled',
}

function normalizeOrderStatus(status) {
  if (!status) return status
  if (STATUS_META[status]) return status
  return STATUS_ALIASES[status] || status
}

function getDateFrom(period) {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  if (period === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  return null
}

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
}

function MetricCard({ icon: Icon, label, value, sub, loading }) {
  return (
    <div className="bg-white border border-[#f0ede8] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#D4537E]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#D4537E]" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </>
      )}
    </div>
  )
}

function HBar({ label, value, max, rightSlot }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-sm text-gray-700 truncate">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot}
          <span className="text-sm font-semibold text-gray-900 tabular-nums w-10 text-right">
            {value.toLocaleString('ru-RU')}
          </span>
        </div>
      </div>
      <div className="h-2 bg-[#f0ede8] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D4537E] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-sm text-gray-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
          <span className="text-sm font-semibold text-gray-900 tabular-nums w-8 text-right">
            {count}
          </span>
        </div>
      </div>
      <div className="h-2 bg-[#f0ede8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ totalOrders: 0, revenue: 0, activeClients: 0, avgCheck: 0 })
  const [funnel, setFunnel] = useState({ registered: 0, onboarded: 0, ordered: 0, purchased: 0 })
  const [statusCounts, setStatusCounts] = useState({})
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    load()
  }, [period])

  async function load() {
    setLoading(true)
    try {
      const dateFrom = getDateFrom(period)

      const [ordersRes, usersCountRes, onboardedRes, recentOrdersRes] = await Promise.all([
        (() => {
          let q = supabase
            .from('orders')
            .select('id, user_id, total_amount, status, order_items(product_id, quantity, price, products(name))')
          if (dateFrom) q = q.gte('created_at', dateFrom)
          return q
        })(),
        (() => {
          let q = supabase.from('users').select('*', { count: 'exact', head: true })
          if (dateFrom) q = q.gte('created_at', dateFrom)
          return q
        })(),
        (() => {
          let q = supabase
            .from('stylist_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('onboarding_completed', true)
          if (dateFrom) q = q.gte('created_at', dateFrom)
          return q
        })(),
        supabase
          .from('orders')
          .select('id, order_number, total_amount, status, created_at, delivery_address, users(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const orders = ordersRes.data || []
      const delivered = orders.filter((o) => normalizeOrderStatus(o.status) === 'delivered')
      const revenue = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0)
      const activeClients = new Set(orders.map((o) => o.user_id).filter(Boolean)).size
      const avgCheck = delivered.length > 0 ? Math.round(revenue / delivered.length) : 0

      setMetrics({ totalOrders: orders.length, revenue, activeClients, avgCheck })

      setFunnel({
        registered: usersCountRes.count || 0,
        onboarded: onboardedRes.count || 0,
        ordered: new Set(orders.map((o) => o.user_id).filter(Boolean)).size,
        purchased: new Set(delivered.map((o) => o.user_id).filter(Boolean)).size,
      })

      const counts = {}
      for (const o of orders) {
        const key = normalizeOrderStatus(o.status)
        counts[key] = (counts[key] || 0) + 1
      }
      setStatusCounts(counts)

      const productMap = {}
      for (const order of orders) {
        for (const item of order.order_items || []) {
          const id = item.product_id
          if (!productMap[id]) {
            productMap[id] = { id, name: item.products?.name || '—', count: 0, total: 0 }
          }
          productMap[id].count += Number(item.quantity || 0)
          productMap[id].total += Number(item.price || 0) * Number(item.quantity || 0)
        }
      }
      setTopProducts(Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5))

      setRecentOrders(recentOrdersRes.data || [])
    } catch (e) {
      console.error('AdminPage.load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const conv = (num, den) =>
    den > 0 ? (
      <span className="text-xs text-gray-400 tabular-nums">
        {Math.round((num / den) * 100)}%
      </span>
    ) : null

  return (
    <div className="space-y-6">
      {/* Header + period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Дашборд</h1>
        <div className="flex gap-1 bg-[#f0ede8] rounded-lg p-1 self-start sm:self-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === opt.value
                  ? 'bg-white text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Block 1: Key metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={ShoppingBag}
          label="Всего заказов"
          value={metrics.totalOrders.toLocaleString('ru-RU')}
          loading={loading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Выручка"
          value={`${metrics.revenue.toLocaleString('ru-RU')} ₸`}
          sub="доставленных заказов"
          loading={loading}
        />
        <MetricCard
          icon={Users}
          label="Активных клиентов"
          value={metrics.activeClients.toLocaleString('ru-RU')}
          sub="разместили заказ"
          loading={loading}
        />
        <MetricCard
          icon={CreditCard}
          label="Средний чек"
          value={`${metrics.avgCheck.toLocaleString('ru-RU')} ₸`}
          sub="по доставленным"
          loading={loading}
        />
      </div>

      {/* Block 2 + 3: Funnel & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <div className="bg-white border border-[#f0ede8] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Воронка продаж</h2>
            <span className="text-xs text-gray-400">
              {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </span>
          </div>
          {loading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-5">
              <HBar
                label="Зарегистрировались"
                value={funnel.registered}
                max={funnel.registered}
                rightSlot={null}
              />
              <HBar
                label="Заполнили анкету"
                value={funnel.onboarded}
                max={funnel.registered}
                rightSlot={conv(funnel.onboarded, funnel.registered)}
              />
              <HBar
                label="Сделали заказ"
                value={funnel.ordered}
                max={funnel.registered}
                rightSlot={conv(funnel.ordered, funnel.onboarded)}
              />
              <HBar
                label="Купили"
                value={funnel.purchased}
                max={funnel.registered}
                rightSlot={conv(funnel.purchased, funnel.ordered)}
              />
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-[#f0ede8] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Заказы по статусам</h2>
          {loading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : metrics.totalOrders === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных за период</p>
          ) : (
            <div className="space-y-5">
              {STATUS_ORDER.map((status) => (
                <StatusBar
                  key={status}
                  label={STATUS_META[status]?.label || status}
                  count={statusCounts[status] || 0}
                  total={metrics.totalOrders}
                  color={STATUS_META[status]?.color || '#9CA3AF'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block 4 + 5: Top products & Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Top 5 products */}
        <div className="bg-white border border-[#f0ede8] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Топ 5 товаров</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных за период</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#D4537E]/40 w-4 flex-shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate leading-snug">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.count} шт. · {product.total.toLocaleString('ru-RU')} ₸
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last 5 orders */}
        <div className="bg-white border border-[#f0ede8] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede8]">
            <h2 className="text-sm font-semibold text-gray-900">Последние заказы</h2>
            <Link
              to="/admin/orders"
              className="text-xs text-[#D4537E] hover:opacity-75 transition-opacity"
            >
              Все заказы →
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-9" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-sm text-gray-400 text-center">Заказов пока нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-[#f0ede8]">
                    <th className="text-left px-5 py-3 font-medium">Номер</th>
                    <th className="text-left px-5 py-3 font-medium">Клиент</th>
                    <th className="text-right px-5 py-3 font-medium">Сумма</th>
                    <th className="text-center px-5 py-3 font-medium">Статус</th>
                    <th className="text-right px-5 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
	                  {recentOrders.map((order) => {
                    const customerName =
                      order.users?.full_name ||
                      order.delivery_address?.full_name ||
                      '—'
	                    const meta = STATUS_META[normalizeOrderStatus(order.status)]
	                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#f0ede8] last:border-0 hover:bg-[#fdf9f7] transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 tabular-nums">
                          {order.order_number || String(order.id).slice(0, 8)}
                        </td>
                        <td className="px-5 py-3 text-gray-500 max-w-[140px] truncate">
                          {customerName}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-900 tabular-nums">
                          {Number(order.total_amount || 0).toLocaleString('ru-RU')} ₸
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              color: meta?.color || '#6B7280',
                              background: meta?.bg || '#F3F4F6',
                            }}
                          >
                            {meta?.label || order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400 text-xs tabular-nums">
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
