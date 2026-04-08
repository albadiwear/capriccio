import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useSEO } from '../hooks/useSEO'

const categories = [
  { name: 'Пуховики', to: '/catalog/puhoviki', image: '/cat-puhovik.jpg' },
  { name: 'Костюмы', to: '/catalog/kostyumy', image: '/cat-suit.png' },
  { name: 'Трикотаж', to: '/catalog/trikotazh', image: '/cat-trikotazh.jpg' },
  { name: 'Обувь', to: '/catalog/obuv', image: '/cat-shoes.png' },
]

const PERKS = [
  'Уроки стиля',
  'Разборы гардероба',
  'Сообщество Telegram',
  'Обзоры трендов',
]

function ProductSkeleton() {
  return (
    <div className="flex-shrink-0 w-[200px] lg:w-auto animate-pulse">
      <div className="aspect-[3/4] w-full rounded-sm bg-[#e8e0d8]" />
      <div className="mt-3 h-3 w-3/4 rounded bg-[#e8e0d8]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[#e8e0d8]" />
      <div className="mt-4 h-10 w-full rounded-sm bg-[#e8e0d8]" />
    </div>
  )
}

export default function HomePage() {
  useSEO({
    title: 'Женская одежда премиум',
    description: 'Capriccio — премиальная женская одежда. Пуховики, костюмы, трикотаж. Доставка по Казахстану и СНГ.',
    url: '/',
  })

  const addItem = useCartStore((state) => state.addItem)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState([])
  const [bannersLoading, setBannersLoading] = useState(true)
  const [activeBanner, setActiveBanner] = useState(0)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4)
      if (!error && data) setProducts(data)
      setLoading(false)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    const loadBanners = async () => {
      setBannersLoading(true)
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('position')
      setBanners(data || [])
      setBannersLoading(false)
    }
    loadBanners()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return undefined
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [banners.length])

  useEffect(() => {
    if (activeBanner >= banners.length && banners.length > 0) {
      setActiveBanner(0)
    }
  }, [activeBanner, banners.length])

  const goToPreviousBanner = () => {
    setActiveBanner((current) => (current - 1 + banners.length) % banners.length)
  }

  const goToNextBanner = () => {
    setActiveBanner((current) => (current + 1) % banners.length)
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: '#faf8f4', color: '#1a1714' }}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[100svh]" style={{ background: '#1a1714' }}>

        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(184,151,90,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(140,123,107,0.12) 0%, transparent 45%)' }} />

        {/* Баннеры */}
        {bannersLoading ? (
          <div className="absolute inset-0 animate-pulse" style={{ background: '#1a1714' }} />
        ) : banners.length > 0 ? (
          <div className="absolute inset-0">
            {banners.map((banner, index) => {
              const isActive = index === activeBanner
              const mediaUrl = banner.image_url || banner.media_url || banner.desktop_image
              const isVideo = banner.type === 'video' || banner.media_type === 'video'
              return (
                <div
                  key={banner.id}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  {isVideo ? (
                    <video src={mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img
                      src={mediaUrl || 'https://picsum.photos/seed/fashion-hero/1920/1080'}
                      alt={banner.title || 'Capriccio'}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0" style={{ background: 'rgba(26,23,20,0.45)' }} />
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Контент */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-24 sm:pb-28"
          style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.85) 0%, rgba(26,23,20,0.3) 60%, transparent 100%)' }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3" style={{ fontSize: '9px', letterSpacing: '0.45em', textTransform: 'uppercase', color: '#b8975a' }}>
              <span className="block" style={{ width: '24px', height: '1px', background: '#b8975a' }} />
              Весна — Лето 2026
            </div>

            <h1
              className="mb-6 text-4xl sm:text-6xl md:text-8xl"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.05, color: '#f5f0e8' }}
            >
              {banners[activeBanner]?.title || (
                <>
                  Для тех,<br />
                  кто знает<br />
                  <em style={{ fontStyle: 'italic', color: '#ecddd0' }}>себе цену</em>
                </>
              )}
            </h1>

            <Link
              to={banners[activeBanner]?.button_url || '/catalog'}
              className="inline-flex items-center gap-3 transition-colors"
              style={{
                border: '1px solid rgba(184,151,90,0.6)',
                color: '#b8975a',
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                padding: '13px 22px',
                textDecoration: 'none',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#b8975a'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b8975a' }}
            >
              {banners[activeBanner]?.button_text || 'Смотреть коллекцию'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Стрелки */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPreviousBanner}
              aria-label="Предыдущий баннер"
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNextBanner}
              aria-label="Следующий баннер"
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Точки */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveBanner(i)}
                aria-label={`Баннер ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === activeBanner ? '24px' : '6px',
                  height: '6px',
                  background: i === activeBanner ? 'white' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── КАТЕГОРИИ ─────────────────────────────────────── */}
      <section className="px-4 py-6">
        <div className="mx-auto max-w-7xl">
          {/* Мобайл: первая карточка шире, остальные 3 в ряд */}
          <div className="lg:hidden">
            <Link
              to={categories[0].to}
              className="group relative mb-2 block overflow-hidden"
              style={{ aspectRatio: '16/7', borderRadius: '2px' }}
            >
              <img
                src={categories[0].image}
                alt={categories[0].name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end p-4" style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.65) 0%, transparent 55%)' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 400, fontStyle: 'italic', color: 'white' }}>
                  {categories[0].name}
                </span>
              </div>
            </Link>
            <div className="grid grid-cols-3 gap-2">
              {categories.slice(1).map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.to}
                  className="group relative block overflow-hidden"
                  style={{ aspectRatio: '3/4', borderRadius: '2px' }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end p-3" style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.65) 0%, transparent 55%)' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 400, fontStyle: 'italic', color: 'white' }}>
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Десктоп: 4 в ряд */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.to}
                className="group relative block overflow-hidden"
                style={{ aspectRatio: '3/4', borderRadius: '2px' }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end p-5" style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.65) 0%, transparent 55%)' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 400, fontStyle: 'italic', color: 'white' }}>
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── НОВИНКИ ───────────────────────────────────────── */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between px-4 mb-6">
            <div>
              <p className="mb-1 uppercase tracking-[0.4em]" style={{ fontSize: '10px', color: '#8c7b6b' }}>
                Новая коллекция
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 300, lineHeight: 1, color: '#1a1714' }}>
                Новинки
              </h2>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 transition-colors"
              style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b8975a', textDecoration: 'none' }}
            >
              Смотреть всё
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Мобайл: горизонтальный скролл */}
          <div className="lg:hidden">
            <div
              className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {loading
                ? [1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)
                : products.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[200px] snap-start">
                      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: '2px', background: '#e8e0d8' }}>
                        <Link to={`/product/${product.id}`}>
                          <img
                            src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/533`}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </Link>
                        {product.badges?.[0] && (
                          <span
                            className="absolute left-2 top-2"
                            style={{
                              fontSize: '8px',
                              letterSpacing: '0.15em',
                              textTransform: 'uppercase',
                              padding: '3px 7px',
                              background: product.badges[0] === 'hit' ? 'rgba(184,151,90,0.9)' : 'rgba(250,248,244,0.92)',
                              color: product.badges[0] === 'hit' ? 'white' : '#1a1714',
                            }}
                          >
                            {product.badges[0].toUpperCase()}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="В избранное"
                          className="absolute right-2 top-2 flex items-center justify-center"
                          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(250,248,244,0.85)', border: 'none', cursor: 'pointer' }}
                        >
                          <Heart className="h-3.5 w-3.5 stroke-[#1a1714]" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-snug" style={{ color: '#1a1714', lineHeight: 1.4 }}>{product.name}</p>
                      <div className="mt-1">
                        {product.sale_price ? (
                          <span>
                            <span className="text-xs font-medium" style={{ color: '#b43c3c' }}>{Number(product.sale_price).toLocaleString('ru-RU')} ₸</span>
                            <span className="ml-1.5 text-[10px] line-through" style={{ color: '#8c7b6b' }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium">{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="mt-3 h-10 w-full text-[10px] uppercase tracking-widest text-white transition-colors"
                        style={{ background: '#1a1714', letterSpacing: '0.15em' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#b8975a' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1714' }}
                      >
                        В корзину
                      </button>
                    </div>
                  ))}
            </div>
          </div>

          {/* Десктоп: сетка */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6 px-4">
            {loading
              ? [1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)
              : products.map((product) => (
                  <div key={product.id} className="group">
                    <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: '2px', background: '#e8e0d8' }}>
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/533`}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      {product.badges?.[0] && (
                        <span
                          className="absolute left-3 top-3"
                          style={{
                            fontSize: '8px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            background: product.badges[0] === 'hit' ? 'rgba(184,151,90,0.9)' : 'rgba(250,248,244,0.92)',
                            color: product.badges[0] === 'hit' ? 'white' : '#1a1714',
                          }}
                        >
                          {product.badges[0].toUpperCase()}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="В избранное"
                        className="absolute right-3 top-3 flex items-center justify-center"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(250,248,244,0.85)', border: 'none', cursor: 'pointer' }}
                      >
                        <Heart className="h-4 w-4 stroke-[#1a1714]" />
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-snug" style={{ color: '#1a1714', lineHeight: 1.4 }}>{product.name}</p>
                    <div className="mt-1.5">
                      {product.sale_price ? (
                        <span>
                          <span className="text-sm font-medium" style={{ color: '#b43c3c' }}>{Number(product.sale_price).toLocaleString('ru-RU')} ₸</span>
                          <span className="ml-2 text-xs line-through" style={{ color: '#8c7b6b' }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                        </span>
                      ) : (
                        <span className="text-sm font-medium">{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(product)}
                      className="mt-4 h-11 w-full text-[10px] uppercase tracking-widest text-white transition-colors"
                      style={{ background: '#1a1714', letterSpacing: '0.15em' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#b8975a' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1714' }}
                    >
                      В корзину
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── ПРОМО ─────────────────────────────────────────── */}
      <section className="px-4 py-6">
        <div
          className="mx-auto max-w-7xl overflow-hidden"
          style={{ background: '#1a1714', display: 'grid', gridTemplateColumns: '1fr 1fr' }}
        >
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="mb-3 uppercase" style={{ fontSize: '8px', letterSpacing: '0.35em', color: '#b8975a' }}>
              Специальное предложение
            </p>
            <h2
              className="mb-4 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8', lineHeight: 1.15 }}
            >
              Новая<br />коллекция
            </h2>
            <p className="mb-6 text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.5)', maxWidth: '240px' }}>
              Актуальные силуэты и премиальные ткани для каждого дня.
            </p>
            <Link
              to="/catalog"
              className="inline-flex w-fit items-center gap-2 transition-colors"
              style={{ border: '1px solid rgba(184,151,90,0.5)', color: '#b8975a', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 16px', textDecoration: 'none', fontFamily: "'Jost', sans-serif" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#b8975a'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b8975a' }}
            >
              Смотреть
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div style={{ minHeight: '200px', overflow: 'hidden' }}>
            <img src="/banner-promo.png" alt="Коллекция Capriccio" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── АКАДЕМИЯ СТИЛЯ ────────────────────────────────── */}
      <section className="px-4 py-6 pb-12">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden px-6 py-14 sm:px-12 text-center"
          style={{ background: '#1a1714' }}
        >
          {/* Декоративная буква */}
          <div
            className="pointer-events-none select-none absolute -top-10 -left-5"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 'clamp(140px, 30vw, 220px)', fontWeight: 300, color: 'rgba(184,151,90,0.05)', lineHeight: 1 }}
          >
            C
          </div>

          <div className="relative z-10">
            {/* Тег */}
            <div className="mb-5 flex items-center justify-center gap-3" style={{ fontSize: '8px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#b8975a' }}>
              <span className="block" style={{ width: '20px', height: '1px', background: '#b8975a' }} />
              Академия стиля
              <span className="block" style={{ width: '20px', height: '1px', background: '#b8975a' }} />
            </div>

            {/* Заголовок */}
            <h2
              className="mx-auto mb-4 max-w-lg text-3xl sm:text-5xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#f5f0e8', lineHeight: 1.15 }}
            >
              Стань частью сообщества<br />
              <em style={{ fontStyle: 'italic', color: '#b8975a' }}>модных, успешных женщин,</em><br />
              знающих себе цену
            </h2>

            <p className="mx-auto mb-8 max-w-sm text-xs leading-loose" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: "'Jost', sans-serif" }}>
              Мастер-классы, разборы гардероба, образы и уроки стиля — всё в одном месте
            </p>

            {/* Перки */}
            <div className="mx-auto mb-8 grid max-w-xs grid-cols-2 gap-3 text-left">
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <span style={{ color: '#b8975a', fontSize: '12px', lineHeight: 1, flexShrink: 0 }}>✦</span>
                  <span className="text-xs" style={{ color: 'rgba(245,240,232,0.65)', fontFamily: "'Jost', sans-serif" }}>{perk}</span>
                </div>
              ))}
            </div>

            {/* Кнопка Telegram */}
            <a
              href="https://t.me/capriccio_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex max-w-xs items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
              style={{ background: '#b8975a', color: 'white', fontFamily: "'Jost', sans-serif", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '14px 24px', textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              Вступить в Telegram
            </a>

            <p className="mt-4 text-xs" style={{ color: 'rgba(245,240,232,0.3)', letterSpacing: '0.1em', fontFamily: "'Jost', sans-serif" }}>
              Доступ от <span style={{ color: '#b8975a' }}>3 000 ₸ / месяц</span>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
