import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUSES = [
  { value: 'pending', label: 'Новый', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Подтверждён', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipping', label: 'В доставке', color: 'bg-orange-100 text-orange-700' },
  { value: 'delivered', label: 'Доставлен', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-red-100 text-red-700' },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]))

const PAYMENT_LABELS = {
  card: 'Карта Visa / Mastercard',
  cod: 'Наложенный платёж',
  crypto: 'Криптовалюта (USDT)',
}

const DELIVERY_LABELS = {
  courier: 'Курьер',
  pickup: 'Самовывоз',
  post: 'Почта',
  cdek: 'СДЭК',
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
  const a = order.delivery_address || {}
  return [
    a.city,
    a.street,
    a.house ? `д. ${a.house}` : null,
    a.apartment ? `кв. ${a.apartment}` : null,
    a.postal_code ? `индекс ${a.postal_code}` : null,
  ]
    .filter(Boolean)
    .join(', ')
}

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users(full_name, phone, email),
          order_items(
            id,
            quantity,
            price,
            products(name),
            product_variants(size, color)
          )
        `)
        .eq('id', id)
        .maybeSingle()
      console.log('order data:', data, 'error:', error)
      setOrder(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatusChange(newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    setOrder((prev) => ({ ...prev, status: newStatus }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-sm">Заказ не найден</p>
      </div>
    )
  }

  const customerPhone = getCustomerPhone(order)
  const whatsappPhone = String(customerPhone || '').replace(/\D/g, '')
  const status = STATUS_MAP[order.status]
  const orderNumber = String(order.id).slice(0, 8)
  const comment = order.comment || order.notes || order.customer_comment || '—'
  const totalQty = (order.order_items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заказам
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Заказ #{orderNumber}</h1>
          {order.created_at && (
            <p className="mt-1 text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {whatsappPhone ? (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-green-600 transition-colors hover:border-green-400 hover:text-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          ) : null}

          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`h-10 rounded-lg border-0 px-3 text-sm font-medium outline-none ${status?.color || 'bg-gray-100 text-gray-700'}`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Товары · {totalQty} шт.
              </p>
            </div>
            {order.order_items?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.products?.name || '—'}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Размер: {item.product_variants?.size || '—'}
                        {item.product_variants?.color ? ` · ${item.product_variants.color}` : ''}
                        {' · '}
                        {item.quantity} шт.
                      </p>
                    </div>
                    <p className="ml-4 shrink-0 font-medium text-gray-900">
                      {Number(item.price).toLocaleString('ru-RU')} ₸
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-gray-400">Товары не найдены</p>
            )}
            <div className="flex justify-between border-t border-gray-100 px-5 py-4">
              <span className="text-sm font-medium text-gray-600">Итого</span>
              <span className="text-lg font-bold text-gray-900">
                {Number(order.total_amount || 0).toLocaleString('ru-RU')} ₸
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
              Комментарий
            </p>
            <p className="text-sm text-gray-700">{comment}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Покупатель
            </p>
            <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
            <p className="mt-1 text-sm text-gray-600">{customerPhone || '—'}</p>
            <p className="mt-0.5 text-sm text-gray-600">{getCustomerEmail(order)}</p>
          </div>

          {/* Delivery */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Доставка
            </p>
            <p className="text-sm font-medium text-gray-900">
              {DELIVERY_LABELS[order.delivery_method] || order.delivery_method || '—'}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {getDeliveryAddress(order) || '—'}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Оплата
            </p>
            <p className="text-sm font-medium text-gray-900">
              {PAYMENT_LABELS[order.payment_method] || order.payment_method || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
