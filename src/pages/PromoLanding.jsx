import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { getRefCode, markReferralConverted, clearRefCode } from '../utils/referral'

const catalogTags = [
  'Пуховики',
  'Костюмы',
  'Обувь',
  'Трикотаж',
  'Платья',
  'Аксессуары',
  'и другое ->',
]

const promoItems = [
  { image: '/promo/item1.jpg', title: 'Пуховик Milano', price: '89 900 ₸' },
  { image: '/promo/item2.jpg', title: 'Костюм Verona', price: '64 500 ₸' },
  { image: '/promo/item3.jpg', title: 'Трикотаж Luna', price: '34 900 ₸' },
  { image: '/promo/item4.jpg', title: 'Платье Siena', price: '54 000 ₸' },
  { image: '/promo/item5.jpg', title: 'Туфли Fiore', price: '47 900 ₸' },
]

const trustItems = [
  'Доставка',
  'Возврат 14 дней',
  'Оплата онлайн',
]

function InputField({ icon: Icon, ...props }) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b5e4e]" />
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-[#e0d5c5] bg-white pl-11 pr-4 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9b8d7a] focus:border-[#6b5e4e]"
      />
    </label>
  )
}

export default function PromoLanding() {
  const navigate = useNavigate()
  const initialize = useAuthStore((state) => state.initialize)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const password = `Capr_${Math.random().toString(36).slice(-6)}`
      console.log('[referral] signUp called in: PromoLanding.jsx')
      const refCode = getRefCode()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            ref_code: refCode || null,
          },
        },
      })

      let createdNewUser = Boolean(data?.user) && !signUpError
      let authUser = data?.user || data?.session?.user || null

      if (signUpError) {
        const alreadyRegistered = signUpError.message?.toLowerCase().includes('already registered')

        if (!alreadyRegistered) {
          throw signUpError
        }

        createdNewUser = false
        const { error: otpError } = await supabase.auth.signInWithOtp({ email })

        if (otpError) {
          throw otpError
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        authUser = user || authUser
      }

      if (authUser?.id) {
        await supabase.from('users').upsert({
          id: authUser.id,
          email,
          full_name: fullName,
          phone,
        })

        if (refCode) {
          await markReferralConverted(refCode)
          clearRefCode()
        }
      }

      await initialize()
      const { data: { session } } = await supabase.auth.getSession()

      if (createdNewUser && session) {
        navigate('/onboarding')
      } else {
        navigate('/catalog')
      }
    } catch (submitError) {
      setError(submitError.message || 'Не удалось создать аккаунт')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] text-[#1a1a1a]">
      <section className="relative min-h-[max(100svh,500px)] overflow-hidden">
        <img
          src="/promo/hero.jpg"
          alt="Capriccio promo"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-[#f5f0eb]/20" />

        <div className="relative flex min-h-[max(100svh,500px)] flex-col px-5 py-6 sm:px-8 md:px-12">
          <div className="flex items-start justify-between gap-4">
            <p className="mx-auto text-center text-xs tracking-[0.35em] text-[#f5f0eb] sm:text-sm">
              CAPRICCIO
            </p>
            <div className="rounded-full border border-[#6b5e4e] bg-[#f5e7d4] px-4 py-2 text-xs font-medium text-[#1a1a1a]">
              ✦ Персональный стилист
            </div>
          </div>

          <div className="mt-auto max-w-xl pb-6">
            <div className="inline-block rounded-2xl bg-[#f5f0eb]/88 px-6 py-5 backdrop-blur-sm">
              <h1 className="text-3xl font-semibold leading-tight text-[#1a1a1a] sm:text-5xl">
                Одежда, которая <span className="italic font-normal">говорит за вас</span>
              </h1>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <section className="rounded-2xl border border-[#e0d5c5] bg-[#f9f6f2] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6b5e4e]">ПОСЛЕ РЕГИСТРАЦИИ</p>
          <p className="mt-3 text-xl leading-snug text-[#1a1a1a] sm:text-2xl">
            Наш стилист поможет подобрать образ лично для вас — бесплатно, онлайн
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#e0d5c5] bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d5c5] bg-[#eadfce] text-xs font-semibold text-[#6b5e4e]">AK</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d5c5] bg-[#f1e7da] text-xs font-semibold text-[#6b5e4e]">DM</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d5c5] bg-[#e5d8c6] text-xs font-semibold text-[#6b5e4e]">AS</div>
            </div>
            <p className="text-sm font-medium text-[#1a1a1a]">1 200+ покупательниц</p>
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">★★★★★ 4.9</p>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[0.18em] text-[#1a1a1a]">КАТАЛОГ</h2>
            <p className="text-sm text-[#6b5e4e]">1 500+ позиций</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {catalogTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e0d5c5] bg-white/70 px-4 py-2 text-sm text-[#6b5e4e]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {promoItems.map((item) => (
              <div key={item.title} className="relative overflow-hidden rounded-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/35 px-3 py-3 text-[#f5f0eb] backdrop-blur-sm">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[#f5f0eb]/85">{item.price}</p>
                </div>
              </div>
            ))}

            <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg border border-[#e0d5c5] bg-[#eadfce] px-6 text-center">
              <p className="text-5xl font-light text-[#6b5e4e]">+</p>
              <p className="mt-3 text-base text-[#1a1a1a]">ещё 1 500+ товаров</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-base text-[#6b5e4e]">Зарегистрируйтесь, чтобы открыть каталог</p>
            <p className="mt-2 text-2xl text-[#1a1a1a]">↓</p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#e0d5c5] bg-white px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-semibold text-[#1a1a1a]">Создать аккаунт — это быстро</h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <InputField
                icon={User}
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Имя"
                required
              />
              <InputField
                icon={Phone}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Телефон +7"
                required
              />
              <InputField
                icon={Mail}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
              />

              {error && (
                <p className="text-sm text-[#a13f32]">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-6 text-sm font-medium text-[#f5f0eb] transition-colors hover:bg-[#2b2b2b] disabled:opacity-60"
              >
                {submitting ? 'Загрузка...' : 'Открыть каталог ->'}
              </button>
            </form>

            <p className="mt-4 text-sm text-[#6b5e4e]">На email придёт пароль от вашего аккаунта</p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[#e0d5c5] bg-[#f9f6f2]">
          <div className="grid grid-cols-1 divide-y divide-[#e0d5c5] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {trustItems.map((item) => (
              <div key={item} className="px-6 py-5 text-center text-sm font-medium text-[#1a1a1a]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
