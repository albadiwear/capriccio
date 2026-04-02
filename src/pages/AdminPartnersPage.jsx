import { useState, useEffect } from 'react'
import { Handshake, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('partners')

  async function load() {
    setLoading(true)
    const [{ data: refs }, { data: reqs }] = await Promise.all([
      supabase
        .from('referrals')
        .select('*, users(full_name, email, phone)')
        .order('total_earned', { ascending: false }),
      supabase
        .from('withdrawal_requests')
        .select('*, users(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    setPartners(refs || [])
    setWithdrawals(reqs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(req) {
    await supabase.from('withdrawal_requests').update({ status: 'paid' }).eq('id', req.id)
    await supabase.from('referrals')
      .update({ balance: Math.max(0, (req.referrals?.balance || 0) - req.amount) })
      .eq('user_id', req.user_id)
    alert('Выплата одобрена')
    load()
  }

  async function handleReject(id) {
    await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Партнёры</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {['partners', 'withdrawals'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'partners' ? 'Партнёры' : `Запросы на вывод ${withdrawals.length > 0 ? `(${withdrawals.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'partners' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Handshake className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Партнёров пока нет</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium">Имя</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-right px-4 py-3 font-medium">Баланс</th>
                  <th className="text-right px-4 py-3 font-medium">Заработано</th>
                  <th className="text-right px-4 py-3 font-medium">Выведено</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.users?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.users?.email || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{(p.balance || 0).toLocaleString('ru-RU')} ₸</td>
                    <td className="px-4 py-3 text-right text-gray-700">{(p.total_earned || 0).toLocaleString('ru-RU')} ₸</td>
                    <td className="px-4 py-3 text-right text-gray-500">{(p.total_withdrawn || 0).toLocaleString('ru-RU')} ₸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Check className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Новых запросов нет</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium">Имя</th>
                  <th className="text-right px-4 py-3 font-medium">Сумма</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Kaspi номер</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Дата</th>
                  <th className="text-center px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.users?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{r.users?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {r.amount?.toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{r.kaspi_number || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {new Date(r.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleApprove(r)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors">
                          <Check className="w-3 h-3" /> Одобрить
                        </button>
                        <button onClick={() => handleReject(r.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition-colors">
                          <X className="w-3 h-3" /> Отклонить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
