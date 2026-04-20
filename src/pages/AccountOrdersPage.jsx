import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

const statusMap = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipping: 'bg-sky-100 text-sky-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabelMap = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  shipping: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export default function AccountOrdersPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    loadOrders()
  }, [user])

  async function loadOrders() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      console.error('AccountOrdersPage.loadOrders error:', e)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <AccountSidebarMobile />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <AccountSidebarDesktop />
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Мои заказы</h2>
              <p className="mt-1 text-sm text-gray-500">История ваших покупок и статусы доставки</p>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
                Загрузка...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
                У вас пока нет заказов
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Заказ #{order.order_number || order.id?.slice(0, 8)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusMap[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabelMap[order.status] || order.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Number(order.total_amount || order.total || 0).toLocaleString('ru-RU')} ₸
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={item.products?.images?.[0] || 'https://picsum.photos/seed/order/120/120'}
                          alt={item.products?.name || 'Товар'}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.products?.name || 'Товар'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.quantity} шт. · {Number(item.price || 0).toLocaleString('ru-RU')} ₸
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
