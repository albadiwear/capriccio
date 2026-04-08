import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useSEO } from '../hooks/useSEO'

const SYS = "-apple-system, 'Helvetica Neue', sans-serif"

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
    <div className="flex-shrink-0 w-[180px] lg:w-auto animate-pulse">
      <div className="w-full rounded-md" style={{ aspectRatio: '3/4', background: '#f0f0f0' }} />
      <div className="mt-2 h-3 w-3/4 rounded" style={{ background: '#f0f0f0' }} />
      <div className="mt-1.5 h-3 w-1/2 rounded" style={{ background: '#f0f0f0' }} />
      <div className="mt-3 h-9 w-full rounded" style={{ background: '#f0f0f0' }} />
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
    <div style={{ fontFamily: SYS, background: '#ffffff', color: '#111111' }}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[100svh]" style={{ background: '#111111' }}>

        {/* Баннеры */}
        {bannersLoading ? (
          <div className="absolute inset-0 animate-pulse" style={{ background: '#1a1a1a' }} />
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
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Контент */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5 pb-24 sm:pb-28"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
        >
          <div className="mx-auto max-w-7xl">
            <p
              className="mb-4"
              style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: SYS }}
            >
              Весна — Лето 2026
            </p>

            <h1
              className="mb-6 text-4xl sm:text-6xl md:text-8xl"
              style={{ fontFamily: SYS, fontWeight: 300, lineHeight: 1.05, color: '#ffffff' }}
            >
              {banners[activeBanner]?.title || (
                <>Для тех,<br />кто знает<br />себе цену</>
              )}
            </h1>

            <Link
              to={banners[activeBanner]?.button_url || '/catalog'}
              className="inline-flex items-center gap-3"
              style={{
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#ffffff',
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '13px 22px',
                textDecoration: 'none',
                fontFamily: SYS,
                fontWeight: 400,
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#111111' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff' }}
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
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNextBanner}
              aria-label="Следующий баннер"
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white"
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
                style={{
                  width: i === activeBanner ? '24px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === activeBanner ? 'white' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── КАТЕГОРИИ ─────────────────────────────────────── */}
      <section style={{ padding: '16px 16px' }}>
        <div className="mx-auto max-w-7xl">
          {/* Мобайл */}
          <div className="lg:hidden">
            <Link
              to={categories[0].to}
              className="group relative mb-2 block overflow-hidden"
              style={{ aspectRatio: '16/7', borderRadius: '4px' }}
            >
              <img
                src={categories[0].image}
                alt={categories[0].name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}>
                <span style={{ fontFamily: SYS, fontSize: '22px', fontWeight: 400, color: 'white' }}>
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
                  style={{ aspectRatio: '3/4', borderRadius: '4px' }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end p-2.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}>
                    <span style={{ fontFamily: SYS, fontSize: '14px', fontWeight: 400, color: 'white' }}>
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Десктоп */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.to}
                className="group relative block overflow-hidden"
                style={{ aspectRatio: '3/4', borderRadius: '4px' }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}>
                  <span style={{ fontFamily: SYS, fontSize: '22px', fontWeight: 400, color: 'white' }}>
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── НОВИНКИ ───────────────────────────────────────── */}
      <section style={{ padding: '24px 0 8px' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between px-4 mb-5">
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888888', marginBottom: '4px', fontFamily: SYS }}>
                Новая коллекция
              </p>
              <h2 style={{ fontFamily: SYS, fontSize: '28px', fontWeight: 300, lineHeight: 1, color: '#111111', margin: 0 }}>
                Новинки
              </h2>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-1"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#111111', textDecoration: 'none', fontFamily: SYS }}
            >
              Смотреть всё
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Мобайл: горизонтальный скролл */}
          <div className="lg:hidden">
            <div
              className="flex gap-3 overflow-x-auto pb-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {loading
                ? [1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)
                : products.map((product) => (
                    <div key={product.id} className="flex-shrink-0 snap-start" style={{ width: '180px' }}>
                      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: '4px', background: '#f5f5f5' }}>
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
                            style={{ fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', background: '#111111', color: '#ffffff' }}
                          >
                            {product.badges[0].toUpperCase()}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="В избранное"
                          className="absolute right-2 top-2 flex items-center justify-center"
                          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer' }}
                        >
                          <Heart className="h-3.5 w-3.5" style={{ stroke: '#111111' }} />
                        </button>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: '#111111', lineHeight: 1.4, fontFamily: SYS }}>{product.name}</p>
                      <div className="mt-1">
                        {product.sale_price ? (
                          <span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#111111', fontFamily: SYS }}>{Number(product.sale_price).toLocaleString('ru-RU')} ₸</span>
                            <span style={{ fontSize: '10px', color: '#bbbbbb', textDecoration: 'line-through', marginLeft: '5px', fontFamily: SYS }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#111111', fontFamily: SYS }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                        )}
                      </div>
                      {product.rating && (
                        <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px', fontFamily: SYS }}>
                          ★ {product.rating} · {product.reviews_count || 0} отзывов
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="mt-2.5 w-full text-white transition-colors"
                        style={{ height: '38px', background: '#111111', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: SYS }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#333333' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#111111' }}
                      >
                        В корзину
                      </button>
                    </div>
                  ))}
            </div>
          </div>

          {/* Десктоп: сетка */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-5 px-4">
            {loading
              ? [1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)
              : products.map((product) => (
                  <div key={product.id} className="group">
                    <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: '4px', background: '#f5f5f5' }}>
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
                          style={{ fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', background: '#111111', color: '#ffffff' }}
                        >
                          {product.badges[0].toUpperCase()}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="В избранное"
                        className="absolute right-3 top-3 flex items-center justify-center"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer' }}
                      >
                        <Heart className="h-4 w-4" style={{ stroke: '#111111' }} />
                      </button>
                    </div>
                    <p className="mt-3 text-sm" style={{ color: '#111111', lineHeight: 1.4, fontFamily: SYS }}>{product.name}</p>
                    <div className="mt-1.5">
                      {product.sale_price ? (
                        <span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111', fontFamily: SYS }}>{Number(product.sale_price).toLocaleString('ru-RU')} ₸</span>
                          <span style={{ fontSize: '11px', color: '#bbbbbb', textDecoration: 'line-through', marginLeft: '6px', fontFamily: SYS }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111', fontFamily: SYS }}>{Number(product.price).toLocaleString('ru-RU')} ₸</span>
                      )}
                    </div>
                    {product.rating && (
                      <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px', fontFamily: SYS }}>
                        ★ {product.rating} · {product.reviews_count || 0} отзывов
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => addItem(product)}
                      className="mt-4 w-full text-white transition-colors"
                      style={{ height: '42px', background: '#111111', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: SYS }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#333333' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#111111' }}
                    >
                      В корзину
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── НЕДАВНО СМОТРЕЛИ ──────────────────────────────── */}
      {!loading && products.length > 0 && (
        <section style={{ padding: '16px 0 24px' }}>
          <div className="mx-auto max-w-7xl">
            <div style={{ padding: '0 16px 10px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888888', fontFamily: SYS }}>
              Недавно смотрели
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
              {products.slice(0, 4).map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                  <div style={{ width: '70px', height: '88px', borderRadius: '6px', background: '#f5f5f5', overflow: 'hidden' }}>
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: '10px', color: '#555555', marginTop: '4px', fontFamily: SYS }}>
                    {Number(product.price).toLocaleString('ru-RU')} ₸
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── АКАДЕМИЯ СТИЛЯ ────────────────────────────────── */}
      <section style={{ padding: '0 16px 32px' }}>
        <div
          className="relative mx-auto max-w-7xl overflow-hidden text-center"
          style={{ background: '#111111', padding: '48px 24px' }}
        >
          <div className="relative" style={{ zIndex: 1 }}>
            {/* Тег */}
            <div
              className="mb-5 flex items-center justify-center gap-3"
              style={{ fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: SYS }}
            >
              <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.15)', display: 'block' }} />
              Академия стиля
              <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.15)', display: 'block' }} />
            </div>

            {/* Заголовок */}
            <h2
              className="mx-auto mb-4 max-w-lg text-3xl sm:text-5xl"
              style={{ fontFamily: SYS, fontWeight: 300, color: '#ffffff', lineHeight: 1.2, margin: '0 auto 16px' }}
            >
              Стань частью сообщества модных, успешных женщин, знающих себе цену
            </h2>

            <p className="mx-auto mb-8 max-w-sm" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontFamily: SYS, maxWidth: '320px', margin: '0 auto 28px' }}>
              Мастер-классы, разборы гардероба, образы и уроки стиля — всё в одном месте
            </p>

            {/* Перки */}
            <div
              className="mx-auto mb-8 grid grid-cols-2 gap-3 text-left"
              style={{ maxWidth: '260px', marginBottom: '28px' }}
            >
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: SYS }}>{perk}</span>
                </div>
              ))}
            </div>

            {/* Кнопка Telegram */}
            <a
              href="https://t.me/capriccio_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex items-center justify-center gap-2.5"
              style={{
                maxWidth: '260px',
                background: '#ffffff',
                color: '#111111',
                fontFamily: SYS,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '14px 24px',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              Вступить в Telegram
            </a>

            <p className="mt-4" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', fontFamily: SYS }}>
              Доступ от 3 000 ₸ / месяц
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
