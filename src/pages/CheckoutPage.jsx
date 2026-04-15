import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, CheckCircle, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const DELIVERY_OPTIONS = [
  { value: 'courier', label: 'Курьер', cost: 1500 },
  { value: 'pickup', label: 'Самовывоз / ПВЗ', cost: 0 },
  { value: 'kazpost', label: 'Казпочта', cost: 2000 },
  { value: 'cdek', label: 'СДЭК', cost: 2500 },
  { value: 'yandex', label: 'Яндекс Доставка', cost: 1800 },
  { value: 'indriver', label: 'InDriver', cost: 1200 },
]

const PICKUP_CITIES = ['Алматы', 'Астана', 'Караганда', 'Шымкент']

const PICKUP_POINTS_BY_CITY = {
  Алматы: ['ул. Абая 10, ТЦ Мега', 'пр. Аль-Фараби 77'],
  Астана: ['пр. Республики 15', 'ул. Сейфуллина 8'],
  Караганда: ['бул. Мира 32', 'ул. Ерубаева 5'],
  Шымкент: ['пр. Тауке хана 22'],
}

const PAYMENT_OPTIONS = [
  { value: 'card', label: 'Карта Visa / Mastercard' },
  { value: 'cod', label: 'Наложенный платёж' },
  { value: 'crypto', label: 'Криптовалюта (USDT)' },
]

