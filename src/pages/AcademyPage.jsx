import { useEffect, useState } from 'react'
import { Heart, Shirt, Sparkles, Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80'

const TYPE_LABEL = {
  video: '🎥 Видео',
  article: '📖 Статья',
  guide: '📋 Гайд',
  telegram: '✈️ Telegram',
  link: '🔗 Ссылка',
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
  { key: 'video', label: 'Видео' },
  { key: 'article', label: 'Статьи' },
  { key: 'guide', label: 'Гайды' },
  { key: 'link', label: 'Ресурсы' },
]

const DIRECTIONS = [
  { title: 'Стиль и гардероб', icon: Shirt, bg: 'bg-[#FBEAF0]', color: 'text-[#72243E]', iconColor: '#72243E', desc: 'Капсульный гардероб, цветотип, образы для любого случая' },
  { title: 'Красота и уход', icon: Sparkles, bg: 'bg-[#E1F5EE]', color: 'text-[#085041]', iconColor: '#085041', desc: 'Уход за кожей 35+, макияж который молодит' },
  { title: 'Здоровье и энергия', icon: Heart, bg: 'bg-[#EEEDFE]', color: 'text-[#3C3489]', iconColor: '#3C3489', desc: 'Питание, движение, сон — как выглядеть лучше' },
  { title: 'Уверенность', icon: Star, bg: 'bg-[#FAEEDA]', color: 'text-[#633806]', iconColor: '#633806', desc: 'Психология стиля, найди себя' },
]

function AccessModal({ open, onClose, user, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('academy_orders').insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || '',
        user_email: user.email,
        user_phone: user.user_metadata?.phone || '',
        tariff: 'basic',
        tariff_name: 'Базовый',
        tariff_price: 0,
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
    setSuccess(false)
    setError('')
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
            {success ? 'Заявка отправлена!' : 'Запрос на доступ в Академию'}
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
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-sm text-[#888780] leading-relaxed">
              Мы уведомим вас когда доступ будет открыт.
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
            <div className="bg-[#f5f2ed] rounded-xl p-4 mb-5">
              <p className="text-xs text-[#888780] mb-3 font-medium">Ваши данные</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888780]">Имя</span>
                  <span className="font-medium text-[#1a1a18]">{user?.user_metadata?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888780]">Email</span>
                  <span className="font-medium text-[#1a1a18]">{user?.email}</span>
                </div>
                {user?.user_metadata?.phone && (
                  <div className="flex justify-between">
                    <span className="text-[#888780]">Телефон</span>
                    <span className="font-medium text-[#1a1a18]">{user.user_metadata.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-[#888780] mb-5 leading-relaxed">
              Мы рассмотрим заявку и откроем доступ в течение 24 часов.
            </p>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#D4537E] text-white py-3.5 rounded-xl text-sm font-medium disabled:opacity-60 hover:bg-[#c44370] transition-colors"
            >
              {loading ? 'Отправляем...' : 'Подтвердить'}
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

  let btnClass = 'block w-full mt-3 py-2.5 rounded-xl text-xs font-medium text-center transition-colors'
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
      <div className="relative h-48 overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: gradient }} />
        )}
        <span className="absolute top-3 left-3 bg-black/40 text-white rounded-full px-3 py-1 text-xs">
          {label}
        </span>
        {item.topic && (
          <span className="absolute top-3 right-3 bg-white/20 text-white rounded-full px-3 py-1 text-xs">
            {item.topic}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-medium text-[#1a1a18] text-sm">{item.title}</p>
        {item.description && (
          <p className="text-sm text-[#888780] mt-1 line-clamp-2">{item.description}</p>
        )}
        {item.duration_minutes > 0 && (
          <p className="text-xs text-[#888780] mt-1.5">⏱ {item.duration_minutes} мин</p>
        )}
        {item.content_url && (
          <a
            href={item.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            {btnLabel}
          </a>
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

  useEffect(() => {
    if (user) {
      checkAccess()
    } else {
      setAccessStatus('none')
    }
  }, [user])

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
        if (data.status === 'active') {
          loadContent(data.tariff)
        }
      }
    } catch {
      setAcademyError('Не удалось загрузить информацию о доступе')
      setAccessStatus('none')
    }
  }

  async function loadContent(tariff) {
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
    } catch {
      setAcademyError('Не удалось загрузить материалы академии')
    }
  }

  function handleAccessClick() {
    if (!user) {
      window.location.href = '/#access'
      return
    }
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
        <h2 className="text-2xl font-medium mb-3">Заявка на рассмотрении</h2>
        <p className="text-[#888780] max-w-sm leading-relaxed mb-4">
          Ваша заявка получена. Мы активируем доступ в течение 24 часов и отправим уведомление на email.
        </p>
        <div className="bg-[#f5f2ed] rounded-xl px-6 py-4 text-sm text-[#888780]">
          Если есть вопросы — напишите нам в WhatsApp
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

        {/* Gradient header */}
        <div
          className="px-6 py-8"
          style={{ background: 'linear-gradient(135deg, #D4537E 0%, #9B4F8E 50%, #5B4FCF 100%)' }}
        >
          <p className="text-white/60 text-xs mb-1">Академия стиля Capriccio</p>
          <h2 className="text-2xl font-medium text-white">
            Привет, {user?.user_metadata?.full_name?.split(' ')[0] || 'подруга'}! 👋
          </h2>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-[#1a1a18] text-white'
                    : 'border border-[#f0ede8] text-[#888780] hover:border-[#1a1a18] hover:text-[#1a1a18]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#888780]">
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
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-16 py-20 overflow-hidden">
        <img src={HERO_IMAGE} className="absolute inset-0 w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-[#1a1a18]/60" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-white text-4xl md:text-6xl font-medium leading-tight">
            Академия стиля Capriccio
          </h1>
          <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed max-w-xl">
            Уроки, гайды и вдохновение для женщин которые хотят выглядеть лучше каждый день
          </p>
          <button
            type="button"
            onClick={handleAccessClick}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#D4537E] text-white px-8 py-4 text-base font-medium hover:bg-[#c44370] transition-colors"
          >
            Получить доступ →
          </button>
        </div>
      </section>

      {/* Directions */}
      <section className="px-6 py-14 max-w-6xl mx-auto">
        <h2 className="text-2xl font-medium text-[#1a1a18] mb-8">Всё для твоего преображения</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DIRECTIONS.map((dir) => {
            const Icon = dir.icon
            return (
              <div key={dir.title} className={`rounded-2xl p-5 md:p-6 ${dir.bg}`}>
                <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center mb-4">
                  <Icon size={20} style={{ color: dir.iconColor }} />
                </div>
                <h3 className={`font-medium text-sm mb-2 ${dir.color}`}>{dir.title}</h3>
                <p className={`hidden md:block text-xs leading-relaxed opacity-80 ${dir.color}`}>
                  {dir.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a1a18] py-20 px-6 text-center">
        <h2 className="text-3xl font-medium text-white mb-8">Готова начать?</h2>
        <button
          type="button"
          onClick={handleAccessClick}
          className="inline-flex items-center justify-center rounded-xl bg-[#D4537E] text-white px-8 py-4 text-base font-medium hover:bg-[#c44370] transition-colors"
        >
          Получить доступ →
        </button>
      </section>

      {user && (
        <AccessModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={user}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
