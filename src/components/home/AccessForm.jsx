import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getRefCode } from '../../utils/referral'
import { registerWithReferral } from '../../utils/registerWithReferral'

export default function AccessForm({ user }) {
  const navigate = useNavigate()
  const authSubscriptionRef = useRef(null)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      authSubscriptionRef.current?.unsubscribe?.()
      authSubscriptionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (user) {
      setError('')
      setMessage('')
    }
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    setMessage('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError) {
      const { data: profile } = await supabase
        .from('stylist_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .maybeSingle()
      setLoading(false)
      navigate(profile?.onboarding_completed ? '/catalog' : '/onboarding')
      return
    }

    setError('Неверный email или пароль')
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const refCode = getRefCode()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, ref_code: refCode || null },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      if (refCode) {
        await registerWithReferral({ userId: data.user.id, refCode })
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        authSubscriptionRef.current = subscription
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          authSubscriptionRef.current = null
          setLoading(false)
          navigate('/onboarding')
        }
      })
      return
    }

    setMessage('Аккаунт создан. Проверьте почту, если требуется подтверждение.')
    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Введите email для сброса пароля')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message || 'Не удалось отправить письмо')
      setLoading(false)
      return
    }

    setMessage('Письмо для сброса пароля отправлено')
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    setMessage('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Redirect back to homepage so we can route based on onboarding_completed.
      options: { redirectTo: `${window.location.origin}/` },
    })

    if (oauthError) {
      setError(oauthError.message || 'Не удалось войти через Google')
      setLoading(false)
      return
    }
  }

  return (
    <section id="access" className="bg-[#1a1a18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Войди в закрытый клуб</h2>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            Зарегистрируйся — и сразу открывается каталог, личный кабинет, Академия и все функции клуба
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
          {user ? (
            <div className="text-center">
              <p className="text-sm text-gray-200">Вы уже вошли. Каталог открыт для вас.</p>
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#1a1a18] transition-colors hover:bg-gray-100"
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 overflow-hidden rounded-xl border border-[#333]">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setMessage('')
                    }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      mode === 'login' ? 'bg-white text-[#1a1a18]' : 'text-[#888780]'
                    }`}
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register')
                      setError('')
                      setMessage('')
                    }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      mode === 'register' ? 'bg-white text-[#1a1a18]' : 'text-[#888780]'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="example@mail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Пароль</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#1a1a18] transition-colors hover:bg-gray-100 disabled:opacity-60"
                  >
                    {loading ? 'Входим...' : 'Войти в Capriccio'}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResetPassword}
                    className="w-full text-center text-xs text-white/70 underline"
                  >
                    Забыли пароль?
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Имя</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Айгерим"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Телефон</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="example@mail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Пароль</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#1a1a18] transition-colors hover:bg-gray-100 disabled:opacity-60"
                  >
                    {loading ? 'Создаём...' : 'Создать аккаунт'}
                  </button>
                </form>
              )}

              {(error || message) && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  {error && <p className="text-red-300">{error}</p>}
                  {message && <p className="text-green-200">{message}</p>}
                </div>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-widest text-white/50">или</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a18] transition-colors hover:bg-gray-100 disabled:opacity-60"
              >
                Войти через Google
              </button>

              <p className="mt-4 text-center text-xs text-white/50">
                Без спама · Только важное · Можно отписаться в любой момент
              </p>

              <p className="mt-3 text-center text-xs text-white/30">
                Нажимая “Войти”, вы соглашаетесь с правилами клуба.{' '}
                <Link to="/privacy" className="underline">Политика</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
