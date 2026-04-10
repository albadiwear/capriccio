import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_BADGE = {
  pending: <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Ожидает</span>,
  active: <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Активен</span>,
  cancelled: <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Отклонён</span>,
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminAcademyPage() {
  const [tab, setTab] = useState('pending')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [tab])

  const loadOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('academy_orders')
      .select('*')
      .eq('status', tab)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const handleActivate = async (orderId, userEmail, tariffName) => {
    await supabase
      .from('academy_orders')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', orderId)
    alert(`Доступ активирован для ${userEmail}`)
    loadOrders()
  }

  const handleCancel = async (orderId) => {
    await supabase
      .from('academy_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    loadOrders()
  }

  const handleRevoke = async (orderId) => {
    await supabase
      .from('academy_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    loadOrders()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Академия</h1>
        <p className="mt-1 text-sm text-gray-500">Заявки и участники</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { key: 'pending', label: 'Заявки' },
          { key: 'active', label: 'Участники' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            {tab === 'pending' ? 'Новых заявок нет' : 'Активных участников нет'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тариф</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                  {tab === 'active' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Активирован</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.user_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.user_email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{order.user_phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.tariff_name || order.tariff}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {order.tariff_price > 0 ? `${Number(order.tariff_price).toLocaleString('ru-RU')} ₸` : 'Бесплатно'}
                    </td>
                    {tab === 'active' && (
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.activated_at)}</td>
                    )}
                    <td className="px-4 py-3">{STATUS_BADGE[order.status] || order.status}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {tab === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleActivate(order.id, order.user_email, order.tariff_name)}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                          >
                            Активировать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(order.id)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                      {tab === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(order.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Отозвать доступ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
