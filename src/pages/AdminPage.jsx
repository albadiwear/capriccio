import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, TrendingUp, Users, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_LABEL = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  shipping: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function MetricCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        : <p className="text-2xl font-bold text-gray-900">{value}</p>
      }
    </div>
  )
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState({ orders: 0, revenue: 0, customers: 0, products: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [
          { count: ordersCount, error: ordersCountError },
          { data: revenueData, error: revenueError },
          { count: customersCount, error: customersError },
          { count: productsCount, error: productsError },
          { data: orders, error: ordersError },
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total_amount').eq('status', 'delivered'),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders')
            .select('id, order_number, total_amount, status, created_at, customer_email')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        const firstError =
          ordersCountError || revenueError || customersError || productsError || ordersError
        if (firstError) throw firstError

        const revenue = (revenueData || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)
        setMetrics({
          orders: ordersCount || 0,
          revenue,
          customers: customersCount || 0,
          products: productsCount || 0,
        })
        setRecentOrders(orders || [])
      } catch (e) {
        console.error('AdminPage.load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Дашборд</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={ShoppingBag} label="Всего заказов" value={metrics.orders} loading={loading} />
        <MetricCard
          icon={TrendingUp}
          label="Выручка (доставлено)"
          value={`${metrics.revenue.toLocaleString('ru-RU')} ₸`}
          loading={loading}
        />
        <MetricCard icon={Users} label="Покупателей" value={metrics.customers} loading={loading} />
        <MetricCard icon={Package} label="Товаров" value={metrics.products} loading={loading} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Последние заказы</h2>
          <Link to="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 underline">
            Смотреть все
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Заказов пока нет</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Номер</th>
                  <th className="text-left px-5 py-3 font-medium">Покупатель</th>
                  <th className="text-right px-5 py-3 font-medium">Сумма</th>
                  <th className="text-center px-5 py-3 font-medium">Статус</th>
                  <th className="text-right px-5 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-5 py-3 text-gray-600">{order.customer_email || '—'}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {order.total_amount?.toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
