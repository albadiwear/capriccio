import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ExternalLink, FileText, Play, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'

const TYPE_ICON = {
  video: Play,
  article: BookOpen,
  guide: FileText,
  link: ExternalLink,
  telegram: ExternalLink,
}

const TYPE_LABEL = {
  video: '🎥 Видео',
  article: '📖 Статья',
  guide: '📄 Гайд',
  link: '🔗 Ссылка',
  telegram: '✈️ Telegram',
}

const TYPE_GRADIENT = {
  video: 'linear-gradient(135deg, #D4537E, #9B4F8E)',
  article: 'linear-gradient(135deg, #5B4FCF, #3B82F6)',
  guide: 'linear-gradient(135deg, #059669, #10B981)',
  link: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  telegram: 'linear-gradient(135deg, #F59E0B, #EF4444)',
}

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'video', label: '🎥 Видео' },
  { key: 'article', label: '📖 Статьи' },
  { key: 'guide', label: '📄 Гайды' },
  { key: 'link', label: '🔗 Ресурсы' },
]

const TARIFFS = [
  {
    key: 'start',
    emoji: '🌱',
    name: 'Старт',
    price: 0,
    priceLabel: 'Бесплатно',
    desc: 'Попробуй без риска',
    features: ['2 урока', 'Определи свой стиль', 'Базовый капсульный гардероб'],
    popular: false,
    btnClass: 'w-full border border-[#1a1a18] text-[#1a1a18] rounded-xl py-3 text-sm font-medium hover:bg-[#f9f7f4] transition-colors',
    btnLabel: 'Начать бесплатно',
  },
  {
    key: 'basic',
    emoji: '⭐',
    name: 'Стандарт',
    price: 4990,
    priceLabel: '4 990 ₸',
    priceSuffix: '/мес',
    desc: 'Полный курс стиля',
    features: ['6 уроков', 'Цветотип', 'Типы фигур', 'Образы для работы', 'Шопинг без ошибок', 'Уход за кожей 35+', 'Уверенность через стиль'],
    popular: true,
    btnClass: 'w-full bg-[#D4537E] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#c44370] transition-colors',
    btnLabel: 'Выбрать →',
  },
  {
    key: 'premium',
    emoji: '👑',
    name: 'Премиум',
    price: 12900,
    priceLabel: '12 900 ₸',
    desc: 'Личный подход',
    features: ['Всё из Стандарта', 'Разбор гардероба лично', 'Закрытый чат', 'Вебинары раз в месяц'],
    popular: false,
    btnClass: 'w-full bg-[#1a1a18] text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors',
    btnLabel: 'Выбрать →',
  },
  {
    key: 'vip',
    emoji: '💎',
    name: 'VIP',
    price: 50000,
    priceLabel: '50 000 ₸',
    desc: 'Полное сопровождение',
    features: ['Всё из Премиума', '3 сессии со стилистом', 'Шопинг-гид лично под тебя', 'Сопровождение 3 месяца'],
    popular: false,
    btnClass: 'w-full bg-[#1a1a18] text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors',
    btnLabel: 'Выбрать →',
  },
]

const PAINS = [
  { emoji: '😩', title: 'Гардероб полный, надеть нечего', desc: 'Каждое утро стресс и ощущение что нет нужной вещи' },
  { emoji: '🛍️', title: 'Покупаю и не ношу', desc: 'Заходишь в магазин, берёшь «что-то» и потом жалеешь' },
  { emoji: '🤔', title: 'Хочу стильно, но боюсь', desc: 'Страх выглядеть не по возрасту или слишком броско' },
  { emoji: '💸', title: 'Трачу, но не то', desc: 'Деньги уходят на вещи которые не сочетаются между собой' },
]

const TOPICS = [
  { emoji: '👗', title: 'Стиль и гардероб', desc: 'Капсульный гардероб, цветотип, образы для любого случая' },
  { emoji: '✨', title: 'Красота и уход', desc: 'Уход за кожей 35+, макияж который молодит' },
  { emoji: '💪', title: 'Здоровье и энергия', desc: 'Питание, движение, как выглядеть и чувствовать себя лучше' },
  { emoji: '🧠', title: 'Уверенность', desc: 'Психология стиля, найди себя, истории трансформации' },
  { emoji: '🛒', title: 'Шопинг без ошибок', desc: 'Как выбирать вещи, на что смотреть, где покупать' },
  { emoji: '💼', title: 'Образы для жизни', desc: 'Работа, встречи, отдых — образ для каждого случая' },
]

