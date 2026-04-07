import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, CreditCard, TrendingUp, Users, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AccountSidebarMobile, AccountSidebarDesktop } from '../components/account/AccountSidebar'

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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

const LEVEL_CARDS = [
  { key: 'start', label: 'Старт', commission: '3%', condition: '0-4 продажи' },
  { key: 'active', label: 'Активный', commission: '5%', condition: '5+ продаж' },
  { key: 'pro', label: 'Про', commission: '7%', condition: 'оборот 3 000 000 ₸/мес' },
]

function getTransactionStatusLabel(status) {
  switch (status) {
    case 'paid':
      return 'Выплачено'
    case 'approved':
      return 'Подтверждено'
    case 'pending':
      return 'Ожидает'
    case 'rejected':
      return 'Отклонено'
    default:
      return status || '—'
  }
}

function getTransactionStatusClass(status) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700'
    case 'approved':
      return 'bg-blue-100 text-blue-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function PartnerPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [referral, setReferral] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    kaspi_phone: '',
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [navigate, user])

  useEffect(() => {
    if (!user) return

    async function loadPartnerData() {
      setLoading(true)
      setError('')

      const fallbackReferralCode =
        user.user_metadata?.referral_code || user.id.slice(0, 8).toUpperCase()

      const [{ data: profile }, { data: referralData, error: referralError }] = await Promise.all([
        supabase.from('users').select('referral_code').eq('id', user.id).maybeSingle(),
        supabase.from('referrals').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      if (referralError) {
        setError('Не удалось загрузить данные партнёрской программы.')
      }

      const currentReferral = referralData || {
        user_id: user.id,
        referral_code: profile?.referral_code || fallbackReferralCode,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        monthly_sales: 0,
        monthly_revenue: 0,
        level: 'start',
      }

      setReferral(currentReferral)

      // Если записи referrals ещё нет, это нормальный кейс: просто нет транзакций.
      if (!currentReferral.id) {
        setTransactions([])
        setLoading(false)
        return
      }

      if (currentReferral.id) {
        const { data: transactionData, error: transactionError } = await supabase
          .from('referral_transactions')
          .select('*')
          .eq('referral_id', currentReferral.id)
          .order('created_at', { ascending: false })

        if (transactionError) {
          console.error('referral_transactions error:', transactionError)
          setTransactions([])
        } else {
          setTransactions(transactionData || [])
        }
      }

      setLoading(false)
    }

    loadPartnerData()
  }, [user])

  const referralCode = referral?.referral_code || user?.user_metadata?.referral_code || ''
  const referralLink = `${window.location.origin}?ref=${referralCode}`
  const level = referral?.level || 'start'
  const monthlySales = Number(referral?.monthly_sales || 0)
  const monthlyRevenue = Number(referral?.monthly_revenue || 0)
  const progressPercent =
    level === 'start'
      ? Math.min(100, Math.round((monthlySales / 5) * 100))
      : Math.min(100, Math.round((monthlyRevenue / 3000000) * 100))
  const balance = Number(referral?.balance || 0)
  const totalEarned = Number(referral?.total_earned || 0)
  const totalWithdrawn = Number(referral?.total_withdrawn || referral?.withdrawn || 0)

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setSuccess('Ссылка скопирована')
      setError('')
    } catch {
      setError('Не удалось скопировать ссылку')
      setSuccess('')
    }
  }

  function handlePayoutChange(event) {
    const { name, value } = event.target
    setPayoutForm((current) => ({ ...current, [name]: value }))
  }

  async function handleRequestPayout(event) {
    event.preventDefault()

    if (!user) return

    if (!payoutForm.amount || !payoutForm.kaspi_phone) {
      setError('Укажите сумму и номер Kaspi')
      setSuccess('')
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

    setSuccess('Запрос на выплату отправлен')
    setPayoutForm({ amount: '', kaspi_phone: '' })
    setRequestingPayout(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          Загрузка партнёрского кабинета...
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
        {(error || success) && (
          <div className="space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Partner Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Партнёрская программа</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Делитесь ссылкой, отслеживайте оборот за текущий месяц и забирайте комиссию по
            прогрессивной шкале от 3% до 7%.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={Wallet}
            label="Баланс"
            value={`${balance.toLocaleString('ru-RU')} ₸`}
            hint="Доступно к выводу"
          />
          <StatCard
            icon={TrendingUp}
            label="Заработано всего"
            value={`${totalEarned.toLocaleString('ru-RU')} ₸`}
            hint="Все начисления за период"
          />
          <StatCard
            icon={CreditCard}
            label="Выведено"
            value={`${totalWithdrawn.toLocaleString('ru-RU')} ₸`}
            hint="Подтверждённые выплаты"
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Реферальная ссылка</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">{referralCode || '—'}</h2>
            </div>
            <button
              type="button"
              onClick={copyReferralLink}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
              Скопировать
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
            {referralLink}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Уровень и комиссия</h2>
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
                    : 'bg-white text-gray-900 border-gray-200'
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
            <p className="text-sm text-center text-green-600">🎉 Максимальный уровень достигнут</p>
          ) : referral?.level === 'active' ? (
            <>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Оборот за месяц</span>
                <span>{(referral?.monthly_revenue || 0).toLocaleString('ru-RU')} / 3 000 000 ₸</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full"
                  style={{ width: `${Math.min(((referral?.monthly_revenue || 0) / 3000000) * 100, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Продажи за месяц</span>
                <span>{referral?.monthly_sales || 0} / 5</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full"
                  style={{ width: `${Math.min(((referral?.monthly_sales || 0) / 5) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Транзакции</h2>
              <p className="text-sm text-gray-500">Начисления по доставленным заказам</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
              Транзакций пока нет
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-2 py-3 font-medium">Дата</th>
                    <th className="px-2 py-3 font-medium">Заказ</th>
                    <th className="px-2 py-3 font-medium">Статус</th>
                    <th className="px-2 py-3 text-right font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-50">
                      <td className="px-2 py-4 text-gray-600">
                        {transaction.created_at
                          ? new Date(transaction.created_at).toLocaleDateString('ru-RU')
                          : '—'}
                      </td>
                      <td className="px-2 py-4 text-gray-900">
                        {transaction.order_id ? String(transaction.order_id).slice(0, 8) : '—'}
                      </td>
                      <td className="px-2 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTransactionStatusClass(transaction.status)}`}
                        >
                          {getTransactionStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-right font-semibold text-gray-900">
                        {Number(transaction.amount || 0).toLocaleString('ru-RU')} ₸
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleRequestPayout} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Запросить выплату</h2>
          <p className="mt-1 text-sm text-gray-500">
            Отправьте сумму и номер Kaspi. Администратор обработает заявку вручную.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              name="amount"
              type="number"
              min="1"
              value={payoutForm.amount}
              onChange={handlePayoutChange}
              placeholder="Сумма выплаты"
              className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
            <input
              name="kaspi_phone"
              value={payoutForm.kaspi_phone}
              onChange={handlePayoutChange}
              placeholder="Номер Kaspi"
              className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={requestingPayout}
            className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
          >
            {requestingPayout ? 'Отправляем...' : 'Запросить выплату'}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}
