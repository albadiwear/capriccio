import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone, city, created_at, referrals(balance, total_earned)')
        .order('created_at', { ascending: false })

      const userIds = (data || []).map(u => u.id)
      let ordersMap = {}
      if (userIds.length > 0) {
        const { data: counts } = await supabase
          .from('orders')
          .select('user_id')
          .in('user_id', userIds)
        ;(counts || []).forEach(o => {
          ordersMap[o.user_id] = (ordersMap[o.user_id] || 0) + 1
        })
      }

      setCustomers((data || []).map(u => ({ ...u, ordersCount: ordersMap[u.id] || 0 })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  })

  async function openCard(customer) {
    setSelectedCustomer(customer)
    setLoadingProfile(true)
    setProfile(null)
    setOrders([])

    const [{ data: profileData }, { data: ordersData }] = await Promise.all([
      supabase.from('stylist_profiles').select('*').eq('user_id', customer.id).maybeSingle(),
      supabase.from('orders').select('id, created_at, total_amount, status').eq('user_id', customer.id).order('created_at', { ascending: false }).limit(5)
    ])

    setProfile(profileData || null)
    setOrders(ordersData || [])
    setLoadingProfile(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Покупатели</h1>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-sm border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Users className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">Покупатели не найдены</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Имя</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Телефон</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Город</th>
                <th className="text-center px-4 py-3 font-medium">Заказы</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Реф. баланс</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Дата рег.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openCard(c)}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {c.ordersCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">
                    {c.referrals?.balance?.toLocaleString('ru-RU') || 0} ₸
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                    {new Date(c.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl my-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-medium text-pink-700">
                  {selectedCustomer.full_name?.charAt(0) || selectedCustomer.email?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedCustomer.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {loadingProfile ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Контакты</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Телефон</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Город</p>
                        <p className="text-sm font-medium text-gray-900">{profile?.city || selectedCustomer.city || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Дата регистрации</p>
                        <p className="text-sm font-medium text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Заказов</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.ordersCount}</p>
                      </div>
                    </div>
                  </div>

                  {profile && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Параметры</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Возраст', value: profile.age ? profile.age + ' лет' : '—' },
                            { label: 'Рост', value: profile.height ? profile.height + ' см' : '—' },
                            { label: 'Вес', value: profile.weight ? profile.weight + ' кг' : '—' },
                            { label: 'Размер', value: profile.clothing_size || '—' },
                            { label: 'Грудь', value: profile.chest ? profile.chest + ' см' : '—' },
                            { label: 'Талия', value: profile.waist ? profile.waist + ' см' : '—' },
                            { label: 'Бёдра', value: profile.hips ? profile.hips + ' см' : '—' },
                            { label: 'Обувь', value: profile.shoe_size || '—' },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400 mb-1">{label}</p>
                              <p className="text-sm font-medium text-gray-900">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Стиль</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Тип фигуры</p>
                            <p className="text-sm font-medium text-gray-900">{profile.body_type || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Цветотип</p>
                            <p className="text-sm font-medium text-gray-900">{profile.color_type || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Образ жизни</p>
                            <p className="text-sm font-medium text-gray-900">{profile.lifestyle || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Бюджет</p>
                            <p className="text-sm font-medium text-gray-900">
                              {profile.budget_min || profile.budget_max ? `${(profile.budget_min || 0).toLocaleString('ru-RU')} — ${(profile.budget_max || 0).toLocaleString('ru-RU')} ₸` : '—'}
                            </p>
                          </div>
                        </div>
                        {profile.style_preferences?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {profile.style_preferences.map(s => (
                              <span key={s} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {orders.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Последние заказы</p>
                      <div className="space-y-2">
                        {orders.map(o => (
                          <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('ru-RU')}</p>
                              <p className="text-xs text-gray-500">#{o.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{o.total_amount?.toLocaleString('ru-RU')} ₸</p>
                              <p className="text-xs text-gray-400">{o.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!profile && orders.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Анкета не заполнена, заказов нет</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
