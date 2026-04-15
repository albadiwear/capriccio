import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const user = useAuthStore((state) => state.user)
  const [order, setOrder] = useState(null)
  const [orderLoading, setOrderLoading] = useState(false)

  const shortId = id ? String(id).slice(0, 8) : ''

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setOrderLoading(true)
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, total_amount, total, delivery_method, delivery_address, order_items(quantity, size, color, products(name))')
          .eq('id', id)
          .single()
        if (!cancelled) setOrder(data || null)
      } finally {
        if (!cancelled) setOrderLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const deliveryMethodLabel = useMemo(() => {
    const method = order?.delivery_method
    if (!method) return '—'
    const map = {
      courier: 'Курьер',
      pickup: 'Самовывоз / ПВЗ',
      kazpost: 'Казпочта',
      cdek: 'СДЭК',
      yandex: 'Яндекс Доставка',
      indriver: 'InDriver',
    }
    return map[method] || method
  }, [order?.delivery_method])

  const deliveryAddressText = useMemo(() => {
    const a = order?.delivery_address
    if (!a) return '—'
    if (typeof a === 'string') return a

    const parts = [
      a.city,
      a.street,
      a.house ? `д. ${a.house}` : null,
      a.apartment ? `кв. ${a.apartment}` : null,
      a.postal_code ? `индекс ${a.postal_code}` : null,
    ]
      .filter(Boolean)
      .join(', ')

    return parts || '—'
  }, [order?.delivery_address])

  const itemsText = useMemo(() => {
    const items = order?.order_items || []
    if (!Array.isArray(items) || items.length === 0) return '—'

    return items
      .map((i) => {
        const name = i.products?.name || i.name || 'Товар'
        const size = i.size || ''
        const color = i.color || ''
        const meta = [size, color].filter(Boolean).join(' ')
        return `${name} (${meta} x${i.quantity})`.replace('(  ', '(').replace('( x', '(x')
      })
      .join(', ')
  }, [order?.order_items])

  const totalText = useMemo(() => {
    const total = order?.total_amount ?? order?.total
    if (total === null || total === undefined) return '—'
    return Number(total || 0).toLocaleString('ru-RU')
  }, [order?.total_amount, order?.total])

  const waHref = useMemo(() => {
    const phone = '77754083740'
    if (!id) return `https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Жду подтверждения заказа 🙏')}`

    const text = order
      ? `Здравствуйте! Я оформила заказ #${shortId}

📦 Товары: ${itemsText}
💰 Сумма: ${totalText} ₸
🚚 Доставка: ${deliveryMethodLabel}
📍 Адрес: ${deliveryAddressText}

Жду подтверждения 🙏`
      : `Здравствуйте! Я оформила заказ #${shortId}. Жду подтверждения 🙏`

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }, [id, shortId, order, itemsText, totalText, deliveryMethodLabel, deliveryAddressText])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Заказ оформлен!</h1>
        {id && (
          <p className="text-sm text-gray-500 mb-3">
            Номер заказа: <span className="font-medium text-gray-900">#{shortId}</span>
          </p>
        )}
        {!user && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-900 mb-1">Сохраните ваш заказ</p>
            <p className="text-xs text-gray-500 mb-4">
              Создайте аккаунт чтобы отслеживать заказы и получать персональные предложения
            </p>
            <a
              href="/register"
              className="inline-flex h-10 items-center rounded bg-gray-900 px-6 text-xs text-white hover:bg-gray-700 transition-colors"
            >
              Создать аккаунт
            </a>
          </div>
        )}
        <p className="text-gray-500 text-sm mb-8">
          Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа.
        </p>
        <div className="flex flex-col gap-3 justify-center">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-6 py-3 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
          >
            💬 Написать в WhatsApp
          </a>
          <Link
            to="/catalog"
            className="w-full px-6 py-3 border border-gray-200 rounded text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            Вернуться в каталог
          </Link>
          <Link
            to="/account/orders"
            className="w-full px-6 py-3 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Мои заказы
          </Link>
        </div>
      </div>
    </div>
  )
}
