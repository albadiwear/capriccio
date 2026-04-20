import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

const emptyAddressForm = {
  recipient_name: '', phone: '', city: '', street: '',
  house: '', apartment: '', postal_code: '', is_default: false,
}

const PLACEHOLDERS = {
  recipient_name: 'Имя получателя',
  phone: 'Телефон',
  city: 'Город',
  street: 'Улица',
  house: 'Дом',
  apartment: 'Квартира',
  postal_code: 'Индекс',
}

export default function AccountAddressesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingAddress, setAddingAddress] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState(emptyAddressForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    loadAddresses()
  }, [user])

  async function loadAddresses() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (e) {
      console.error('AccountAddressesPage.loadAddresses error:', e)
      setAddresses([])
      setError('Не удалось загрузить адреса. Попробуйте обновить страницу.')
    } finally {
      setLoading(false)
    }
  }

  function handleAddressChange(e) {
    const { name, value, type, checked } = e.target
    setAddressForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleAddAddress(e) {
    e.preventDefault()
    if (!user) return
    setSavingAddress(true)
    setError('')
    setSuccess('')
    const { data, error: insertError } = await supabase
      .from('addresses')
      .insert({ user_id: user.id, ...addressForm })
      .select()
    if (insertError) { setError(insertError.message); setSavingAddress(false); return }
    setAddresses((prev) => [...(data || []), ...prev])
    setAddressForm(emptyAddressForm)
    setAddingAddress(false)
    setSavingAddress(false)
    setSuccess('Адрес добавлен')
  }

  async function handleDeleteAddress(id) {
    const { error: deleteError } = await supabase
      .from('addresses').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) { setError(deleteError.message); return }
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <AccountSidebarMobile />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <AccountSidebarDesktop />
          <div className="space-y-4">
            {(error || success) && (
              <div className="space-y-2">
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

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Мои адреса</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Сохраняйте адреса для быстрого оформления заказов
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingAddress((prev) => !prev)}
                  className="h-12 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  {addingAddress ? 'Закрыть' : 'Добавить адрес'}
                </button>
              </div>
            </div>

            {addingAddress && (
              <form onSubmit={handleAddAddress} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {['recipient_name', 'phone', 'city', 'street', 'house', 'apartment', 'postal_code'].map((field) => (
                    <input
                      key={field}
                      name={field}
                      value={addressForm[field]}
                      onChange={handleAddressChange}
                      placeholder={PLACEHOLDERS[field]}
                      className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  ))}
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

            {loading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
                Загрузка...
              </div>
            ) : addresses.length === 0 ? (
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
                          <h3 className="text-base font-semibold text-gray-900">
                            {address.recipient_name}
                          </h3>
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
        </div>
      </div>
    </div>
  )
}
