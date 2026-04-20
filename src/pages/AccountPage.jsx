import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ShoppingBag, Heart, MapPin, Users, LogOut, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

const sections = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'orders', label: 'Мои заказы', icon: ShoppingBag },
  { id: 'addresses', label: 'Мои адреса', icon: MapPin },
  { id: 'wishlist', label: 'Избранное', icon: Heart },
]

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

const emptyAddressForm = {
  recipient_name: '',
  phone: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  postal_code: '',
  is_default: false,
}

export default function AccountPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [activeSection, setActiveSection] = useState('profile')
  const [pageLoading, setPageLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [addingAddress, setAddingAddress] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    avatar_url: '',
    referral_code: '',
  })

  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [addresses, setAddresses] = useState([])
  const [referral, setReferral] = useState(null)
  const [transactions, setTransactions] = useState([])

  const [addressForm, setAddressForm] = useState(emptyAddressForm)
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    kaspi_phone: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    loadAccountData()
  }, [user, navigate])

  const loadAccountData = async () => {
    if (!user) return

    setPageLoading(true)
    setError('')

    const timeoutId = setTimeout(() => setPageLoading(false), 5000)

    try {
      const [
        profileResponse,
        ordersResponse,
        wishlistResponse,
        addressesResponse,
        referralResponse,
        transactionsResponse,
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('wishlist').select('*, products(*)').eq('user_id', user.id),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('referrals').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('referral_transactions')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const profileData = profileResponse.data
      setProfile({
        full_name: profileData?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: profileData?.phone || user.user_metadata?.phone || '',
        city: profileData?.city || '',
        avatar_url: profileData?.avatar_url || '',
        referral_code:
          profileData?.referral_code ||
          user.user_metadata?.referral_code ||
          user.id.slice(0, 8).toUpperCase(),
      })

      setOrders(ordersResponse.data || [])
      setWishlist(wishlistResponse.data || [])
      setAddresses(addressesResponse.data || [])
      setReferral(referralResponse.data || null)
      setTransactions(transactionsResponse.data || [])

      if (
        ordersResponse.error ||
        wishlistResponse.error ||
        addressesResponse.error ||
        transactionsResponse.error
      ) {
        setError('Не удалось загрузить часть данных. Попробуйте обновить страницу.')
      }
    } catch (e) {
      console.error('AccountPage.loadAccountData error:', e)
      setError('Не удалось загрузить данные. Попробуйте обновить страницу.')
    } finally {
      clearTimeout(timeoutId)
      setPageLoading(false)
    }
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    if (!user) return

    setSavingProfile(true)
    setSuccess('')
    setError('')

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        city: profile.city,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSavingProfile(false)
      return
    }

    setSuccess('Профиль успешно сохранён')
    setSavingProfile(false)
  }

  const handleAddressChange = (event) => {
    const { name, value, type, checked } = event.target
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAddAddress = async (event) => {
    event.preventDefault()
    if (!user) return

    setSavingAddress(true)
    setError('')
    setSuccess('')

    const { error: insertError, data } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        recipient_name: addressForm.recipient_name,
        phone: addressForm.phone,
        city: addressForm.city,
        street: addressForm.street,
        house: addressForm.house,
        apartment: addressForm.apartment,
        postal_code: addressForm.postal_code,
        is_default: addressForm.is_default,
      })
      .select()

    if (insertError) {
      setError(insertError.message)
      setSavingAddress(false)
      return
    }

    if (addressForm.is_default) {
      setAddresses((data || []).concat(addresses).map((item, index) => ({
        ...item,
        is_default: index === 0,
      })))
    } else {
      setAddresses([...(data || []), ...addresses])
    }

    setAddressForm(emptyAddressForm)
    setAddingAddress(false)
    setSavingAddress(false)
    setSuccess('Адрес добавлен')
    await loadAccountData()
  }

  const handleDeleteAddress = async (id) => {
    const { error: deleteError } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setAddresses((prev) => prev.filter((item) => item.id !== id))
  }

  const handleRemoveWishlist = async (id) => {
    const { error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setWishlist((prev) => prev.filter((item) => item.id !== id))
  }

  const handlePayoutChange = (event) => {
    const { name, value } = event.target
    setPayoutForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRequestPayout = async (event) => {
    event.preventDefault()

    if (!payoutForm.amount || !payoutForm.kaspi_phone) {
      setError('Укажите сумму и номер Kaspi')
      return
    }

    setRequestingPayout(true)
    setError('')
    setSuccess('')

    const { error: payoutError } = await supabase.from('withdrawal_requests').insert({
      user_id: user.id,
      amount: Number(payoutForm.amount),
      kaspi_phone: payoutForm.kaspi_phone,
      status: 'pending',
    })

    if (payoutError) {
      setError(payoutError.message)
      setRequestingPayout(false)
      return
    }

    setSuccess('Запрос на вывод отправлен')
    setPayoutForm({ amount: '', kaspi_phone: '' })
    setRequestingPayout(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Не удалось загрузить фото')
      setUploadingAvatar(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      setError('Не удалось сохранить фото')
      setUploadingAvatar(false)
      return
    }

    setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    setSuccess('Фото профиля обновлено')
    setUploadingAvatar(false)
  }

  const referralLink = `${window.location.origin}/?ref=${
    referral?.referral_code || profile.referral_code
  }`

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setSuccess('Ссылка скопирована')
    } catch {
      setError('Не удалось скопировать ссылку')
    }
  }

  const renderProfileSection = () => {
    const initials = (profile.full_name || user?.email || 'C')
      .split(' ')
      .map((item) => item[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <label className="relative cursor-pointer group">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-xl font-semibold text-white overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <span className="text-white text-xs">...</span>
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploadingAvatar}
            />
          </label>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Профиль</h2>
            <p className="mt-1 text-sm text-gray-500">Управляйте личными данными аккаунта</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Имя</label>
            <input
              name="full_name"
              value={profile.full_name}
              onChange={handleProfileChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              value={profile.email}
              readOnly
              className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Телефон</label>
            <input
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+7 777 123 45 67"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Город</label>
            <input
              name="city"
              value={profile.city}
              onChange={handleProfileChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Алматы"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="h-12 rounded-lg bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-70"
            >
              {savingProfile ? 'Сохраняем...' : 'Сохранить'}
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="w-full mt-3 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:bg-gray-100"
            >
              Выйти из аккаунта
            </button>
          </div>
        </form>
      </div>
    )
  }

  const renderOrdersSection = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Мои заказы</h2>
          <p className="mt-1 text-sm text-gray-500">История ваших покупок и статусы доставки</p>
        </div>

        {orders.length === 0 ? (
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusMap[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
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
                      src={item.products?.images?.[0] || 'https://picsum.photos/seed/order-product/120/120'}
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
    )
  }

  const renderWishlistSection = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Избранное</h2>
          <p className="mt-1 text-sm text-gray-500">Ваши сохранённые товары</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            Список избранного пуст
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {wishlist.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <img
                  src={item.products?.images?.[0] || 'https://picsum.photos/seed/wishlist-product/400/500'}
                  alt={item.products?.name || 'Товар'}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
                <h3 className="mt-4 text-sm font-medium text-gray-900">{item.products?.name}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {Number(item.products?.sale_price || item.products?.price || 0).toLocaleString('ru-RU')} ₸
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveWishlist(item.id)}
                  className="mt-4 h-12 w-full rounded-lg border border-red-200 px-4 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Удалить из избранного
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAddressesSection = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Мои адреса</h2>
              <p className="mt-1 text-sm text-gray-500">Сохраняйте адреса для быстрого оформления заказов</p>
            </div>
            <button
              type="button"
              onClick={() => setAddingAddress((prev) => !prev)}
              className="h-12 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              {addingAddress ? 'Закрыть форму' : 'Добавить адрес'}
            </button>
          </div>
        </div>

        {addingAddress && (
          <form onSubmit={handleAddAddress} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                name="recipient_name"
                value={addressForm.recipient_name}
                onChange={handleAddressChange}
                placeholder="Имя получателя"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressChange}
                placeholder="Телефон"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                placeholder="Город"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="street"
                value={addressForm.street}
                onChange={handleAddressChange}
                placeholder="Улица"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="house"
                value={addressForm.house}
                onChange={handleAddressChange}
                placeholder="Дом"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="apartment"
                value={addressForm.apartment}
                onChange={handleAddressChange}
                placeholder="Квартира"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                name="postal_code"
                value={addressForm.postal_code}
                onChange={handleAddressChange}
                placeholder="Индекс"
                className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 px-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={addressForm.is_default}
                  onChange={handleAddressChange}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                Сделать основным
              </label>
            </div>

            <button
              type="submit"
              disabled={savingAddress}
              className="mt-5 h-12 rounded-lg bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-70"
            >
              {savingAddress ? 'Сохраняем...' : 'Сохранить адрес'}
            </button>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            У вас пока нет сохранённых адресов
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{address.recipient_name}</h3>
                      {address.is_default && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          Основной
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{address.phone}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {address.city}, {address.street}, д. {address.house}
                      {address.apartment ? `, кв. ${address.apartment}` : ''}
                    </p>
                    {address.postal_code && (
                      <p className="mt-1 text-sm text-gray-600">Индекс: {address.postal_code}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-sm text-red-600 transition-colors hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderPartnerSection = () => {
    const balance = Number(referral?.balance || 0)
    const earned = Number(referral?.total_earned || 0)
    const withdrawn = Number(referral?.total_withdrawn || 0)

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Партнёрская программа</h2>
          <p className="mt-1 text-sm text-gray-500">Делитесь ссылкой и отслеживайте вознаграждения</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Баланс</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {balance.toLocaleString('ru-RU')} ₸
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Всего заработано</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {earned.toLocaleString('ru-RU')} ₸
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Выведено</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {withdrawn.toLocaleString('ru-RU')} ₸
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_280px]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Реферальная ссылка</h3>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={referralLink}
                readOnly
                className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={copyReferralLink}
                className="h-12 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                Скопировать ссылку
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">QR код</h3>
            <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              QR код
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">История транзакций</h3>
          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Транзакций пока нет</p>
          ) : (
            <div className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description || 'Партнёрское начисление'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {Number(transaction.commission || 0).toLocaleString('ru-RU')} ₸
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleRequestPayout} className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Запросить вывод</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              name="amount"
              type="number"
              value={payoutForm.amount}
              onChange={handlePayoutChange}
              placeholder="Сумма"
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              name="kaspi_phone"
              value={payoutForm.kaspi_phone}
              onChange={handlePayoutChange}
              placeholder="Номер Kaspi"
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={requestingPayout}
            className="mt-5 h-12 rounded-lg bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-70"
          >
            {requestingPayout ? 'Отправляем...' : 'Запросить вывод'}
          </button>
        </form>
      </div>
    )
  }

  const renderContent = () => {
    if (pageLoading) {
      return (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          Загрузка данных...
        </div>
      )
    }

    if (activeSection === 'profile') return renderProfileSection()
    if (activeSection === 'orders') return renderOrdersSection()
    if (activeSection === 'wishlist') return renderWishlistSection()
    if (activeSection === 'addresses') return renderAddressesSection()
    if (activeSection === 'partner') {
      return (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-700 shadow-sm">
          <p className="text-sm text-gray-500">Партнёрская программа открывается отдельной страницей.</p>
          <Link
            to="/account/partner"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Перейти в партнёрский кабинет
          </Link>
        </div>
      )
    }

    return renderPartnerSection()
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        {(error || success) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}
          </div>
        )}

        <AccountSidebarMobile />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <AccountSidebarDesktop />
          <div>{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}
