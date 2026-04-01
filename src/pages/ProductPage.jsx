import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Heart,
  Truck,
  RotateCcw,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Play,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'

const CATEGORY_LABELS = {
  puhoviki: 'Пуховики',
  kostyumy: 'Костюмы',
  trikotazh: 'Трикотаж',
}

const COLOR_MAP = {
  black: { label: 'Чёрный', hex: '#000000' },
  navy: { label: 'Тёмно-синий', hex: '#1B2A4A' },
  beige: { label: 'Бежевый', hex: '#F5F0E8' },
  khaki: { label: 'Хаки', hex: '#6B6B47' },
  gray: { label: 'Серый', hex: '#808080' },
  darkgreen: { label: 'Тёмно-зелёный', hex: '#2D4A3E' },
  bordeaux: { label: 'Бордовый', hex: '#6D1F2B' },
}

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`w-4 h-4 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">{rating} ({count} отзывов)</span>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="border-b border-gray-100 pb-6">
      <div className="flex items-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`w-3.5 h-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      {review.text && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.text}</p>}
      {review.photos?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.photos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`Фото отзыва ${i + 1}`}
              className="w-16 h-16 object-cover rounded"
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span className="font-medium text-gray-600">{review.author_name || 'Покупатель'}</span>
        <span>·</span>
        <span>{review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : ''}</span>
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem)
  const image = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/533`
  const price = product.sale_price || product.price

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative overflow-hidden rounded-lg bg-gray-50 aspect-[3/4]">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-sm text-gray-900 font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-semibold text-gray-900">{price?.toLocaleString('ru-RU')} ₸</span>
          {product.sale_price && (
            <span className="text-xs text-gray-400 line-through">{product.price?.toLocaleString('ru-RU')} ₸</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonProduct() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
      <div className="space-y-3">
        <div className="bg-gray-200 aspect-[3/4] rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-gray-200 w-16 h-20 rounded" />)}
        </div>
      </div>
      <div className="space-y-4 pt-4">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-7 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded w-1/3 mt-4" />
        <div className="h-12 bg-gray-200 rounded mt-6" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const addItem = useCartStore((state) => state.addItem)

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [wished, setWished] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setActiveImage(0)
    setSelectedColor(null)
    setSelectedSize(null)

    Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('product_id', id).eq('is_approved', true),
    ]).then(([{ data: prod }, { data: revs }]) => {
      setProduct(prod || null)
      setReviews(revs || [])

      if (prod) {
        const firstColor = getUniqueColors(prod.product_variants || [])[0]
        setSelectedColor(firstColor?.color || null)

        supabase
          .from('products')
          .select('id, name, price, sale_price, images, category')
          .eq('is_active', true)
          .eq('category', prod.category)
          .neq('id', id)
          .limit(4)
          .then(({ data: rel }) => setRelated(rel || []))
      }

      setLoading(false)
    })
  }, [id])

  function getUniqueColors(variants) {
    const seen = new Set()
    return variants.filter((v) => {
      if (!v.color || seen.has(v.color)) return false
      seen.add(v.color)
      return true
    })
  }

  function getSizesForColor(variants, color) {
    return variants.filter((v) => v.color === color)
  }

  function getColorMeta(colorVal) {
    return COLOR_MAP[colorVal] || { label: colorVal, hex: '#ccc' }
  }

  function handleAddToCart() {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.images?.[0],
      color: selectedColor,
      size: selectedSize,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Здравствуйте! Хочу заказать: ${product?.name}${selectedColor ? `, цвет: ${getColorMeta(selectedColor).label}` : ''}${selectedSize ? `, размер: ${selectedSize}` : ''}`
    )
    window.open(`https://wa.me/77000000000?text=${text}`, '_blank')
  }

  function getYoutubeEmbedUrl(url) {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <SkeletonProduct />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-400">
        <p className="text-lg">Товар не найден</p>
        <Link to="/catalog" className="mt-4 inline-block text-sm underline hover:text-gray-700">
          Вернуться в каталог
        </Link>
      </div>
    )
  }

  const images = product.images?.length > 0
    ? product.images
    : [`https://picsum.photos/seed/${product.id}/600/800`]

  const variants = product.product_variants || []
  const uniqueColors = getUniqueColors(variants)
  const sizesForColor = selectedColor ? getSizesForColor(variants, selectedColor) : []
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category

  const embedUrl = getYoutubeEmbedUrl(product.youtube_url)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link to="/" className="hover:text-gray-900 transition-colors">Главная</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-gray-900 transition-colors">Каталог</Link>
          {categoryLabel && (
            <>
              <span>/</span>
              <Link to={`/catalog/${product.category}`} className="hover:text-gray-900 transition-colors">
                {categoryLabel}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Gallery */}
          <div>
            <div className="relative rounded-xl overflow-hidden bg-gray-50 aspect-[3/4]">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {embedUrl && (
                <button
                  onClick={() => setVideoOpen(true)}
                  className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900 shadow hover:bg-white transition-colors"
                >
                  <Play className="w-4 h-4 fill-gray-900" />
                  Смотреть видео
                </button>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 rounded overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-gray-900' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`Фото ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">

            {/* Brand / name / rating */}
            <div>
              {product.brand && (
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">{product.brand}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <div className="mt-2">
                <StarRating rating={4.8} count={24} />
              </div>
              <p className="text-sm text-gray-500 mt-1">128 человек купили в этом месяце</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {product.sale_price ? (
                <>
                  <span className="text-3xl font-bold text-red-600">
                    {product.sale_price.toLocaleString('ru-RU')} ₸
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {product.price?.toLocaleString('ru-RU')} ₸
                  </span>
                  <span className="text-sm bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">
                    -{Math.round((1 - product.sale_price / product.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {product.price?.toLocaleString('ru-RU')} ₸
                </span>
              )}
            </div>

            {/* Color picker */}
            {uniqueColors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Цвет:{' '}
                  <span className="font-normal text-gray-600">
                    {selectedColor ? getColorMeta(selectedColor).label : 'не выбран'}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {uniqueColors.map((v) => {
                    const meta = getColorMeta(v.color)
                    return (
                      <button
                        key={v.color}
                        onClick={() => { setSelectedColor(v.color); setSelectedSize(null) }}
                        title={meta.label}
                        className={`w-8 h-8 rounded-full transition-all ${
                          selectedColor === v.color
                            ? 'ring-2 ring-offset-2 ring-gray-900'
                            : 'ring-1 ring-gray-200 hover:ring-gray-400'
                        }`}
                        style={{ backgroundColor: meta.hex }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size picker */}
            {sizesForColor.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">Выберите размер:</p>
                  <button className="text-xs text-gray-500 underline hover:text-gray-900 transition-colors">
                    Таблица размеров
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizesForColor.map((v) => {
                    const outOfStock = (v.stock ?? 0) === 0
                    const isSelected = selectedSize === v.size
                    return (
                      <button
                        key={v.size}
                        onClick={() => !outOfStock && setSelectedSize(v.size)}
                        disabled={outOfStock}
                        className={`px-4 py-2 text-sm border rounded transition-all relative ${
                          outOfStock
                            ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400 line-through'
                            : isSelected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        {v.size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 items-start">
              <div className="flex flex-col gap-3 flex-1">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 text-sm font-medium tracking-wide rounded transition-colors ${
                    added
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  {added ? '✓ Добавлено в корзину' : 'Добавить в корзину'}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3.5 text-sm font-medium tracking-wide rounded border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Заказать в WhatsApp
                </button>
              </div>
              <button
                onClick={() => setWished((w) => !w)}
                aria-label="В избранное"
                className="mt-0.5 p-3.5 border border-gray-200 rounded hover:border-gray-900 transition-colors flex-shrink-0"
              >
                <Heart className={`w-5 h-5 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Delivery info */}
            <div className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Бесплатная доставка по Алматы при заказе от 50 000 ₸</p>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Возврат и обмен в течение 14 дней</p>
              </div>
            </div>

            {/* Accordion */}
            {(product.composition || product.care) && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setAccordionOpen((v) => !v)}
                  className="flex items-center justify-between w-full py-4 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                  <span>Состав и уход</span>
                  {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {accordionOpen && (
                  <div className="pb-4 text-sm text-gray-600 space-y-2 leading-relaxed">
                    {product.composition && (
                      <p><span className="font-medium text-gray-900">Состав:</span> {product.composition}</p>
                    )}
                    {product.care && (
                      <p><span className="font-medium text-gray-900">Уход:</span> {product.care}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16 border-t border-gray-100 pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Отзывы покупателей</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Будьте первым, кто оставит отзыв</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-gray-100 pt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Похожие товары</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* YouTube modal */}
      {videoOpen && embedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Закрыть видео"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src={embedUrl}
              title="Видео товара"
              className="w-full h-full rounded-lg"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}
