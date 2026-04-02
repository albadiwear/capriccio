import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
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
    </div>
  )
}
