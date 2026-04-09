import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AccessForm({ user }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+7')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setError('')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    // Генерируем случайный пароль — пользователь его не видит
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

    const { error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: name,
          phone,
        },
        // Отключаем redirect — не ждём подтверждения
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Сразу логиним с тем же паролем
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (!signInError) {
      navigate('/catalog')
    } else {
      setError('Проверьте почту для подтверждения')
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/catalog` },
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
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#1a1a18] transition-colors hover:bg-gray-100 disabled:opacity-60"
                >
                  {loading ? 'Отправляем...' : 'Войти в Capriccio'}
                </button>
              </form>

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
