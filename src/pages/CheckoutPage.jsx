import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const DELIVERY_OPTIONS = [
  { value: 'courier', label: 'Курьер по Алматы', cost: 1500 },
  { value: 'kazpost', label: 'Казпочта', cost: 2000 },
  { value: 'cdek', label: 'СДЭК', cost: 2500 },
  { value: 'yandex', label: 'Яндекс Доставка', cost: 1800 },
  { value: 'indriver', label: 'InDriver', cost: 1200 },
]

const PAYMENT_OPTIONS = [
  { value: 'card', label: 'Карта Visa / Mastercard' },
  { value: 'cod', label: 'Наложенный платёж' },
  { value: 'crypto', label: 'Криптовалюта (USDT)' },
]

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
      {children}
    </h2>
  )
}

function InputField({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <input
        {...props}
        className="h-12 rounded border border-gray-200 px-3 text-sm text-gray-900 transition-colors focus:border-gray-900 focus:outline-none"
      />
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const subtotal = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '')
  const [email, setEmail] = useState(user?.email || '')

  const [selectedDelivery, setSelectedDelivery] = useState('courier')
  const [city, setCity] = useState('Алматы')
  const [street, setStreet] = useState('')
  const [house, setHouse] = useState('')
  const [apartment, setApartment] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [selectedPayment, setSelectedPayment] = useState('card')

  const [promoCode, setPromoCode] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoValid, setPromoValid] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const deliveryCost = DELIVERY_OPTIONS.find((o) => o.value === selectedDelivery)?.cost || 0
  const total = subtotal + deliveryCost - discount

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoValid(false)
    setDiscount(0)

    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoInput.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (!data) {
      setPromoError('Промокод недействителен или истёк')
    } else {
      setPromoCode(promoInput.trim().toUpperCase())
      setPromoValid(true)
      const disc = data.discount_type === 'percent'
        ? Math.round(subtotal * data.discount_value / 100)
        : data.discount_value
      setDiscount(disc)
    }
    setPromoLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    const refExpires = localStorage.getItem('ref_expires')
    const refCode =
      refExpires && Date.now() < Number(refExpires)
        ? localStorage.getItem('ref_code')
        : null

    try {
      const orderPayload = {
        user_id: user?.id || null,
        order_number: `CAP-${Date.now()}`,
        status: 'pending',
        total_amount: total,
        delivery_cost: deliveryCost,
        promo_code: promoCode || null,
        discount_amount: discount,
        delivery_method: selectedDelivery,
        delivery_address: {
          full_name: name,
          phone,
          city,
          street,
          house,
          apartment,
          postal_code: postalCode,
        },
        payment_method: selectedPayment,
        referral_code: refCode || null,
      }

      let { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single()

      if (orderError && orderError.message?.toLowerCase().includes('referral_code')) {
        console.log('ref_code for order:', refCode)

        const fallbackOrderResponse = await supabase
          .from('orders')
          .insert({
            user_id: user?.id || null,
            order_number: `CAP-${Date.now()}`,
            status: 'pending',
            total_amount: total,
            delivery_cost: deliveryCost,
            promo_code: promoCode || null,
            discount_amount: discount,
            delivery_method: selectedDelivery,
            delivery_address: {
              full_name: name,
              phone,
              city,
              street,
              house,
              apartment,
              postal_code: postalCode,
            },
            payment_method: selectedPayment,
          })
          .select()
          .single()

        order = fallbackOrderResponse.data
        orderError = fallbackOrderResponse.error
      }

      if (orderError) throw orderError

      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id || item.id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price: item.price,
        }))
      )

      if (itemsError) console.error('order_items error:', itemsError)

      if (!user && email) {
        const tempPassword = Math.random().toString(36).slice(-10)
        const { data: newUser } = await supabase.auth.signUp({
          email,
          password: tempPassword,
          options: {
            data: { full_name: name, phone },
          },
        })

        if (newUser?.user) {
          await supabase.from('users').upsert({
            id: newUser.user.id,
            email,
            full_name: name,
            phone,
          })
        }
      }

      clearCart()
      navigate(`/order-success/${order.id}`)
    } catch (err) {
      setSubmitError('Не удалось оформить заказ. Попробуйте ещё раз.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Корзина пуста</p>
          <a href="/catalog" className="text-sm underline text-gray-700 hover:text-gray-900">
            Перейти в каталог
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 md:py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 tracking-wide">Оформление заказа</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">

            <div className="space-y-6">

              <div className="bg-white rounded-xl p-6">
                <SectionTitle>Данные получателя</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Имя и фамилия"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Айгерим Ахметова"
                      required
                    />
                  </div>
                  <InputField
                    label="Телефон"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (700) 000-00-00"
                    required
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    required
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <SectionTitle>Способ доставки</SectionTitle>
                <div className="space-y-2 mb-5">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDelivery === opt.value
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          value={opt.value}
                          checked={selectedDelivery === opt.value}
                          onChange={() => setSelectedDelivery(opt.value)}
                          className="accent-gray-900"
                        />
                        <span className="text-sm text-gray-800">{opt.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">от {opt.cost.toLocaleString('ru-RU')} ₸</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Город"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Алматы"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InputField
                      label="Улица"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="ул. Абая"
                      required
                    />
                  </div>
                  <InputField
                    label="Дом"
                    type="text"
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder="12"
                    required
                  />
                  <InputField
                    label="Квартира"
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="34"
                  />
                  <InputField
                    label="Индекс"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="050000"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <SectionTitle>Способ оплаты</SectionTitle>
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPayment === opt.value
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={selectedPayment === opt.value}
                        onChange={() => setSelectedPayment(opt.value)}
                        className="accent-gray-900"
                      />
                      <span className="text-sm text-gray-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <SectionTitle>Промокод</SectionTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); setPromoValid(false) }}
                      placeholder="Введите промокод"
                      className="h-12 w-full rounded border border-gray-200 py-2.5 pl-9 pr-3 text-sm uppercase transition-colors focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="h-12 rounded bg-gray-900 px-4 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                  >
                    {promoLoading ? '...' : 'Применить'}
                  </button>
                </div>
                {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
                {promoValid && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Промокод применён — скидка {discount.toLocaleString('ru-RU')} ₸
                  </div>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-20">
              <div className="bg-white rounded-xl p-6">
                <SectionTitle>Ваш заказ</SectionTitle>

                <div className="space-y-4 mb-5">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${item.color}-${item.size}-${idx}`} className="flex gap-3">
                      <div className="w-14 flex-shrink-0 rounded overflow-hidden bg-gray-50">
                        <img
                          src={item.image || `https://picsum.photos/seed/${item.id}/120/160`}
                          alt={item.name}
                          className="w-full aspect-[3/4] object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">
                          {item.name}
                        </p>
                        {(item.color || item.size) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[item.color, item.size].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {item.price.toLocaleString('ru-RU')} ₸ × {item.quantity}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Подытог</span>
                    <span>{subtotal.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Доставка</span>
                    <span>{deliveryCost.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Скидка по промокоду</span>
                      <span>−{discount.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Итого</span>
                    <span>{total.toLocaleString('ru-RU')} ₸</span>
                  </div>
                </div>

                {submitError && (
                  <p className="mt-3 text-xs text-red-500 text-center">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 h-12 w-full rounded bg-gray-900 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
                >
                  {submitting ? 'Оформляем...' : 'Подтвердить заказ'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
