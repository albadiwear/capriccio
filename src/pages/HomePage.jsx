import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSEO } from '../hooks/useSEO'
import HeroSection from '../components/home/HeroSection'
import DirectionsSection from '../components/home/DirectionsSection'
import CatalogPreview from '../components/home/CatalogPreview'
import ReviewsSection from '../components/home/ReviewsSection'
import { supabase } from '../lib/supabase'
import { getRefCode, clearRefCode, markReferralConverted } from '../utils/referral'

export default function HomePage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useSEO({
    title: 'Capriccio — закрытый клуб',
    description:
      'Закрытый клуб Capriccio: образы, академия стиля, сообщество и премиальный магазин. Вход по регистрации.',
    url: '/',
  })

  const accessRef = useRef(null)

  const scrollToAccess = () => {
    const el = accessRef.current || document.getElementById('access')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navItems = useMemo(
    () => [
      { label: 'Образы', href: '#looks' },
      { label: 'Академия', href: '#academy' },
      { label: 'Партнёрство', href: '#partnership' },
      { label: 'О нас', href: '#about' },
    ],
    []
  )

  const [activeFilter, setActiveFilter] = useState('Все')

  const [accessBg, setAccessBg] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '+7')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [blogPosts, setBlogPosts] = useState([])
  const requireRegister = () => {
    setMode('register')
    scrollToAccess()
  }

  useEffect(() => {
    setActiveFilter('Все')
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAccessBg() {
      const { data: photos } = await supabase
        .from('products')
        .select('images')
        .eq('is_active', true)
        .limit(3)

      const bg = photos?.[1]?.images?.[0] || photos?.[0]?.images?.[0] || '/hero-default.jpg'
      if (!cancelled) setAccessBg(bg || '')
    }

    loadAccessBg()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setName(user.user_metadata?.full_name || '')
    setPhone(user.user_metadata?.phone || '+7')
    setEmail(user.email || '')
    setError('')
    setMessage('')
  }, [user])

  useEffect(() => {
    if (!user?.id) {
      setChecking(false)
      return
    }

    setChecking(true)
    let cancelled = false

    supabase
      .from('stylist_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data?.onboarding_completed) {
          navigate('/catalog', { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, navigate])

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, title, slug, category, preview_image, published_at, content')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setBlogPosts(data || []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('stylist_profiles')
          .select('onboarding_completed')
          .eq('user_id', currentUser?.id || '')
          .maybeSingle()

        setLoading(false)
        if (!profile || !profile.onboarding_completed) {
          navigate('/onboarding')
        } else {
          navigate('/catalog')
        }
        return
      }

      setError('Неверный email или пароль')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      setLoading(false)
      return
    }

    console.log('[referral] signUp called in: HomePage.jsx')
    const refCode = getRefCode()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, ref_code: refCode || null } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      if (refCode) {
        await markReferralConverted(refCode)
        clearRefCode()
      }

      setLoading(false)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          navigate('/onboarding')
        }
      })
      return
    }

    setMessage('Аккаунт создан. Проверьте почту, если требуется подтверждение.')
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (loading) return
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

  async function handleGoogle(e) {
    e.preventDefault()
    if (loading) return
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
    }
  }

  if (checking && user) return null

  return (
    <div className="bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold tracking-[0.35em]">
            CAPRICCIO
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
      {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-gray-900 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={scrollToAccess}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-gray-900 transition-colors hover:border-gray-900"
          >
            Войти
          </button>
        </div>
      </header>

      <HeroSection user={user} onRequireAccess={scrollToAccess} />

      <DirectionsSection />

      <section className="bg-[#1a1a18] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-2 gap-6 border-y border-white/10 py-10 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/10">
            {[
              { value: '5 000+', label: 'Клиенток' },
              { value: '30 лет', label: 'На рынке' },
              { value: '1 500+', label: 'Позиций' },
              { value: '4.9', label: 'Рейтинг' },
            ].map((s) => (
              <div key={s.label} className="px-2 text-center md:px-6">
                <div className="text-4xl font-semibold text-white">{s.value}</div>
                <div className="mt-2 text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CatalogPreview user={user} onRequireAccess={requireRegister} />

      <ReviewsSection />

      <section id="about" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch">
            <div>
              <blockquote className="text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">
                “Мы верим что лучший возраст для перемен — прямо сейчас”
              </blockquote>
              <p className="mt-5 text-sm leading-6 text-gray-600">
                Capriccio — премиум пространство для женщин, которые выбирают стиль осознанно. Мы собираем образы,
                которые подчёркивают статус, сохраняют женственность и дают ощущение “я снова себе нравлюсь”.
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Внутри клуба — подборки, уроки, сообщество и партнёрство. А в магазине — одежда, обувь и аксессуары,
                которые помогают выглядеть современно и дорого без лишних усилий.
              </p>
              <p className="mt-6 text-sm font-medium text-gray-900">
                Основательница Capriccio · Алматы · 30 лет в моде
              </p>
            </div>

            <div className="hidden lg:flex">
              <div className="flex w-full flex-1 items-center justify-center rounded-2xl bg-[#1a1a18] px-10 py-12 text-center">
                <div>
                  <div className="text-3xl font-semibold leading-snug text-white">
                    “30 лет мы помогаем женщинам находить свой стиль”
                  </div>
                  <div className="mt-5 text-sm text-gray-400">
                    Казахстан и СНГ · с 1995 года
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="access"
        ref={accessRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden"
      >
        <img
          src={accessBg || '/hero-default.jpg'}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />
        <div className="absolute inset-0 bg-[#1a1a18]/65" />

        <div className="relative z-10 w-full max-w-md text-center">
          <p className="text-[#ED93B1] text-sm font-medium tracking-widest uppercase mb-4">
            Закрытый клуб · Казахстан и СНГ
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-3 leading-tight">
            Твой стиль.<br />
            Твоё сообщество.<br />
            Твой заработок.
          </h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Доступ к 1 500+ образам, Академии стиля и закрытому сообществу женщин 35+
          </p>

          <div className="flex justify-center gap-6 mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg">👗</div>
              <span className="text-white/70 text-xs">1 500+ образов</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg">🎓</div>
              <span className="text-white/70 text-xs">Академия</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg">👑</div>
              <span className="text-white/70 text-xs">Сообщество</span>
            </div>
	          </div>

	          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
	            <>
	                <div className="flex border border-white/20 rounded-xl mb-5 overflow-hidden">
	                  <button
	                    type="button"
	                    onClick={() => {
                      setMode('login')
                      setError('')
                      setMessage('')
                    }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      mode === 'login' ? 'bg-white text-[#1a1a18]' : 'text-white/60'
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
                      mode === 'register' ? 'bg-white text-[#1a1a18]' : 'text-white/60'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <>
                      <input
                        type="text"
                        placeholder="Имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none mb-3 focus:border-white/60"
                      />
                      <input
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none mb-3 focus:border-white/60"
                      />
                    </>
                  )}

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none mb-3 focus:border-white/60"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none mb-4 focus:border-white/60"
                    required
                  />

                  {error && <p className="text-[#ED93B1] text-xs mb-3">{error}</p>}
                  {!error && message && <p className="text-white/60 text-xs mb-3">{message}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D4537E] hover:bg-[#c44370] text-white py-3.5 rounded-xl text-sm font-medium transition-colors mb-3 disabled:opacity-50"
                  >
                    {loading
                      ? 'Загрузка...'
                      : mode === 'login'
                        ? 'Войти в Capriccio →'
                        : 'Начать преображение →'}
                  </button>

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-white/50 text-xs mb-3 hover:text-white/80 disabled:opacity-60"
                    >
                      Забыли пароль?
                    </button>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-white/40 text-xs">или</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full bg-white text-[#1a1a18] py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-60"
                  >
                    <svg width="16" height="16" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                    Войти через Google
                  </button>

	                  <p className="text-white/30 text-xs text-center mt-3">
	                    Без спама · Только важное · Отписка в любой момент
	                  </p>
	                </form>
	            </>
	          </div>
	        </div>
	      </section>

      {blogPosts.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Из блога</h2>
              <a href="/blog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Все статьи →</a>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {blogPosts.map((post) => (
                <a key={post.id} href={`/blog/${post.slug}`} className="group block">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={post.preview_image || 'https://picsum.photos/seed/blog/800/450'}
                      alt={post.title}
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{post.category}</span>
                    <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{post.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-6">{(post.content || '').slice(0, 80)}...</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold tracking-[0.35em] text-gray-900">CAPRICCIO</div>
              <p className="mt-3 text-sm text-gray-600">
                © 2025 Capriccio · Казахстан и СНГ · 30 лет на рынке
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {[
                { label: 'Каталог', to: '/catalog' },
                { label: 'Академия', to: '#academy' },
                { label: 'Партнёрство', to: '#partnership' },
                { label: 'Доставка', to: '/delivery' },
                { label: 'О нас', to: '#about' },
                { label: 'Контакты', to: '/contacts' },
              ].map((l) => (
                l.to.startsWith('#') ? (
                  <a key={l.label} href={l.to} className="hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  l.to === '/catalog' && !user ? (
                    <button
                      key={l.label}
                      type="button"
                      onClick={scrollToAccess}
                      className="text-left hover:text-gray-900 transition-colors"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <Link key={l.label} to={l.to} className="hover:text-gray-900 transition-colors">
                      {l.label}
                    </Link>
                  )
                )
              ))}
            </div>

            <div className="flex items-start md:justify-end">
              <a
                href="https://wa.me/77000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-md bg-green-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
