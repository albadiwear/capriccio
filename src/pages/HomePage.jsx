import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Truck,
  RotateCcw,
  Shield,
  HeadphonesIcon,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'

const categories = [
  {
    name: 'Пуховики',
    to: '/catalog/puhoviki',
    image: 'https://picsum.photos/seed/puhoviki/400/500',
  },
  {
    name: 'Костюмы',
    to: '/catalog/kostyumy',
    image: 'https://picsum.photos/seed/kostyumy/400/500',
  },
  {
    name: 'Трикотаж',
    to: '/catalog/trikotazh',
    image: 'https://picsum.photos/seed/trikotazh/400/500',
  },
  {
    name: 'Обувь',
    to: '/catalog/obuv',
    image: 'https://picsum.photos/seed/obuv/400/500',
  },
]

const advantages = [
  {
    icon: Truck,
    title: 'Бесплатная доставка от 50 000 ₸',
  },
  {
    icon: RotateCcw,
    title: 'Возврат 14 дней',
  },
  {
    icon: Shield,
    title: 'Оригинальные бренды',
  },
  {
    icon: HeadphonesIcon,
    title: 'Поддержка 24/7',
  },
]

const reviews = [
  {
    text: 'Очень понравилось качество вещей и упаковка. Пуховик сел идеально, доставка в Алматы была быстрой.',
    author: 'Алина',
    city: 'Алматы',
  },
  {
    text: 'Заказывала трикотаж и костюм. Всё аккуратно пошито, ткань приятная, выглядит дорого и современно.',
    author: 'Динара',
    city: 'Астана',
  },
  {
    text: 'Capriccio приятно удивил сервисом. Помогли с размером, заказ пришёл вовремя, обязательно вернусь ещё.',
    author: 'Айгерим',
    city: 'Шымкент',
  },
]

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-lg bg-gray-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-9 w-full rounded bg-gray-200" />
    </div>
  )
}

export default function HomePage() {
  const addItem = useCartStore((state) => state.addItem)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState([])
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

      if (!error && data) {
        setProducts(data)
      }

      setLoading(false)
    }

    loadProducts()
  }, [])

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('position')

      setBanners(data || [])
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
    <div className="bg-white text-gray-900">
      <section className="relative min-h-[85vh] overflow-hidden">
        {banners.length > 0 ? (
          <>
            <div className="absolute inset-0">
              {banners.map((banner, index) => {
                const isActive = index === activeBanner
                const mediaUrl = banner.image_url || banner.media_url || banner.desktop_image
                const isVideo = banner.type === 'video' || banner.media_type === 'video'

                return (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={mediaUrl || 'https://picsum.photos/seed/fashion-hero/1920/1080'}
                        alt={banner.title || 'Capriccio banner'}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )
              })}
            </div>

            <div className="relative mx-auto flex min-h-[85vh] max-w-7xl items-center px-4 py-8 sm:px-6 md:py-16">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  {banners[activeBanner]?.subtitle || 'Новая коллекция 2026'}
                </p>
                <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
                  {banners[activeBanner]?.title || 'Пуховики, трикотаж и костюмы — с любовью из Capriccio'}
                </h1>
                <p className="mt-6 text-lg text-white/80">
                  {banners[activeBanner]?.description || 'Премиальная одежда для современных женщин'}
                </p>
                <Link
                  to={banners[activeBanner]?.button_url || '/catalog'}
                  className="mt-8 inline-flex h-12 items-center bg-white px-8 text-sm tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                >
                  {banners[activeBanner]?.button_text || 'Открыть каталог'}
                </Link>
              </div>
            </div>

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousBanner}
                  aria-label="Предыдущий баннер"
                  className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={goToNextBanner}
                  aria-label="Следующий баннер"
                  className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setActiveBanner(index)}
                      aria-label={`Перейти к баннеру ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeBanner ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <img
              src="https://picsum.photos/seed/fashion-hero/1920/1080"
              alt="Capriccio новая коллекция"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative mx-auto flex min-h-[85vh] max-w-7xl items-center px-4 py-8 sm:px-6 md:py-16">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                  Новая коллекция 2026
                </p>
                <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
                  Пуховики, трикотаж и костюмы — с любовью из Capriccio
                </h1>
                <p className="mt-6 text-lg text-white/80">
                  Премиальная одежда для современных женщин
                </p>
                <Link
                  to="/catalog"
                  className="mt-8 inline-flex h-12 items-center bg-white px-8 text-sm tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                >
                  Открыть каталог
                </Link>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Категории
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.to}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg font-medium text-white">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Хиты продаж
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500 md:text-base">
            Самые популярные товары этого сезона
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={product.images?.[0] || 'https://picsum.photos/seed/product-fallback/600/800'}
                        alt={product.name}
                        className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {product.badges?.[0] && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs uppercase tracking-wide text-white">
                          {product.badges[0]}
                        </span>
                      )}

                      <button
                        type="button"
                        aria-label="Добавить в избранное"
                        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-900 transition-colors hover:bg-white"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="mt-3 text-sm font-medium text-gray-900">{product.name}</h3>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {product.sale_price ? (
                        <>
                          <span className="font-semibold text-gray-900">
                            {Number(product.sale_price).toLocaleString('ru-RU')} ₸
                          </span>
                          <span className="text-gray-400 line-through">
                            {Number(product.price).toLocaleString('ru-RU')} ₸
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {Number(product.price).toLocaleString('ru-RU')} ₸
                        </span>
                      )}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className="mt-4 h-12 w-full bg-gray-900 text-xs text-white transition-colors hover:bg-gray-700"
                  >
                    В корзину
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-gray-900">
          <div className="grid grid-cols-1 items-center md:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Специальное предложение
              </p>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl md:text-5xl">
                Новая коллекция
              </h2>
              <p className="mt-4 max-w-md text-gray-400">
                Откройте для себя актуальные силуэты, премиальные ткани и вещи,
                которые легко впишутся в гардероб на каждый день.
              </p>
              <Link
                to="/catalog"
                className="mt-8 inline-flex h-12 items-center bg-white px-8 text-sm tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
              >
                Смотреть
              </Link>
            </div>

            <div className="h-full">
              <img
                src="https://picsum.photos/seed/banner-promo/600/400"
                alt="Новая коллекция Capriccio"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {advantages.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-6 w-6 text-gray-900" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-900">{item.title}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Отзывы наших клиентов
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={`${review.author}-${review.city}`} className="rounded-lg border border-gray-200 p-6">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-6 text-gray-600">{review.text}</p>
                <div className="mt-6">
                  <p className="font-medium text-gray-900">{review.author}</p>
                  <p className="text-sm text-gray-500">{review.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