const REVIEWS = [
  { text: 'Я всегда думала что стиль — это не для меня. После первого урока поняла что просто не знала правил', author: 'Айгерим', age: 42, city: 'Алматы' },
  { text: 'Наконец-то перестала покупать вещи которые висят в шкафу. Гардероб стал меньше, а образов больше', author: 'Дина', age: 38, city: 'Астана' },
  { text: 'VIP тариф — лучшее что я сделала для себя. Стилист помогла собрать образы под мою жизнь', author: 'Салтанат', age: 45, city: 'Шымкент' },
]

const FAQ_ITEMS = [
  { q: 'Подходит ли Академия если я никогда не занималась стилем?', a: 'Да, начинаем с нуля. Первые уроки для любого уровня.' },
  { q: 'Когда открывается доступ?', a: 'В течение 24 часов после оплаты.' },
  { q: 'Есть ли срок у доступа?', a: 'Доступ навсегда на выбранный тариф.' },
  { q: 'Можно ли перейти на другой тариф?', a: 'Да, доплатив разницу. Напишите нам.' },
  { q: 'Как проходят сессии на VIP?', a: 'Онлайн через Zoom или WhatsApp, в удобное для вас время.' },
]

function AccessModal({ open, onClose, tariff, user, userProfile, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSuccess(false)
      setError('')
    }
  }, [open])

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('academy_orders').insert({
        user_id: user.id,
        user_name: userProfile?.name || '',
        user_email: userProfile?.email || user.email,
        user_phone: userProfile?.phone || '',
        tariff: tariff.key,
        tariff_name: tariff.name,
        tariff_price: tariff.price,
        status: 'pending',
      })
      if (insertError) throw insertError
      setSuccess(true)
    } catch {
      setError('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (success) onSuccess()
    else onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <h3 className="text-lg font-medium text-[#1a1a18]">
            {success ? 'Заявка отправлена!' : `Заявка на ${tariff?.name}`}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 flex-shrink-0 rounded-lg border border-[#f0ede8] flex items-center justify-center text-[#888780] hover:text-[#1a1a18] transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-sm text-[#888780] leading-relaxed">
              Заявка отправлена! Мы свяжемся с вами в ближайшее время.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full bg-[#1a1a18] text-white py-3 rounded-xl text-sm font-medium"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#f9f7f4] rounded-xl p-4 mb-5">
              <p className="text-xs text-[#888780] mb-3 font-medium">Ваши данные</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888780]">Имя</span>
                  <span className="font-medium text-[#1a1a18]">{userProfile?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888780]">Email</span>
                  <span className="font-medium text-[#1a1a18]">{userProfile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888780]">Телефон</span>
                  <span className="font-medium text-[#1a1a18]">{userProfile?.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888780]">Тариф</span>
                  <span className="font-medium text-[#1a1a18]">{tariff?.name} — {tariff?.priceLabel}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#888780] mb-5 leading-relaxed">
              Мы свяжемся с вами в течение 24 часов и выставим счёт.
            </p>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#D4537E] text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-60 hover:bg-[#c44370] transition-colors"
            >
              {loading ? 'Отправляем...' : 'Отправить заявку'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ContentCard({ item }) {
  const gradient = TYPE_GRADIENT[item.type] || TYPE_GRADIENT.link
  const label = TYPE_LABEL[item.type] || item.type
  const Icon = TYPE_ICON[item.type] || ExternalLink

  let btnClass = 'w-full rounded-xl py-2.5 text-sm font-medium transition-colors'
  let btnLabel = 'Открыть →'

  if (item.type === 'video') {
    btnClass += ' bg-[#D4537E] text-white hover:bg-[#c44370]'
    btnLabel = '▶ Смотреть'
  } else if (item.type === 'article') {
    btnClass += ' bg-[#1a1a18] text-white hover:bg-gray-800'
    btnLabel = 'Читать →'
  } else if (item.type === 'guide') {
    btnClass += ' bg-[#059669] text-white hover:bg-[#047857]'
    btnLabel = 'Скачать →'
  } else {
    btnClass += ' border border-[#f0ede8] text-[#1a1a18] hover:border-[#1a1a18]'
    btnLabel = 'Открыть →'
  }

  return (
    <div className="border border-[#f0ede8] rounded-2xl overflow-hidden bg-white">
      <div className="relative h-44 overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <Icon size={32} className="text-white opacity-80" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-black/40 text-white text-xs rounded-full px-2 py-0.5">
          {label}
        </span>
        {item.topic && (
          <span className="absolute top-3 right-3 bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
            {item.topic}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-medium text-sm text-[#1a1a18] mb-1">{item.title}</p>
        {item.description && (
          <p className="text-xs text-[#888780] line-clamp-2 mb-3">{item.description}</p>
        )}
        {item.duration_minutes > 0 && (
          <p className="text-xs text-[#888780] mb-3">⏱ {item.duration_minutes} мин</p>
        )}
        {item.content_url && (
          <button
            type="button"
            onClick={() => window.open(item.content_url, '_blank')}
            className={btnClass}
          >
            {btnLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AcademyPage() {
  const user = useAuthStore((state) => state.user)
  const [accessStatus, setAccessStatus] = useState(null)
  const [userOrder, setUserOrder] = useState(null)
  const [content, setContent] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [academyError, setAcademyError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (user) {
      loadProfile()
      checkAccess()
    } else {
      setAccessStatus('none')
    }
  }, [user])

  async function loadProfile() {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      setUserProfile({
        name: profile?.full_name || user.user_metadata?.full_name || '',
        phone: profile?.phone || user.user_metadata?.phone || '',
        email: user.email,
        avatar: profile?.avatar_url || null,
      })
    } catch {
      setUserProfile({
        name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        email: user.email,
        avatar: null,
      })
    }
  }

  async function checkAccess() {
    setAcademyError('')
    try {
      const { data, error } = await supabase
        .from('academy_orders')
        .select('status, tariff, tariff_name, activated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setAccessStatus('none')
      } else {
        setAccessStatus(data.status)
        setUserOrder(data)
        if (data.status === 'active') loadContent(data.tariff)
      }
    } catch {
      setAcademyError('Не удалось загрузить информацию о доступе')
      setAccessStatus('none')
    }
  }

  async function loadContent(tariff) {
    const t = tariff || userOrder?.tariff
    const levels =
      t === 'vip' || t === 'premium'
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
    } catch {
      setAcademyError('Не удалось загрузить материалы академии')
    }
  }

  function handleTariffClick(tariff) {
    if (!user) {
      window.location.href = '/#access'
      return
    }
    setSelectedTariff(tariff)
    setModalOpen(true)
  }

  function handleModalSuccess() {
    setModalOpen(false)
    setAccessStatus('pending')
  }

  // Loading
  if (accessStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1a1a18] border-t-transparent animate-spin" />
      </div>
    )
  }

  // Pending
  if (accessStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 pb-32 md:pb-20">
        <div className="w-20 h-20 rounded-full bg-[#FAEEDA] flex items-center justify-center mb-6 text-4xl">
          ⏳
        </div>
        <h2 className="text-2xl font-medium text-[#1a1a18] mb-3">Заявка на рассмотрении</h2>
        <p className="text-[#888780] max-w-sm leading-relaxed mb-4">
          Мы свяжемся с вами в ближайшее время и выставим счёт для активации доступа.
        </p>
        <div className="bg-[#f9f7f4] rounded-xl px-6 py-4 text-sm text-[#888780]">
          Есть вопросы? Напишите нам в WhatsApp
        </div>
      </div>
    )
  }

  // Dashboard
  if (accessStatus === 'active') {
    const filtered =
      activeFilter === 'all'
        ? content
        : content.filter((c) => {
            if (activeFilter === 'link') return c.type === 'link' || c.type === 'telegram'
            return c.type === activeFilter
          })

    return (
      <div className="min-h-screen bg-[#faf9f7] pb-28 md:pb-8">
        {academyError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {academyError}
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Gradient banner */}
	          <div
	            className="rounded-2xl p-6 mb-6 text-white"
	            style={{ background: 'linear-gradient(135deg, #D4537E 0%, #9B4F8E 100%)' }}
	          >
	            <div className="flex items-center gap-4">
	              {userProfile?.avatar ? (
	                <img
	                  src={userProfile.avatar}
	                  className="w-14 h-14 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
	                />
	              ) : (
	                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
	                  {userProfile?.name?.[0]?.toUpperCase() || '?'}
	                </div>
	              )}

	              <div className="min-w-0">
	                <p className="text-xs opacity-60 text-white">Академия Capriccio</p>
	                <h2 className="text-2xl font-medium text-white">
	                  Привет, {userProfile?.name || 'подруга'}! 👋
	                </h2>
	                <p className="text-sm opacity-70 text-white">{userOrder?.tariff_name}</p>
	              </div>
	            </div>
	          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 [&::-webkit-scrollbar]:hidden">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-[#1a1a18] text-white'
                    : 'border border-[#f0ede8] text-[#888780] hover:border-[#1a1a18] hover:text-[#1a1a18]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#888780]">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-sm">Материалы скоро появятся</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Landing (none / cancelled)
  return (
    <div className="bg-white pb-24 md:pb-0">

      {/* Block 1: Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-16 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block rounded-full bg-[#FBEAF0] text-[#D4537E] text-xs px-4 py-1.5 mb-6">
              Академия стиля · Казахстан
            </span>
            <h1 className="text-5xl md:text-7xl font-medium text-[#1a1a18] leading-tight mb-6">
              Стань лучшей версией себя
            </h1>
            <p className="text-lg text-[#888780] max-w-lg leading-relaxed mb-8">
              Первая онлайн-школа стиля для женщин 35+ в Казахстане. Уроки, разборы и поддержка которые реально меняют то, как ты выглядишь и чувствуешь себя каждый день
            </p>
            <button
              type="button"
              onClick={() => handleTariffClick(TARIFFS[1])}
              className="inline-flex items-center justify-center rounded-xl bg-[#D4537E] text-white px-8 py-4 text-base font-medium hover:bg-[#c44370] transition-colors"
            >
              Начать обучение →
            </button>
            <p className="mt-3 text-sm text-[#888780]">500+ участниц · Казахстан и СНГ</p>
          </div>
          <div className="rounded-3xl overflow-hidden aspect-[4/5] order-first md:order-last">
            <img src={HERO_IMAGE} alt="Академия стиля" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Block 2: Pains */}
      <section className="bg-[#f9f7f4] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] mb-10">Узнаёшь себя?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PAINS.map((p) => (
              <div key={p.title} className="border border-[#f0ede8] rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="font-medium text-[#1a1a18] text-sm mb-2">{p.title}</h3>
                <p className="text-xs text-[#888780] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 3: What is Academy */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] mb-6">
                Capriccio Academy — это система
              </h2>
              <p className="text-lg text-[#888780] leading-relaxed">
                Не просто курсы. Это система которая помогает женщине 35+ выстроить свой стиль раз и навсегда. Без хаоса, без лишних трат, без комплексов
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '15+', label: 'уроков' },
                { num: '6', label: 'тем' },
                { num: '500+', label: 'участниц' },
                { num: '3', label: 'страны' },
              ].map((s) => (
                <div key={s.label} className="bg-[#f9f7f4] rounded-2xl p-6 text-center">
                  <p className="text-4xl font-medium text-[#1a1a18] mb-1">{s.num}</p>
                  <p className="text-sm text-[#888780]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Block 4: Topics */}
      <section className="bg-[#f9f7f4] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] mb-10">Что тебя ждёт</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TOPICS.map((t) => (
              <div key={t.title} className="border border-[#f0ede8] rounded-2xl p-5 bg-white">
                <div className="text-2xl mb-3">{t.emoji}</div>
                <h3 className="font-medium text-[#1a1a18] text-sm mb-1.5">{t.title}</h3>
                <p className="text-xs text-[#888780] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 5: Tariffs */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] text-center mb-12">
            Выбери свой формат
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {TARIFFS.map((t) => (
              <div
                key={t.key}
                className={`relative border rounded-2xl p-6 ${t.popular ? 'border-[#D4537E]' : 'border-[#f0ede8]'}`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4537E] text-white text-xs px-4 py-1 rounded-full font-medium whitespace-nowrap">
                    🔥 Популярный
                  </span>
                )}
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-medium text-lg text-[#1a1a18] mb-1">{t.name}</h3>
                <div className="mb-1">
                  <span className="text-2xl font-medium text-[#1a1a18]">{t.priceLabel}</span>
                  {t.priceSuffix && <span className="text-sm text-[#888780]">{t.priceSuffix}</span>}
                </div>
                <p className="text-sm text-[#888780] mb-5">{t.desc}</p>
                <ul className="flex flex-col gap-2 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a18]">
                      <span className="text-[#D4537E] flex-shrink-0 mt-px">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleTariffClick(t)}
                  className={t.btnClass}
                >
                  {t.btnLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 6: Reviews */}
      <section className="bg-[#f9f7f4] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] mb-10">Что говорят участницы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.author} className="bg-white border border-[#f0ede8] rounded-2xl p-6">
                <p className="text-sm text-[#1a1a18] leading-relaxed mb-4">«{r.text}»</p>
                <p className="text-sm font-medium text-[#1a1a18]">{r.author}, {r.age} лет, {r.city}</p>
                <p className="text-xs text-[#D4537E] mt-1">⭐⭐⭐⭐⭐</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 7: FAQ */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a18] mb-10">Частые вопросы</h2>
          <div className="divide-y divide-[#f0ede8]">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-medium text-[#1a1a18] text-sm">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-[#888780] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-sm text-[#888780] leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Block 8: Final CTA */}
      <section className="bg-[#1a1a18] py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">Готова начать?</h2>
        <p className="text-[#888780] mb-8 max-w-md mx-auto leading-relaxed">
          Присоединяйся к 500+ женщинам которые уже изменили свой стиль
        </p>
        <button
          type="button"
          onClick={() => handleTariffClick(TARIFFS[1])}
          className="inline-flex items-center justify-center rounded-xl bg-[#D4537E] text-white px-8 py-4 text-base font-medium hover:bg-[#c44370] transition-colors"
        >
          Начать обучение →
        </button>
      </section>

      {user && selectedTariff && (
        <AccessModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tariff={selectedTariff}
          user={user}
          userProfile={userProfile}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
