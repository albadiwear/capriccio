import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, ShoppingBag, TrendingUp, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUSES = [
  { value: 'pending', label: 'Новый', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Подтверждён', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipping', label: 'В доставке', color: 'bg-orange-100 text-orange-700' },
  { value: 'delivered', label: 'Доставлен', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-red-100 text-red-700' },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map((status) => [status.value, status]))

const PAYMENT_LABELS = {
  card: 'Карта Visa / Mastercard',
  cod: 'Наложенный платёж',
  crypto: 'Криптовалюта (USDT)',
}

function MetricCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-28 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}

function formatPhoneForWhatsApp(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function getCustomerName(order) {
  return order.users?.full_name || order.delivery_address?.full_name || order.customer_name || '—'
}

function getCustomerPhone(order) {
  return order.users?.phone || order.delivery_address?.phone || order.customer_phone || ''
}

function getCustomerEmail(order) {
  return order.users?.email || order.customer_email || '—'
}

function getDeliveryAddress(order) {
  const address = order.delivery_address || {}

  return [
    address.city,
    address.street,
    address.house ? `д. ${address.house}` : null,
    address.apartment ? `кв. ${address.apartment}` : null,
    address.postal_code ? `индекс ${address.postal_code}` : null,
  ]
    .filter(Boolean)
    .join(', ')
}

function OrderDetailsModal({ order, onClose, onStatusChange }) {
  const orderNumber = String(order.id).slice(0, 8)
  const customerPhone = getCustomerPhone(order)
  const comment = order.comment || order.notes || order.customer_comment || '—'

  console.log('order_items:', order.order_items)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative my-6 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Детали заказа</h2>
            <p className="mt-1 text-sm text-gray-500">Номер заказа: {orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-900"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Покупатель</p>
              <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
              <p className="mt-1 text-sm text-gray-600">{customerPhone || '—'}</p>
              <p className="mt-1 text-sm text-gray-600">{getCustomerEmail(order)}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Адрес доставки</p>
              <p className="text-sm leading-6 text-gray-700">{getDeliveryAddress(order) || '—'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Способ оплаты</p>
              <p className="text-sm font-medium text-gray-900">
                {PAYMENT_LABELS[order.payment_method] || order.payment_method || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Статус</p>
              <select
                value={order.status}
                onChange={(event) => onStatusChange(order.id, event.target.value)}
                className={`h-10 rounded-lg border-0 px-3 text-sm font-medium outline-none ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-700'}`}
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wider text-gray-400">Список товаров</p>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              {order.order_items?.length > 0 ? (
                order.order_items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 500 }}>{item.products?.name || '—'}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>
                        Размер: {item.product_variants?.size || '—'} · {item.quantity} шт.
                      </p>
                    </div>
                    <p style={{ fontWeight: 500 }}>{Number(item.price).toLocaleString('ru-RU')} ₸</p>
                  </div>
                ))
              ) : (
                <p className="px-4 py-5 text-sm text-gray-400">Товары не найдены</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Комментарий</p>
            <p className="text-sm text-gray-700">{comment}</p>
          </div>

          <div className="flex justify-between border-t border-gray-100 pt-4">
            <span className="text-base font-medium text-gray-600">Итого</span>
            <span className="text-xl font-bold text-gray-900">
              {order.total_amount?.toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userParam = searchParams.get('user')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)

      let query = supabase
        .from('orders')
        .select(`
          *,
          users(full_name, phone, email),
          order_items(
            id,
            product_id,
            variant_id,
            quantity,
            price,
            products(name),
            product_variants(size, color)
          )
        `)
        .order('created_at', { ascending: false })

      if (userParam) {
        query = query.eq('user_id', userParam)
      }

      const { data } = await query

      console.log('Первый заказ:', JSON.stringify(data[0], null, 2))

      setOrders(data || [])
      setLoading(false)
    }

    loadOrders()
  }, [userParam])

  async function handleStatusChange(orderId, status) {
    const order = orders.find((item) => item.id === orderId)
    const previousStatus = order?.status

    await supabase.from('orders').update({ status }).eq('id', orderId)

    if (status === 'delivered' && previousStatus !== 'delivered' && order) {
      for (const item of order.order_items || []) {
        if (item.variant_id) {
          const { error: decrementError } = await supabase.rpc('decrement_stock', {
            variant_id: item.variant_id,
            amount: item.quantity,
          })

          if (decrementError) {
            console.error('decrement_stock error:', decrementError)
          }
        } else {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('id, stock')
            .eq('product_id', item.product_id)
            .order('stock', { ascending: false })
            .limit(1)

          if (variants?.[0]) {
            await supabase
              .from('product_variants')
              .update({ stock: Math.max(0, variants[0].stock - item.quantity) })
              .eq('id', variants[0].id)
          }
        }
      }

    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    )

    setSelectedOrder((current) =>
      current?.id === orderId ? { ...current, status } : current
    )
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      const customerName = getCustomerName(order).toLowerCase()
      const shortId = String(order.id).slice(0, 8).toLowerCase()
      const matchesSearch = !query || customerName.includes(query) || shortId.includes(query)
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const metrics = useMemo(() => {
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const newOrders = orders.filter((order) => order.status === 'pending').length

    return {
      totalOrders: orders.length,
      newOrders,
      totalAmount,
    }
  }, [orders])

  return (
    <div>
      {userParam && (
        <div className="mb-2 flex items-center gap-3">
          <button
            onClick={() => { window.location.href = '/admin/orders' }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Все заказы
          </button>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Заказы</h1>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={ShoppingBag}
          label="Всего заказов"
          value={metrics.totalOrders}
          loading={loading}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Новых заказов"
          value={metrics.newOrders}
          loading={loading}
        />
        <MetricCard
          icon={TrendingUp}
          label="На сумму"
          value={`${metrics.totalAmount.toLocaleString('ru-RU')} ₸`}
          loading={loading}
        />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по номеру заказа или имени покупателя"
          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 lg:max-w-md"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
        >
          <option value="all">Все</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <ShoppingBag className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm">Заказов не найдено</p>
          </div>
        ) : (
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">№ заказа</th>
                <th className="px-4 py-3 text-left font-medium">Покупатель</th>
                <th className="px-4 py-3 text-center font-medium">Состав</th>
                <th className="px-4 py-3 text-right font-medium">Сумма</th>
                <th className="px-4 py-3 text-left font-medium">Способ оплаты</th>
                <th className="px-4 py-3 text-left font-medium">Дата</th>
                <th className="px-4 py-3 text-left font-medium">Статус</th>
                <th className="px-4 py-3 text-center font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const customerPhone = getCustomerPhone(order)
                const whatsappPhone = formatPhoneForWhatsApp(customerPhone)
                const status = STATUS_MAP[order.status]

                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {String(order.id).slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{customerPhone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {(order.order_items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {Number(order.total_amount || 0).toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(event) => handleStatusChange(order.id, event.target.value)}
                        className={`rounded-lg border-0 px-3 py-2 text-sm font-medium outline-none ${status?.color || 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
                        >
                          Детали
                        </Link>

                        {whatsappPhone ? (
                          <a
                            href={`https://wa.me/${whatsappPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-green-600 transition-colors hover:border-green-500 hover:text-green-700"
                            aria-label="Связаться в WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-300">
                            <MessageCircle className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
