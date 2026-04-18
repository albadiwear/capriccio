import { useState, useEffect } from 'react'
import { Check, Handshake, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const LEVEL_META = {
  start: { label: 'Старт', cls: 'bg-gray-100 text-gray-700' },
  active: { label: 'Активный', cls: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Про', cls: 'bg-green-100 text-green-700' },
}

const METHOD_LABELS = {
  kaspi: 'Kaspi',
  bank: 'Bank transfer',
  cash: 'Наличные',
}

const STATUS_META = {
  pending: { label: 'Ожидает', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Подтверждён', cls: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Отклонён', cls: 'bg-red-100 text-red-600' },
  paid: { label: 'Выплачено', cls: 'bg-green-100 text-green-700' },
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('partners')
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending')

  async function load() {
    setLoading(true)
    const [{ data: refs }, { data: reqs }] = await Promise.all([
      supabase
        .from('referrals')
        .select('*, users(full_name, email)')
        .order('total_earned', { ascending: false }),
      supabase
        .from('withdrawal_requests')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false }),
    ])
    setPartners(refs || [])
    setWithdrawals(reqs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleChangeLevel(referralId, newLevel) {
    await supabase.from('referrals').update({ level: newLevel }).eq('id', referralId)
    setPartners((prev) => prev.map((p) => (p.id === referralId ? { ...p, level: newLevel } : p)))
  }

  async function handleApprove(req) {
    const partner = partners.find((p) => p.user_id === req.user_id)
    const currentBalance = Number(partner?.balance || 0)

    await Promise.all([
      supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', req.id),
      supabase.from('referrals').update({
        balance: Math.max(0, currentBalance - Number(req.amount)),
        total_withdrawn: Number(partner?.total_withdrawn || 0) + Number(req.amount),
      }).eq('user_id', req.user_id),
    ])
    load()
  }

  async function handleReject(id) {
    await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length
  const visibleWithdrawals = withdrawalFilter === 'all'
    ? withdrawals
    : withdrawals.filter((w) => w.status === withdrawalFilter)

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Партнёры</h1>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {[
          { key: 'partners', label: 'Партнёры' },
          { key: 'withdrawals', label: `Запросы на вывод${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              tab === t.key ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Partners tab */}
      {tab === 'partners' && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Handshake className="mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm">Партнёров пока нет</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">Имя</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Уровень</th>
                  <th className="px-4 py-3 text-left font-medium">Реф. код</th>
                  <th className="px-4 py-3 text-right font-medium">Продажи/мес</th>
                  <th className="px-4 py-3 text-right font-medium">Баланс</th>
                  <th className="px-4 py-3 text-right font-medium">Заработано</th>
                  <th className="px-4 py-3 text-right font-medium">Выведено</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.users?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.users?.email || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.level || 'start'}
                        onChange={(e) => handleChangeLevel(p.id, e.target.value)}
                        className={`h-8 rounded-lg border-0 px-2.5 text-xs font-medium outline-none ${LEVEL_META[p.level]?.cls || LEVEL_META.start.cls}`}
                      >
                        <option value="start">Старт</option>
                        <option value="active">Активный</option>
                        <option value="pro">Про</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.referral_code || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(p.monthly_sales || 0)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{Number(p.balance || 0).toLocaleString('ru-RU')} ₸</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(p.total_earned || 0).toLocaleString('ru-RU')} ₸</td>
                    <td className="px-4 py-3 text-right text-gray-500">{Number(p.total_withdrawn || 0).toLocaleString('ru-RU')} ₸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Withdrawals tab */}
      {tab === 'withdrawals' && (
        <>
          {/* Filter */}
          <div className="mb-4 flex gap-2">
            {[
              { key: 'pending', label: 'Ожидают' },
              { key: 'approved', label: 'Подтверждены' },
              { key: 'rejected', label: 'Отклонены' },
              { key: 'all', label: 'Все' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setWithdrawalFilter(f.key)}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                  withdrawalFilter === f.key
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : visibleWithdrawals.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Check className="mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm">Заявок нет</p>
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="px-4 py-3 text-left font-medium">Партнёр</th>
                    <th className="px-4 py-3 text-right font-medium">Сумма</th>
                    <th className="px-4 py-3 text-left font-medium">Способ</th>
                    <th className="px-4 py-3 text-left font-medium">Реквизиты</th>
                    <th className="px-4 py-3 text-left font-medium">Дата</th>
                    <th className="px-4 py-3 text-left font-medium">Статус</th>
                    <th className="px-4 py-3 text-center font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleWithdrawals.map((r) => {
                    const meta = STATUS_META[r.status] || STATUS_META.pending
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.users?.full_name || '—'}</p>
                          <p className="text-xs text-gray-400">{r.users?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {Number(r.amount || 0).toLocaleString('ru-RU')} ₸
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {METHOD_LABELS[r.method] || r.method || r.kaspi_phone ? 'Kaspi' : '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-gray-600 text-xs leading-5 whitespace-pre-wrap">
                            {r.details || r.kaspi_phone || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'pending' && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprove(r)}
                                className="flex items-center gap-1 rounded px-2.5 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                <Check className="h-3 w-3" /> Одобрить
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="flex items-center gap-1 rounded px-2.5 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <X className="h-3 w-3" /> Отклонить
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
