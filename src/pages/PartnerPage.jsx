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
  const [funnel, setFunnel] = useState({ clicks: 0, registrations: 0, onboarding: 0, orders: 0, purchases: 0 })
  const [userRefCode, setUserRefCode] = useState('')

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
      setUserRefCode(profile?.referral_code || '')
      setPendingWithdrawal(pendingReq)

      // Load funnel analytics + transactions in one batch
      const myCode = currentReferral.referral_code || profile?.referral_code || fallbackCode

      const [
        { count: clicksCount },
        { count: regsCount },
        { data: referredUsers },
        { count: purchasesCount },
        { data: txData },
      ] = await Promise.all([
        myCode
          ? supabase.from('referral_clicks').select('id', { count: 'exact', head: true }).eq('referral_code', myCode)
          : Promise.resolve({ count: 0 }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('referred_by', user.id),
        supabase.from('users').select('id').eq('referred_by', user.id),
        supabase.from('referral_transactions').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
        supabase
          .from('referral_transactions')
          .select('id, order_id, order_amount, commission, status, created_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const referredUserIds = referredUsers?.map((u) => u.id) || []

      const [{ count: onboardingCount }, { count: ordersCount }] = await Promise.all([
        referredUserIds.length
          ? supabase.from('stylist_profiles').select('id', { count: 'exact', head: true }).in('user_id', referredUserIds).eq('onboarding_completed', true)
          : Promise.resolve({ count: 0 }),
        referredUserIds.length
          ? supabase.from('orders').select('id', { count: 'exact', head: true }).in('user_id', referredUserIds).not('status', 'in', '("cancelled","pending")')
          : Promise.resolve({ count: 0 }),
      ])

      setFunnel({
        clicks: clicksCount || 0,
        registrations: regsCount || 0,
        onboarding: onboardingCount || 0,
        orders: ordersCount || 0,
        purchases: purchasesCount || 0,
      })
      setTransactions(txData || [])

      setLoading(false)
    }

    load()
  }, [user])

  const referralCode = userRefCode || user?.user_metadata?.referral_code || ''
  const referralLink = `https://capriccio.vercel.app?ref=${referralCode}`
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
      kaspi_phone: form.method === 'kaspi' ? form.details.trim() : null,
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

            {/* Funnel */}
            <div className="rounded-2xl border border-[#f0ede8] bg-white p-6">
              <h2 className="mb-5 text-base font-semibold text-gray-900">Воронка продаж</h2>

              {/* Desktop: single row with arrows; Mobile: 2-column grid */}
              <div className="hidden sm:flex items-stretch gap-0">
                {[
                  { label: 'Клики', value: funnel.clicks },
                  { label: 'Регистрации', value: funnel.registrations },
                  { label: 'Анкета', value: funnel.onboarding },
                  { label: 'Заказы', value: funnel.orders },
                  { label: 'Покупки', value: funnel.purchases },
                ].map((step, i, arr) => {
                  const prev = arr[i - 1]
                  const convPct = prev && prev.value > 0 && step.value !== null
                    ? Math.round((step.value / prev.value) * 100)
                    : null

                  return (
                    <div key={step.label} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[90px] px-2">
                        <div className="text-2xl font-bold text-gray-900">{step.value}</div>
                        <div className="mt-1 text-xs text-gray-500 text-center">{step.label}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex flex-col items-center px-1">
                          <div className="text-gray-300 text-lg leading-none">›</div>
                          {convPct !== null && (
                            <div className="text-[10px] text-[#D4537E] font-medium">{convPct}%</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Mobile: 2-col grid */}
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {[
                  { label: 'Клики', value: funnel.clicks },
                  { label: 'Регистрации', value: funnel.registrations },
                  { label: 'Анкета', value: funnel.onboarding },
                  { label: 'Заказы', value: funnel.orders },
                  { label: 'Покупки', value: funnel.purchases },
                ].map((step) => (
                  <div key={step.label} className="rounded-xl border border-[#f0ede8] px-4 py-3">
                    <div className="text-xl font-bold text-gray-900">{step.value}</div>
                    <div className="mt-1 text-xs text-gray-500">{step.label}</div>
                  </div>
                ))}
              </div>

              {/* Conversion labels for mobile */}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 sm:hidden">
                {funnel.clicks > 0 && (
                  <span className="text-xs text-gray-500">
                    Клики → Рег: <span className="font-medium text-[#D4537E]">{Math.round((funnel.registrations / funnel.clicks) * 100)}%</span>
                  </span>
                )}
                {funnel.registrations > 0 && (
                  <span className="text-xs text-gray-500">
                    Рег → Анкета: <span className="font-medium text-[#D4537E]">{Math.round((funnel.onboarding / funnel.registrations) * 100)}%</span>
                  </span>
                )}
                {funnel.onboarding > 0 && (
                  <span className="text-xs text-gray-500">
                    Анкета → Покупка: <span className="font-medium text-[#D4537E]">{Math.round((funnel.purchases / funnel.onboarding) * 100)}%</span>
                  </span>
                )}
              </div>
            </div>

            {/* Payout button */}
            <div className="flex flex-col gap-2">
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
              <p className="text-xs text-gray-400">Минимальная сумма вывода: 5 000 ₸</p>
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
                  <h2 className="text-base font-semibold text-gray-900">История выплат</h2>
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
                        <th className="px-2 py-3 text-right font-medium">Сумма заказа</th>
                        <th className="px-2 py-3 font-medium">Статус</th>
                        <th className="px-2 py-3 text-right font-medium">Комиссия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-50">
                          <td className="px-2 py-3 text-gray-500">
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString('ru-RU') : '—'}
                          </td>
                          <td className="px-2 py-3 text-right text-gray-700">
                            {Number(tx.order_amount || 0).toLocaleString('ru-RU')} ₸
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
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="px-2 py-3 text-xs font-medium text-gray-500">Итого комиссий</td>
                        <td className="px-2 py-3 text-right font-bold text-gray-900">
                          {transactions.reduce((sum, tx) => sum + Number(tx.commission || 0), 0).toLocaleString('ru-RU')} ₸
                        </td>
                      </tr>
                    </tfoot>
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
