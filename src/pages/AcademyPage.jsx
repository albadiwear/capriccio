import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Heart, Lock, Palette, Shirt, Sparkles, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80'

function WaitlistModal({ open, onClose, defaultEmail = '', title }) {
  const user = useAuthStore((state) => state.user)
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('notifications_queue').insert({
      user_id: user?.id || null,
      type: 'academy_waitlist',
      channel: 'email',
      payload: { email: email.trim() },
    })

    if (insertError) {
      setError('Не удалось отправить. Попробуйте ещё раз.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-[#f0ede8] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-base sm:text-lg font-medium text-[#1a1a18]">
              {title || 'Академия откроется совсем скоро!'}
            </div>
            <p className="text-sm text-[#888780] mt-1">
              Оставь email и получи ранний доступ со скидкой 30%
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-[#f0ede8] flex items-center justify-center text-[#888780] hover:text-[#1a1a18] hover:border-[#1a1a18] transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl bg-[#f5f2ed] border border-[#f0ede8] px-4 py-3 text-sm text-[#1a1a18]">
            Спасибо! Мы уведомим тебя о старте Академии.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш email"
              className="w-full h-12 rounded-xl border border-[#e0ddd8] px-4 text-sm outline-none focus:border-[#1a1a18] placeholder:text-[#aaa]"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#1a1a18] text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Отправляем...' : 'Уведомить меня'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function AcademyPage() {
  const user = useAuthStore((state) => state.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [ctaEmail, setCtaEmail] = useState(user?.email || '')
  const [ctaLoading, setCtaLoading] = useState(false)
  const [ctaError, setCtaError] = useState('')
  const [ctaSuccess, setCtaSuccess] = useState(false)

  const [orderModal, setOrderModal] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')

  const [accessStatus, setAccessStatus] = useState(null)
  const [userOrder, setUserOrder] = useState(null)
  const [content, setContent] = useState([])
  const [activeTab, setActiveTab] = useState('lessons')
  const [academyError, setAcademyError] = useState('')

  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.user_metadata?.full_name || '',
        email: user.email,
        phone: user.user_metadata?.phone || '',
      })
      checkAccess()
    } else {
      setAccessStatus('none')
    }
  }, [user])

  const checkAccess = async () => {
    setAcademyError('')
    try {
      const { data, error: accessError } = await supabase
        .from('academy_orders')
        .select('status, tariff, tariff_name, activated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (accessError) throw accessError

      if (!data) {
        setAccessStatus('none')
      } else {
        setAccessStatus(data.status)
        setUserOrder(data)
        if (data.status === 'active') {
          loadAcademyData(data.tariff)
        }
      }
    } catch (e) {
      console.error('AcademyPage.checkAccess error:', e)
      setAcademyError('Не удалось загрузить информацию о доступе')
      setAccessStatus('none')
    }
  }

  const loadAcademyData = async (tariff) => {
    const t = tariff || userOrder?.tariff
    const levels =
      t === 'premium'
        ? ['start', 'basic', 'premium']
        : t === 'basic'
          ? ['start', 'basic']
          : ['start']

    setAcademyError('')
    try {
      const { data, error } = await supabase
        .from('academy_content')
        .select('*')
        .in('tariff_level', levels)
        .eq('is_published', true)
        .order('sort_order')

      if (error) throw error
      setContent(data || [])
    } catch (e) {
      console.error('AcademyPage.loadAcademyData error:', e)
      setAcademyError('Не удалось загрузить материалы академии')
    }
  }

  const handleSelectTariff = (tariff, name, price) => {
    if (!user) {
      window.location.href = '/#access'
      return
    }
    setOrderModal({ tariff, name, price })
  }

  const handleConfirmOrder = async () => {
    setOrderLoading(true)
    setOrderError('')
    try {
      const { error } = await supabase.from('academy_orders').insert({
        user_id: user.id,
        user_name: userProfile?.name,
        user_email: userProfile?.email,
        user_phone: userProfile?.phone,
        tariff: orderModal.tariff,
        tariff_name: orderModal.name,
        tariff_price: orderModal.price,
        status: 'pending',
      })
      if (error) throw error
      setOrderSuccess(true)
    } catch (e) {
      console.error('AcademyPage.handleConfirmOrder error:', e)
      setOrderError('Не удалось отправить заявку. Попробуйте ещё раз.')
    }
    setOrderLoading(false)
  }

  const directions = useMemo(
    () => [
      {
        title: 'Стиль и гардероб',
        icon: Shirt,
        bg: '#FBEAF0',
        color: '#72243E',
        desc: 'Капсульный гардероб, цветотип, образы для любого случая',
      },
      {
        title: 'Красота и уход',
        icon: Sparkles,
        bg: '#E1F5EE',
        color: '#085041',
        desc: 'Уход за кожей 35+, макияж который молодит, уход за волосами',
      },
      {
        title: 'Здоровье и энергия',
        icon: Heart,
        bg: '#EEEDFE',
        color: '#3C3489',
        desc: 'Питание, движение, сон — как выглядеть и чувствовать себя лучше',
      },
      {
        title: 'Уверенность',
        icon: Star,
        bg: '#FAEEDA',
        color: '#633806',
        desc: 'Психология стиля, истории трансформации, найди себя',
      },
    ],
    []
  )

  const courses = useMemo(
    () => [
      {
        title: 'Капсульный гардероб за 7 дней',
        lessons: 8,
        hours: 3,
        bg: '#f5f0eb',
        icon: Shirt,
        image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
      },
      {
        title: 'Твой цветотип',
        lessons: 5,
        hours: 2,
        bg: '#e8f0f5',
        icon: Palette,
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
      },
      {
        title: 'Уход за кожей 35+',
        lessons: 6,
        hours: 2.5,
        bg: '#f0ebe8',
        icon: Sparkles,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
      },
      {
        title: 'Образы для работы и жизни',
        lessons: 10,
        hours: 4,
        bg: '#ebe8f0',
        icon: Briefcase,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
      },
      {
        title: 'Макияж который молодит',
        lessons: 7,
        hours: 2.5,
        bg: '#e8f0eb',
        icon: Star,
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
      },
      {
        title: 'Уверенность через стиль',
        lessons: 4,
        hours: 1.5,
        bg: '#f0e8eb',
        icon: Heart,
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
      },
    ],
    []
  )

  async function submitCta(e) {
    e.preventDefault()
    if (!ctaEmail.trim()) return
    setCtaLoading(true)
    setCtaError('')

    const { error } = await supabase.from('notifications_queue').insert({
      user_id: user?.id || null,
      type: 'academy_waitlist',
      channel: 'email',
      payload: { email: ctaEmail.trim() },
    })

    if (error) {
      setCtaError('Не удалось отправить. Попробуйте ещё раз.')
      setCtaLoading(false)
      return
    }

    setCtaSuccess(true)
    setCtaLoading(false)
  }

  // Загрузка
  if (accessStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1a1a18] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Ожидание активации
  if (accessStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 pb-32 md:pb-20">
        <div className="w-20 h-20 rounded-full bg-[#FAEEDA] flex items-center justify-center mb-6 text-4xl">
          ⏳
        </div>
        <h2 className="text-2xl font-medium mb-3">Заявка на рассмотрении</h2>
        <p className="text-[#888780] max-w-sm leading-relaxed mb-4">
          Ваша заявка на тариф <strong className="text-[#1a1a18]">{userOrder?.tariff_name}</strong> получена.
          Мы активируем доступ в течение 24 часов и отправим уведомление на email.
        </p>
        <div className="bg-[#f5f2ed] rounded-xl px-6 py-4 text-sm text-[#888780]">
          Если есть вопросы — напишите нам в WhatsApp
        </div>
      </div>
    )
  }

  // Дашборд академии
  if (accessStatus === 'active') {
    const lessons = content.filter((c) => c.type === 'video')
    const articles = content.filter((c) => c.type === 'article')
    const resources = content.filter((c) => c.type === 'telegram' || c.type === 'link')

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-8">

        {academyError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {academyError}
          </div>
        )}

        {/* Приветствие */}
        <div className="bg-[#1a1a18] rounded-2xl p-5 mb-4 text-white">
          <p className="text-[#888780] text-xs mb-1">Академия Capriccio</p>
          <h2 className="text-xl font-medium">
            Привет, {user?.user_metadata?.full_name?.split(' ')[0] || 'подруга'}! 👋
          </h2>
          <p className="text-[#888780] text-xs mt-1">Тариф: {userOrder?.tariff_name}</p>
        </div>

        {/* Табы */}
        <div className="flex gap-1 border-b border-[#f0ede8] mb-4">
          {[
            { key: 'lessons', label: '🎥 Уроки' },
            { key: 'articles', label: '📖 Статьи' },
            { key: 'resources', label: '🔗 Ресурсы' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === t.key
                  ? 'border-[#1a1a18] text-[#1a1a18]'
                  : 'border-transparent text-[#888780]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Уроки */}
        {activeTab === 'lessons' && (
          <div className="flex flex-col gap-3">
            {lessons.length === 0 && (
              <div className="text-center py-12 text-[#888780]">
                <div className="text-3xl mb-3">🎥</div>
                <p className="text-sm">Видеоуроки скоро появятся</p>
              </div>
            )}
            {lessons.map((item) => (
              <div key={item.id} className="border border-[#f0ede8] rounded-2xl overflow-hidden bg-white hover:border-[#1a1a18] transition-all">
                <div className="flex gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1a18] flex items-center justify-center text-white text-lg flex-shrink-0">
                    🎥
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1a1a18] mb-0.5">{item.title}</p>
                    <p className="text-xs text-[#888780] line-clamp-2 mb-2">{item.description}</p>
                    {item.duration_minutes > 0 && (
                      <span className="text-xs text-[#888780]">⏱ {item.duration_minutes} мин</span>
                    )}
                  </div>
                </div>
                {item.content_url && (
                  <div className="px-4 pb-4">
                    <a
                      href={item.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#1a1a18] text-white text-xs font-medium py-2.5 rounded-xl text-center"
                    >
                      ▶ Смотреть урок
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Статьи */}
        {activeTab === 'articles' && (
          <div className="flex flex-col gap-3">
            {articles.length === 0 && (
              <div className="text-center py-12 text-[#888780]">
                <div className="text-3xl mb-3">📖</div>
                <p className="text-sm">Статьи скоро появятся</p>
              </div>
            )}
            {articles.map((item) => (
              <div key={item.id} className="border border-[#f0ede8] rounded-2xl p-4 bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f5f2ed] flex items-center justify-center text-lg flex-shrink-0">
                    📖
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-0.5">{item.title}</p>
                    <p className="text-xs text-[#888780] mb-3">{item.description}</p>
                    {item.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[#1a1a18] underline"
                      >
                        Читать →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ресурсы */}
        {activeTab === 'resources' && (
          <div className="flex flex-col gap-3">
            {resources.length === 0 && (
              <div className="text-center py-12 text-[#888780]">
                <div className="text-3xl mb-3">🔗</div>
                <p className="text-sm">Ресурсы скоро появятся</p>
              </div>
            )}
            {resources.map((item) => (
              <div key={item.id} className="border border-[#f0ede8] rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f2ed] flex items-center justify-center text-xl flex-shrink-0">
                    {item.type === 'telegram' ? '✈️' : '🔗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-[#888780]">{item.description}</p>
                  </div>
                  {item.content_url && (
                    <a
                      href={item.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1a1a18] text-white text-xs font-medium px-4 py-2 rounded-xl flex-shrink-0"
                    >
                      Открыть
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Лендинг (none / cancelled)
  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Block 1: Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-16 py-20 overflow-hidden">
        <img src={HERO_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="" />

        <div className="absolute inset-0 bg-[#1a1a18]/70" />

        <div className="relative z-10 max-w-5xl mx-auto w-full text-center md:text-left">
          <span className="inline-flex items-center rounded-full bg-pink-50 text-pink-800 text-xs font-medium px-3 py-1">
            Скоро открытие
          </span>
          <h1 className="mt-5 text-white text-4xl md:text-7xl font-medium">
            Академия Capriccio
          </h1>
          <p className="mt-3 text-[#c0bdb8] text-base max-w-2xl mx-auto md:mx-0">
            Обучение стилю, красоте и уверенности для женщин 35+
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-white text-[#1a1a18] px-6 py-3 text-sm font-medium"
          >
            Хочу попасть первой
          </button>
          <div className="mt-2 text-xs text-[#c0bdb8]">Ранний доступ со скидкой 30%</div>
        </div>
      </section>

      {/* Block 2: Directions */}
      <section className="px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium text-[#1a1a18] mb-8">Всё для твоего преображения</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {directions.map((dir) => {
              const Icon = dir.icon
              return (
                <button
                  key={dir.title}
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="rounded-2xl p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform text-left"
                  style={{ background: dir.bg }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  >
                    <Icon size={20} style={{ color: dir.color }} />
                  </div>
                  <h3 className="font-medium text-sm mb-2" style={{ color: dir.color }}>
                    {dir.title}
                  </h3>
                  <p className="hidden md:block text-xs leading-relaxed" style={{ color: dir.color, opacity: 0.8 }}>
                    {dir.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Block 3: Courses */}
      <section className="px-6 pb-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium text-[#1a1a18] mb-8">Что тебя ждёт</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((c, index) => {
              return (
                <div key={c.title} className="border border-[#f0ede8] rounded-2xl overflow-hidden">
                  <div className="h-48 rounded-t-xl overflow-hidden relative" style={{ background: c.bg }}>
                    <img src={c.image} className="w-full h-full object-cover" alt={c.title} />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Lock size={18} className="text-white" />
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      Скоро
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium text-[#1a1a18] mb-2">{c.title}</div>
                    <div className="text-xs text-[#888780]">
                      {c.lessons} уроков · {c.hours} часа
                    </div>
                    <button
                      type="button"
                      disabled
                    className="mt-4 w-full h-11 rounded-xl border border-[#e0ddd8] text-sm text-[#888780] cursor-not-allowed"
                  >
                    Узнать больше
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Block 4: Pricing */}
      <section className="py-16">
        <div className="text-center px-6">
          <h2 className="text-2xl font-medium text-[#1a1a18] mb-10">Выбери свой формат</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto px-6">
          {/* START */}
          <div className="border border-[#e0ddd8] rounded-2xl p-6">
            <div className="text-2xl mb-1">🌱</div>
            <h3 className="font-medium text-lg mb-1">Старт</h3>
            <div className="text-3xl font-medium mb-1">Бесплатно</div>
            <p className="text-sm text-[#888780] mb-4">Попробуй Академию без риска</p>
            <div className="flex flex-col gap-2 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span>👀</span> Превью всех курсов
              </div>
              <div className="flex items-center gap-2">
                <span>📖</span> 1 статья в неделю
              </div>
              <div className="flex items-center gap-2">
                <span>💬</span> Доступ к сообществу
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTariff('start', 'Старт', 0)}
              className="w-full border border-[#1a1a18] text-[#1a1a18] py-3 rounded-xl text-sm font-medium hover:bg-[#f5f2ed] transition-colors"
            >
              Начать бесплатно
            </button>
          </div>

          {/* BASE */}
          <div className="bg-[#1a1a18] rounded-2xl p-6 relative shadow-2xl scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4537E] text-white text-xs px-4 py-1 rounded-full font-medium whitespace-nowrap">
              🔥 Самый популярный
            </div>
            <div className="text-2xl mb-1">⭐️</div>
            <h3 className="font-medium text-lg mb-1 text-white">Базовый</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-medium text-white">4 900 ₸</span>
              <span className="text-[#888780] text-sm">/месяц</span>
            </div>
            <p className="text-sm text-[#888780] mb-4">Полный доступ к знаниям</p>
            <div className="flex flex-col gap-2 mb-6 text-sm text-white">
              <div className="flex items-center gap-2">
                <span>✅</span> Все статьи и гайды
              </div>
              <div className="flex items-center gap-2">
                <span>🎥</span> Записи вебинаров
              </div>
              <div className="flex items-center gap-2">
                <span>💎</span> Закрытый чат участниц
              </div>
              <div className="flex items-center gap-2">
                <span>🛍️</span> Скидка 10% на товары
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTariff('basic', 'Базовый', 4900)}
              className="w-full bg-white text-[#1a1a18] py-3 rounded-xl text-sm font-medium hover:bg-[#f5f2ed] transition-colors"
            >
              Выбрать →
            </button>
          </div>

          {/* PREMIUM */}
          <div className="border border-[#e0ddd8] rounded-2xl p-6 bg-gradient-to-b from-[#FBEAF0] to-white">
            <div className="text-2xl mb-1">👑</div>
            <h3 className="font-medium text-lg mb-1">Премиум</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-medium">12 900 ₸</span>
              <span className="text-[#888780] text-sm">/месяц</span>
            </div>
            <p className="text-sm text-[#888780] mb-4">Персональный подход к твоему стилю</p>
            <div className="flex flex-col gap-2 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span>✅</span> Всё из Базового
              </div>
              <div className="flex items-center gap-2">
                <span>🎙️</span> Живые вебинары
              </div>
              <div className="flex items-center gap-2">
                <span>👗</span> Разбор гардероба лично
              </div>
              <div className="flex items-center gap-2">
                <span>💌</span> Чат со стилистом
              </div>
              <div className="flex items-center gap-2">
                <span>🛍️</span> Скидка 20% на товары
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTariff('premium', 'Премиум', 12900)}
              className="w-full bg-[#D4537E] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c44370] transition-colors"
            >
              Выбрать →
            </button>
          </div>
        </div>
      </section>

      {/* Block 5: Quote */}
      <section className="bg-[#FBEAF0] py-14 px-6 text-center">
        <div className="text-4xl mb-4">💬</div>
        <blockquote className="text-xl md:text-2xl font-medium text-[#1a1a18] max-w-2xl mx-auto mb-4 leading-relaxed">
          "Я всегда думала что стиль — это не для меня. После первого урока я поняла что просто не знала правил."
        </blockquote>
        <p className="text-[#888780] text-sm">— Айгерим, 42 года, Алматы ⭐️⭐️⭐️⭐️⭐️</p>
      </section>

      {/* Block 6: CTA */}
      <section className="bg-[#1a1a18] py-16 px-6 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-3xl font-medium text-white mb-3">Не пропусти открытие Академии</h2>
        <p className="text-[#888780] mb-2">Первые 100 участниц получат скидку 30% на любой тариф</p>
        <p className="text-[#D4537E] text-sm mb-8 font-medium">⏰ Осталось мест: 47 из 100</p>

        {ctaSuccess ? (
          <div className="max-w-md mx-auto rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white">
            Спасибо! Мы уведомим тебя о старте.
          </div>
        ) : (
          <form onSubmit={submitCta} className="flex flex-col md:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              placeholder="Твой email"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40"
              required
            />
            <button
              type="submit"
              disabled={ctaLoading}
              className="bg-[#D4537E] text-white px-8 py-3 rounded-xl text-sm font-medium whitespace-nowrap hover:bg-[#c44370] transition-colors disabled:opacity-60"
            >
              {ctaLoading ? '...' : 'Хочу попасть первой 🎉'}
            </button>
          </form>
        )}
        {ctaError && <p className="mt-4 text-sm text-red-300">{ctaError}</p>}
      </section>

      <WaitlistModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultEmail={user?.email || ''}
      />

      {orderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => !orderSuccess && setOrderModal(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {!orderSuccess ? (
              <>
                <h3 className="text-lg font-medium mb-1">Подтвердить заявку</h3>
                <p className="text-sm text-[#888780] mb-5">
                  Тариф:{' '}
                  <span className="font-medium text-[#1a1a18]">{orderModal.name}</span>
                  {orderModal.price > 0 && (
                    <span> · {orderModal.price.toLocaleString()} ₸/мес</span>
                  )}
                </p>

                <div className="bg-[#f5f2ed] rounded-xl p-4 mb-5">
                  <p className="text-xs text-[#888780] mb-3 font-medium">Ваши данные</p>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#888780]">Имя</span>
                      <span className="font-medium">{userProfile?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888780]">Email</span>
                      <span className="font-medium">{userProfile?.email}</span>
                    </div>
                    {userProfile?.phone && (
                      <div className="flex justify-between">
                        <span className="text-[#888780]">Телефон</span>
                        <span className="font-medium">{userProfile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#888780] mb-5 leading-relaxed">
                  После подтверждения заявка будет отправлена. Мы активируем доступ в течение 24 часов
                  и отправим уведомление на email.
                </p>

                {orderError && (
                  <p className="mb-3 text-sm text-red-600">{orderError}</p>
                )}

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={orderLoading}
                  className="w-full bg-[#1a1a18] text-white py-3.5 rounded-xl text-sm font-medium mb-3 disabled:opacity-50"
                >
                  {orderLoading ? 'Отправляем заявку...' : 'Подтвердить заявку →'}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderModal(null)}
                  className="w-full text-sm text-[#888780] py-2"
                >
                  Отмена
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Заявка отправлена!</h3>
                <p className="text-sm text-[#888780] mb-6 leading-relaxed">
                  Мы получили вашу заявку на тариф <strong>{orderModal.name}</strong>.
                  Активируем доступ в течение 24 часов и отправим уведомление на email.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderModal(null)
                    setOrderSuccess(false)
                  }}
                  className="w-full bg-[#1a1a18] text-white py-3 rounded-xl text-sm font-medium"
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
