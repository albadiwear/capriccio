import { useState, useEffect } from 'react'
import { X, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUSES = [
  { value: 'pending', label: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Подтверждён', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipping', label: 'Доставляется', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Доставлен', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-red-100 text-red-700' },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.value, s]))

const DELIVERY_LABELS = {
  courier: 'Курьер',
  kazpost: 'Казпочта',
  cdek: 'СДЭК',
  yandex: 'Яндекс',
  indriver: 'InDriver',
}

const PAYMENT_LABELS = {
  card: 'Карта',
  cod: 'Наложенный',
  crypto: 'Крипто',
}

function OrderModal({ order, onClose, onStatusChange }) {
  const addr = order.delivery_address || {}

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-lg my-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Заказ {order.order_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Покупатель</p>
              <p className="font-medium text-gray-900">{order.customer_name || addr.full_name || '—'}</p>
              <p className="text-gray-600">{order.customer_phone || addr.phone || '—'}</p>
              <p className="text-gray-600">{order.customer_email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Адрес доставки</p>
              <p className="text-gray-700">
                {[addr.city, addr.street, `д. ${addr.house || ''}`, addr.apartment && `кв. ${addr.apartment}`]
                  .filter(Boolean).join(', ')}
              </p>
              {addr.postal_code && <p className="text-gray-500 text-xs mt-0.5">Индекс: {addr.postal_code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Доставка</p>
              <p className="font-medium">{DELIVERY_LABELS[order.delivery_method] || order.delivery_method || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Оплата</p>
              <p className="font-medium">{PAYMENT_LABELS[order.payment_method] || order.payment_method || '—'}</p>
            </div>
          </div>

          {order.order_items?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Товары</p>
              <div className="space-y-2">
                {order.order_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-700">
                    <span className="line-clamp-1 flex-1">{item.products?.name || `Товар #${item.product_id}`}</span>
                    <span className="ml-2 flex-shrink-0">{item.quantity} × {item.price?.toLocaleString('ru-RU')} ₸</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Стоимость доставки</span>
              <span>{order.delivery_cost?.toLocaleString('ru-RU') || 0} ₸</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Скидка ({order.promo_code})</span>
                <span>−{order.discount_amount?.toLocaleString('ru-RU')} ₸</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>Итого</span>
              <span>{order.total_amount?.toLocaleString('ru-RU')} ₸</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">Статус заказа</p>
            <select
              value={order.status}
              onChange={e => onStatusChange(order.id, e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Заказы</h1>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <ShoppingBag className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">Заказов нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Номер</th>
                <th className="text-left px-4 py-3 font-medium">Покупатель</th>
                <th className="text-right px-4 py-3 font-medium">Сумма</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Доставка</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Оплата</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Дата</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customer_email || order.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{order.total_amount?.toLocaleString('ru-RU')} ₸</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                    {DELIVERY_LABELS[order.delivery_method] || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">
                    {PAYMENT_LABELS[order.payment_method] || '—'}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs rounded px-1.5 py-1 border-0 font-medium focus:outline-none cursor-pointer ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
