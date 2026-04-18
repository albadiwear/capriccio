import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, CreditCard, TrendingUp, Users, Wallet, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

const METHOD_PLACEHOLDERS = {
  kaspi: 'Номер телефона Kaspi (+7 XXX XXX XX XX)',
  bank: 'IBAN и название банка',
  cash: 'Город и удобное время для получения',
}

function getTransactionStatusLabel(status) {
  switch (status) {
    case 'paid': return 'Выплачено'
    case 'approved': return 'Подтверждено'
    case 'pending': return 'Ожидает'
    case 'rejected': return 'Отклонено'
    default: return status || '—'
  }
}

function getTransactionStatusClass(status) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700'
    case 'approved': return 'bg-blue-100 text-blue-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function PartnerPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [referral, setReferral] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'kaspi', details: '' })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState({ text: '', type: '' })

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [navigate, user])

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)

      const fallbackCode = user.user_metadata?.referral_code || user.id.slice(0, 8).toUpperCase()

      const [
        { data: profile },
        { data: referralData },
        { data: pendingReq },
      ] = await Promise.all([
        supabase.from('users').select('referral_code').eq('id', user.id).maybeSingle(),
        supabase.from('referrals').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('withdrawal_requests')
          .select('id, amount, status')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle(),
      ])

      const currentReferral = referralData || {
        user_id: user.id,
        referral_code: profile?.referral_code || fallbackCode,
        balance: 0, total_earned: 0, total_withdrawn: 0,
        monthly_sales: 0, monthly_revenue: 0, level: 'start',
      }
      setReferral(currentReferral)
      setPendingWithdrawal(pendingReq)

      const { data: txData, error: txError } = await supabase
        .from('referral_transactions')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
      if (txError) {
        console.error('referral_transactions load error:', txError)
      }
      setTransactions(txData || [])

      setLoading(false)
    }

    load()
  }, [user])

  const referralCode = referral?.referral_code || user?.user_metadata?.referral_code || ''
  const referralLink = `${window.location.origin}?ref=${referralCode}`
  const balance = Number(referral?.balance || 0)
  const totalEarned = Number(referral?.total_earned || 0)
  const totalWithdrawn = Number(referral?.total_withdrawn || 0)

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setNotice({ text: 'Ссылка скопирована', type: 'success' })
    } catch {
      setNotice({ text: 'Не удалось скопировать', type: 'error' })
    }
    setTimeout(() => setNotice({ text: '', type: '' }), 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const amt = Number(form.amount)
    if (!amt || amt < 5000) {
      setNotice({ text: 'Минимальная сумма вывода — 5 000 ₸', type: 'error' })
      return
    }
    if (amt > balance) {
      setNotice({ text: 'Сумма превышает доступный баланс', type: 'error' })
      return
    }
    if (!form.details.trim()) {
      setNotice({ text: 'Укажите реквизиты', type: 'error' })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: user.id,
      amount: amt,
      method: form.method,
      details: form.details.trim(),
      status: 'pending',
    })

    if (error) {
      setNotice({ text: error.message, type: 'error' })
      setSubmitting(false)
      return
    }

    setPendingWithdrawal({ amount: amt, status: 'pending' })
    setModalOpen(false)
    setForm({ amount: '', method: 'kaspi', details: '' })
    setNotice({ text: 'Заявка отправлена — мы свяжемся с вами в течение 24 часов', type: 'success' })
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-center text-gray-500">
          Загрузка...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <AccountSidebarMobile />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <AccountSidebarDesktop />
          <div className="space-y-6">

            {/* Notice */}
            {notice.text && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                notice.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-green-200 bg-green-50 text-green-700'
              }`}>
                {notice.text}
              </div>
            )}

            {/* Header */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Partner Dashboard</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Партнёрская программа</h1>
              <p className="mt-1 text-sm text-gray-500">
                Делитесь ссылкой и зарабатывайте от 3% до 7% с каждой продажи.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Wallet} label="Баланс" value={`${balance.toLocaleString('ru-RU')} ₸`} hint="Доступно к выводу" />
              <StatCard icon={TrendingUp} label="Заработано" value={`${totalEarned.toLocaleString('ru-RU')} ₸`} hint="Всего за период" />
              <StatCard icon={CreditCard} label="Выведено" value={`${totalWithdrawn.toLocaleString('ru-RU')} ₸`} hint="Подтверждённые выплаты" />
            </div>

            {/* Payout button */}
            <div className="flex items-center gap-3">
              {pendingWithdrawal ? (
                <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-5 text-sm font-medium text-yellow-700">
                  Заявка на рассмотрении ({Number(pendingWithdrawal.amount).toLocaleString('ru-RU')} ₸)
                </div>
              ) : balance > 0 ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D4537E] px-5 text-sm font-medium text-white transition-colors hover:bg-[#c44370]"
                >
                  Запросить вывод
                </button>
              ) : null}
            </div>

            {/* Referral link */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Реферальная ссылка</p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">{referralCode || '—'}</h2>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                  Скопировать
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 break-all">
                {referralLink}
              </div>
            </div>

            {/* Level */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Уровень комиссии</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'start', label: 'Старт', commission: '3%', condition: '0–4 продажи' },
                  { key: 'active', label: 'Активный', commission: '5%', condition: '5+ продаж' },
                  { key: 'pro', label: 'Про', commission: '7%', condition: 'оборот 3 000 000 ₸' },
                ].map((lvl) => (
                  <div
                    key={lvl.key}
                    className={`rounded-xl p-4 text-center border ${
                      referral?.level === lvl.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-xs mb-1">{lvl.label}</p>
                    <p className="text-2xl font-bold mb-1">{lvl.commission}</p>
                    <p className={`text-xs ${referral?.level === lvl.key ? 'text-gray-300' : 'text-gray-400'}`}>
                      {lvl.condition}
                    </p>
                  </div>
                ))}
              </div>
              {referral?.level === 'pro' ? (
                <p className="text-sm text-center text-green-600">Максимальный уровень достигнут</p>
              ) : referral?.level === 'active' ? (
                <>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Оборот за месяц</span>
                    <span>{(referral?.monthly_revenue || 0).toLocaleString('ru-RU')} / 3 000 000 ₸</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${Math.min(((referral?.monthly_revenue || 0) / 3000000) * 100, 100)}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Продажи за месяц</span>
                    <span>{referral?.monthly_sales || 0} / 5</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${Math.min(((referral?.monthly_sales || 0) / 5) * 100, 100)}%` }} />
                  </div>
                </>
              )}
            </div>

            {/* Transactions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Транзакции</h2>
                  <p className="text-xs text-gray-500">Начисления по доставленным заказам</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                  Транзакций пока нет
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                        <th className="px-2 py-3 font-medium">Дата</th>
                        <th className="px-2 py-3 font-medium">Заказ</th>
                        <th className="px-2 py-3 font-medium">Статус</th>
                        <th className="px-2 py-3 text-right font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-50">
                          <td className="px-2 py-3 text-gray-500">
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString('ru-RU') : '—'}
                          </td>
                          <td className="px-2 py-3 text-gray-900">
                            {tx.order_id ? String(tx.order_id).slice(0, 8) : '—'}
                          </td>
                          <td className="px-2 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTransactionStatusClass(tx.status)}`}>
                              {getTransactionStatusLabel(tx.status)}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right font-semibold text-gray-900">
                            {Number(tx.commission || 0).toLocaleString('ru-RU')} ₸
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Запросить вывод</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Сумма (мин. 5 000 ₸, макс. {balance.toLocaleString('ru-RU')} ₸)
                </label>
                <input
                  type="number"
                  min={5000}
                  max={balance}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  required
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Способ вывода</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value, details: '' }))}
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none focus:border-gray-900 bg-white"
                >
                  <option value="kaspi">Kaspi</option>
                  <option value="bank">Bank transfer</option>
                  <option value="cash">Наличные</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Реквизиты</label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder={METHOD_PLACEHOLDERS[form.method]}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 resize-none"
                />
              </div>

              {notice.type === 'error' && notice.text && (
                <p className="text-xs text-red-600">{notice.text}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-[#D4537E] text-sm font-medium text-white transition-colors hover:bg-[#c44370] disabled:opacity-60"
              >
                {submitting ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