function InputField({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#888780] font-medium">{label}</label>
      <input
        {...props}
        className="h-12 rounded-xl border border-[#e0ddd8] px-4 text-sm text-[#1a1a18] transition-colors focus:border-[#1a1a18] focus:outline-none placeholder:text-[#aaa] bg-white"
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
  const [comment, setComment] = useState('')
  const [pickupCity, setPickupCity] = useState('Алматы')
  const [pickupPoint, setPickupPoint] = useState(PICKUP_POINTS_BY_CITY['Алматы'][0])

  const [selectedPayment, setSelectedPayment] = useState('card')

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward')
  const [stepError, setStepError] = useState('')

  const [promoCode, setPromoCode] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoValid, setPromoValid] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!user) return

    async function loadDefaultAddress() {
      // Загружаем профиль пользователя
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) setName(profile.full_name)
      if (profile?.phone) setPhone(profile.phone)

      // Загружаем основной адрес
      const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      // Если основного нет — берём первый
      if (!address) {
        const { data: firstAddress } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (firstAddress) {
          if (firstAddress.city) setCity(firstAddress.city)
          if (firstAddress.street) setStreet(firstAddress.street)
          if (firstAddress.house) setHouse(firstAddress.house)
          if (firstAddress.apartment) setApartment(firstAddress.apartment)
          if (firstAddress.postal_code) setPostalCode(firstAddress.postal_code)
          if (firstAddress.phone) setPhone(firstAddress.phone)
          if (firstAddress.recipient_name) setName(firstAddress.recipient_name)
        }
        return
      }

      if (address.city) setCity(address.city)
      if (address.street) setStreet(address.street)
      if (address.house) setHouse(address.house)
      if (address.apartment) setApartment(address.apartment)
      if (address.postal_code) setPostalCode(address.postal_code)
      if (address.phone) setPhone(address.phone)
      if (address.recipient_name) setName(address.recipient_name)
    }

    loadDefaultAddress()
  }, [user])

  useEffect(() => {
    const points = PICKUP_POINTS_BY_CITY[pickupCity] || []
    setPickupPoint(points[0] || '')
  }, [pickupCity])

  const deliveryCost = DELIVERY_OPTIONS.find((o) => o.value === selectedDelivery)?.cost || 0
  const total = subtotal + deliveryCost - discount

  function goNext() {
    setStepError('')

    if (step === 1) {
      if (!name.trim() || !phone.trim() || !email.trim()) {
        setStepError('Заполните имя, телефон и email')
        return
      }
    }

    if (step === 2) {
      if (!selectedDelivery) {
        setStepError('Выберите способ доставки')
        return
      }
    }

    if (step === 3) {
      if (selectedDelivery === 'pickup') {
        if (!pickupCity.trim() || !pickupPoint.trim()) {
          setStepError('Выберите город и пункт выдачи')
          return
        }
      } else {
        if (!city.trim() || !street.trim() || !house.trim()) {
          setStepError('Заполните город, улицу и дом')
          return
        }
      }
    }

    setDirection('forward')
    setStep((s) => Math.min(4, s + 1))
  }

  function goBack() {
    setStepError('')
    setDirection('back')
    setStep((s) => Math.max(1, s - 1))
  }

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

  async function submitOrder() {
    if (items.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    const refExpires = localStorage.getItem('ref_expires')
    const refCode =
      refExpires && Date.now() < Number(refExpires)
        ? localStorage.getItem('ref_code')
        : null

    try {
      const isPickup = selectedDelivery === 'pickup'
      const deliveryAddress = isPickup
        ? {
            full_name: name,
            phone,
            city: pickupCity,
            street: `ПВЗ: ${pickupPoint}`,
            house: '',
            apartment: '',
            postal_code: '',
          }
        : {
            full_name: name,
            phone,
            city,
            street,
            house,
            apartment,
            postal_code: postalCode,
          }

      const orderPayload = {
        user_id: user?.id || null,
        order_number: `CAP-${Date.now()}`,
        status: 'pending',
        total_amount: total,
        delivery_cost: deliveryCost,
        promo_code: promoCode || null,
        discount_amount: discount,
        delivery_method: selectedDelivery,
        delivery_address: deliveryAddress,
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
            delivery_address: deliveryAddress,
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

  function handleSubmit(e) {
    e.preventDefault()
    if (step < 4) {
      goNext()
      return
    }
    submitOrder()
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
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 md:py-10">
        <h1 className="text-2xl font-semibold text-[#1a1a18] mb-6">Оформление заказа</h1>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= i ? 'bg-[#1a1a18] text-white' : 'bg-[#f0ede8] text-[#888780]'
                  }`}
                >
                  {step > i ? <Check size={14} /> : i}
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-0.5 transition-colors ${
                      step > i ? 'bg-[#1a1a18]' : 'bg-[#f0ede8]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 text-[11px] text-[#888780]">
            <div className={step === 1 ? 'text-[#1a1a18] font-medium' : ''}>Контакты</div>
            <div className={step === 2 ? 'text-[#1a1a18] font-medium text-center' : 'text-center'}>Доставка</div>
            <div className={step === 3 ? 'text-[#1a1a18] font-medium text-center' : 'text-center'}>Адрес</div>
            <div className={step === 4 ? 'text-[#1a1a18] font-medium text-right' : 'text-right'}>Оплата</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#f0ede8] rounded-2xl p-5 sm:p-6">
          <div className={`transition-all duration-300 ${direction === 'forward' ? 'animate-slide-left' : 'animate-slide-right'}`}>
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-[#1a1a18]">Как вас зовут?</h2>
                <p className="text-sm text-[#888780] mt-1 mb-6">Заполните данные для оформления</p>

                <div className="grid grid-cols-1 gap-4">
                  <InputField
                    label="Имя и фамилия"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Айгерим Ахметова"
                    required
                  />
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

                {stepError && <p className="mt-4 text-sm text-red-600">{stepError}</p>}

                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-[#1a1a18] text-white text-sm font-medium"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-[#1a1a18]">Как доставить?</h2>
                <p className="text-sm text-[#888780] mt-1 mb-6">Выберите удобный способ доставки</p>

                <div className="space-y-3">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDelivery(opt.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedDelivery(opt.value)
                      }}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        selectedDelivery === opt.value ? 'border-[#1a1a18] bg-[#f5f2ed]' : 'border-[#e0ddd8] hover:border-[#888780]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedDelivery === opt.value ? 'border-[#1a1a18]' : 'border-[#e0ddd8]'
                            }`}
                          >
                            {selectedDelivery === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a18]" />}
                          </div>
                          <span className="text-sm font-medium text-[#1a1a18]">{opt.label}</span>
                        </div>
                        <span className="text-sm text-[#888780]">
                          {opt.cost === 0 ? '0 ₸' : `от ${opt.cost.toLocaleString('ru-RU')} ₸`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {stepError && <p className="mt-4 text-sm text-red-600">{stepError}</p>}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="h-12 px-5 rounded-xl border border-[#e0ddd8] text-sm text-[#1a1a18]"
                  >
                    ← Назад
                  </button>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-[#1a1a18] text-white text-sm font-medium"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-[#1a1a18]">
                  {selectedDelivery === 'pickup' ? 'Где забрать?' : 'Куда доставить?'}
                </h2>
                <p className="text-sm text-[#888780] mt-1 mb-6">
                  {selectedDelivery === 'pickup' ? 'Выберите город и пункт выдачи' : 'Укажите адрес доставки'}
                </p>

                {selectedDelivery === 'pickup' ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888780] font-medium">Город</label>
                      <select
                        value={pickupCity}
                        onChange={(e) => setPickupCity(e.target.value)}
                        className="h-12 rounded-xl border border-[#e0ddd8] px-4 text-sm text-[#1a1a18] transition-colors focus:border-[#1a1a18] focus:outline-none bg-white"
                      >
                        {PICKUP_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888780] font-medium">Пункт выдачи</label>
                      <select
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        className="h-12 rounded-xl border border-[#e0ddd8] px-4 text-sm text-[#1a1a18] transition-colors focus:border-[#1a1a18] focus:outline-none bg-white"
                      >
                        {(PICKUP_POINTS_BY_CITY[pickupCity] || []).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <InputField
                      label="Город"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Алматы"
                      required
                    />
                    <InputField
                      label="Улица"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="ул. Абая"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <InputField
                      label="Индекс"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="050000"
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888780] font-medium">Комментарий для курьера</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Подъезд, этаж, домофон..."
                        rows={3}
                        className="rounded-xl border border-[#e0ddd8] px-4 py-3 text-sm text-[#1a1a18] transition-colors focus:border-[#1a1a18] focus:outline-none placeholder:text-[#aaa] bg-white resize-none"
                      />
                    </div>
                  </div>
                )}

                {stepError && <p className="mt-4 text-sm text-red-600">{stepError}</p>}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="h-12 px-5 rounded-xl border border-[#e0ddd8] text-sm text-[#1a1a18]"
                  >
                    ← Назад
                  </button>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-[#1a1a18] text-white text-sm font-medium"
                  >
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-[#1a1a18]">Как оплатить?</h2>
                <p className="text-sm text-[#888780] mt-1 mb-6">Выберите способ оплаты и подтвердите заказ</p>

                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPayment(opt.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedPayment(opt.value)
                      }}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        selectedPayment === opt.value ? 'border-[#1a1a18] bg-[#f5f2ed]' : 'border-[#e0ddd8] hover:border-[#888780]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPayment === opt.value ? 'border-[#1a1a18]' : 'border-[#e0ddd8]'
                            }`}
                          >
                            {selectedPayment === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a18]" />}
                          </div>
                          <span className="text-sm font-medium text-[#1a1a18]">{opt.label}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                    <input
                      placeholder="Введите промокод"
                      className="w-full border border-[#e0ddd8] rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#1a1a18] uppercase"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value)
                        setPromoError('')
                        setPromoValid(false)
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="bg-[#1a1a18] text-white px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    {promoLoading ? '...' : 'Применить'}
                  </button>
                </div>
                {promoError && <p className="mt-2 text-sm text-red-600">{promoError}</p>}
                {promoValid && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    Скидка {discount.toLocaleString('ru-RU')} ₸ применена
                  </div>
                )}

                <div className="border border-[#f0ede8] rounded-xl p-4 mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#888780]">Товары</span>
                    <span className="text-[#1a1a18]">{subtotal.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#888780]">Доставка</span>
                    <span className="text-[#1a1a18]">{deliveryCost.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm mb-2 text-green-700">
                      <span>Скидка по промокоду</span>
                      <span>-{discount.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-base pt-2 border-t border-[#f0ede8]">
                    <span>Итого</span>
                    <span>{total.toLocaleString('ru-RU')} ₸</span>
                  </div>
                </div>

                {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="h-12 px-5 rounded-xl border border-[#e0ddd8] text-sm text-[#1a1a18]"
                  >
                    ← Назад
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-12 px-6 rounded-xl bg-[#1a1a18] text-white text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? 'Оформляем...' : 'Подтвердить заказ ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
