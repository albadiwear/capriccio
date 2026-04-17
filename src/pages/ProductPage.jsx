import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  Truck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Play,
  Share2,
  Minus,
  Plus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import Toast from '../components/ui/Toast'

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

function DescriptionBlock({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 200

  return (
    <div>
      <p className={`text-sm text-gray-600 leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-1 text-xs text-gray-500 underline hover:text-gray-900 transition-colors"
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
        </button>
      )}
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [outfitItems, setOutfitItems] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [wished, setWished] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '', author_name: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewPhotos, setReviewPhotos] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)
  const [sizeTableOpen, setSizeTableOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewsExpanded, setReviewsExpanded] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [zoomOriginX, setZoomOriginX] = useState(50)
  const [zoomOriginY, setZoomOriginY] = useState(50)
  const [isPanning, setIsPanning] = useState(false)

  const touchStartY = useRef(null)
  const imgContainerRef = useRef(null)
  const imgTouchStartX = useRef(0)
  const imgTouchStartY = useRef(0)
  const imgLastTapTime = useRef(0)
  const imgPanAnchorX = useRef(0)
  const imgPanAnchorY = useRef(0)
  const imgMovedRef = useRef(false)

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
          .select('id, name, price, images')
          .eq('category', prod.category)
          .neq('id', prod.id)
          .eq('is_active', true)
          .limit(6)
          .then(({ data }) => setOutfitItems(data || []))

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
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 3000)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }).catch(() => {})
  }

  useEffect(() => {
    setZoomed(false)
    setPanX(0)
    setPanY(0)
  }, [activeImage])

  useEffect(() => { setQuantity(1) }, [selectedSize])

  function handleImgTouchStart(e) {
    const t = e.touches[0]
    imgTouchStartX.current = t.clientX
    imgTouchStartY.current = t.clientY
    imgPanAnchorX.current = panX
    imgPanAnchorY.current = panY
    imgMovedRef.current = false
    if (zoomed) setIsPanning(false)
  }

  useEffect(() => {
    const el = imgContainerRef.current
    if (!el) return
    const handler = (e) => { if (zoomed) e.preventDefault() }
    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [zoomed])

  function handleImgTouchMove(e) {
    if (!zoomed || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - imgTouchStartX.current
    const dy = t.clientY - imgTouchStartY.current
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      imgMovedRef.current = true
      setIsPanning(true)
    }
    setPanX(imgPanAnchorX.current + dx)
    setPanY(imgPanAnchorY.current + dy)
  }

  function handleImgTouchEnd(e) {
    const t = e.changedTouches[0]
    const dx = t.clientX - imgTouchStartX.current
    const dy = t.clientY - imgTouchStartY.current
    const now = Date.now()
    const isTap = Math.abs(dx) < 15 && Math.abs(dy) < 15

    setIsPanning(false)

    // If was panning while zoomed, skip tap/swipe logic
    if (zoomed && imgMovedRef.current) return

    if (isTap) {
      if (now - imgLastTapTime.current < 300) {
        // Double tap
        imgLastTapTime.current = 0
        if (zoomed) {
          setZoomed(false)
          setPanX(0)
          setPanY(0)
        } else {
          if (imgContainerRef.current) {
            const rect = imgContainerRef.current.getBoundingClientRect()
            setZoomOriginX(((t.clientX - rect.left) / rect.width) * 100)
            setZoomOriginY(((t.clientY - rect.top) / rect.height) * 100)
          }
          setZoomed(true)
          setPanX(0)
          setPanY(0)
        }
      } else {
        imgLastTapTime.current = now
      }
      return
    }

    // Swipe — only when not zoomed, horizontal, and > 50px
    if (!zoomed && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      imgLastTapTime.current = 0
      if (dx < 0) setActiveImage((i) => Math.min(i + 1, images.length - 1))
      else setActiveImage((i) => Math.max(i - 1, 0))
    }
  }

  function handleSheetAddToCart() {
    if (!selectedSize && sizesForColor.length > 0) return
    handleAddToCart()
    setSizeSheetOpen(false)
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

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!reviewForm.text || !reviewForm.author_name) return
    setSubmittingReview(true)
    await supabase.from('reviews').insert({
      product_id: id,
      rating: reviewForm.rating,
      text: reviewForm.text,
      author_name: reviewForm.author_name,
      is_approved: false,
      photos: reviewPhotos,
    })
    setReviewSuccess(true)
    setReviewForm({ rating: 5, text: '', author_name: '' })
    setReviewPhotos([])
    setSubmittingReview(false)
  }

  async function handleReviewPhotoUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingPhotos(true)
    const urls = []
    for (const file of files) {
      const path = `${id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('review-photos')
        .upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setReviewPhotos(prev => [...prev, ...urls])
    setUploadingPhotos(false)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 md:py-10">
        <SkeletonProduct />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400 sm:px-6 md:py-20">
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
  const reviewCount = reviews.length
  const productStock = product.stock ?? variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)

  const embedUrl = getYoutubeEmbedUrl(product.youtube_url)
  const selectedVariant = selectedSize
    ? variants.find((v) => v.color === selectedColor && v.size === selectedSize)
    : null
  const maxStock = selectedVariant ? (selectedVariant.stock ?? 1) : (productStock || 99)
  const allRelated = [
    ...outfitItems.map((i) => ({ ...i, _src: 'outfit' })),
    ...related.map((i) => ({ ...i, _src: 'related' })),
  ].filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {/* Mobile gallery: swipe + double-tap zoom */}
            <div className="md:hidden">
              <div
                ref={imgContainerRef}
                className="relative overflow-hidden rounded-2xl aspect-[3/4] select-none"
                style={{ touchAction: zoomed ? 'none' : 'pan-y' }}
                onTouchStart={handleImgTouchStart}
                onTouchMove={handleImgTouchMove}
                onTouchEnd={handleImgTouchEnd}
              >
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoomed ? 2 : 1})`,
                    transformOrigin: `${zoomOriginX}% ${zoomOriginY}%`,
                    transition: isPanning ? 'none' : 'transform 0.25s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full bg-white transition-all duration-200 ${
                          i === activeImage ? 'w-4 h-1.5' : 'w-1.5 h-1.5 opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {embedUrl && !zoomed && (
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="absolute bottom-10 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900 shadow"
                  >
                    <Play className="w-4 h-4 fill-gray-900" />
                    Смотреть видео
                  </button>
                )}
              </div>
            </div>

            {/* Desktop gallery: thumbnails */}
            <div className="hidden md:block">
              <div className="relative">
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full aspect-[3/4] object-cover rounded-2xl"
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
                      className={`flex-shrink-0 w-[72px] h-[90px] rounded-xl overflow-hidden border-2 transition-colors ${
                        activeImage === i ? 'border-gray-900' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              {product.brand && (
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">{product.brand}</p>
              )}
              <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">{product.name}</h1>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReviewsExpanded(true)}
                  className="flex items-center gap-1.5 group"
                >
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= 5 ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 group-hover:underline">
                    {reviewCount > 0 ? `${reviewCount} отзыв${reviewCount === 1 ? '' : reviewCount < 5 ? 'а' : 'ов'}` : 'Нет отзывов'}
                  </span>
                </button>
                {productStock > 0 && productStock <= 5 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    Осталось {productStock} шт.
                  </span>
                )}
              </div>
            </div>

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

            {product.description && (
              <DescriptionBlock text={product.description} />
            )}

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
                        className={`h-12 px-4 text-sm border rounded transition-all relative ${
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

            {/* Quantity counter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Количество:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-sm font-medium text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-2 flex-1">
                {/* Add to cart / In cart */}
                <div className="hidden md:flex gap-2">
                  {!added ? (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 h-12 text-sm font-medium rounded bg-[#D4537E] hover:bg-[#c44870] text-white transition-colors"
                    >
                      Добавить в корзину
                    </button>
                  ) : (
                    <>
                      <button className="flex-1 h-12 text-sm font-medium rounded border-2 border-green-500 text-green-600 bg-white">
                        ✓ В корзине
                      </button>
                      <button
                        onClick={() => navigate('/cart')}
                        className="flex-1 h-12 text-sm font-medium rounded bg-[#D4537E] hover:bg-[#c44870] text-white transition-colors"
                      >
                        Оформить заказ →
                      </button>
                    </>
                  )}
                </div>
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsApp}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded text-sm font-medium bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.84L0 24l6.336-1.501A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.732.883.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Заказать в WhatsApp
                </button>
              </div>
              {/* Heart + Share */}
              <div className="flex flex-col gap-2 mt-0">
                <button
                  onClick={() => setWished((w) => !w)}
                  aria-label="В избранное"
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-200 transition-colors hover:border-gray-900"
                >
                  <Heart className={`w-5 h-5 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Поделиться"
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-200 transition-colors hover:border-gray-900"
                >
                  <Share2 className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

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

            {(product.composition || product.care) && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setAccordionOpen((v) => !v)}
                  className="flex min-h-12 w-full items-center justify-between py-4 text-sm font-medium text-gray-900 transition-colors hover:text-gray-600"
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

        {allRelated.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#f0ede8]">
            <h3 className="text-base font-semibold text-[#1a1a18] mb-4">Вам может понравиться</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {allRelated.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="flex-shrink-0 w-[150px]">
                  <div className="w-[150px] h-[200px] rounded-xl overflow-hidden bg-[#f0ede8] mb-2">
                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-[#1a1a18] leading-tight mb-1 line-clamp-2">{item.name}</p>
                  <p className="text-xs font-medium text-[#1a1a18]">{Number(item.price).toLocaleString('ru-RU')} ₸</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="mt-8 pt-6 border-t border-[#f0ede8]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-[#1a1a18]">Отзывы</h2>
              {reviewCount > 0 && (
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{reviewCount}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="text-xs font-medium text-[#D4537E] hover:underline"
            >
              Оставить отзыв
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Будьте первым, кто оставит отзыв</p>
          ) : (
            <>
              <div className="space-y-4">
                {(reviewsExpanded ? reviews : reviews.slice(0, 3)).map((r) => (
                  <div key={r.id} className="flex gap-3 pb-4 border-b border-[#f0ede8] last:border-0 last:pb-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f5f2ed] flex items-center justify-center text-xs font-medium text-[#1a1a18]">
                      {(r.author_name || 'П')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#1a1a18]">{r.author_name || 'Покупатель'}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {r.text && <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>}
                      {r.photos?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {r.photos.map((photo, i) => (
                            <img key={i} src={photo} alt="" className="w-14 h-14 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {reviews.length > 3 && (
                <button
                  onClick={() => setReviewsExpanded((v) => !v)}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-900 underline"
                >
                  {reviewsExpanded ? 'Свернуть' : `Читать все отзывы (${reviewCount})`}
                </button>
              )}
            </>
          )}
        </section>
      </div>

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

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ede8] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-50">
        {!added ? (
          <button
            onClick={() => sizesForColor.length > 0 ? setSizeSheetOpen(true) : handleAddToCart()}
            className="w-full h-[52px] rounded-lg bg-[#D4537E] hover:bg-[#c44870] text-white text-sm font-medium transition-colors"
          >
            Добавить в корзину
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="flex-1 h-[52px] rounded-lg border-2 border-green-500 text-green-600 bg-white text-sm font-medium">
              ✓ В корзине
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="flex-1 h-[52px] rounded-lg bg-[#D4537E] hover:bg-[#c44870] text-white text-sm font-medium transition-colors"
            >
              Оформить заказ →
            </button>
          </div>
        )}
      </div>

      {/* Size Bottom Sheet — mobile only */}
      {sizeSheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSizeSheetOpen(false)}
          />
          {/* Panel */}
          <div
            className="relative bg-white rounded-t-2xl px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))]"
            onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
            onTouchEnd={(e) => {
              if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 60) {
                setSizeSheetOpen(false)
              }
              touchStartY.current = null
            }}
          >
            {/* Drag handle */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-[#1a1a18]">Выберите размер</span>
              <button onClick={() => setSizeSheetOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mini product card */}
            <div className="flex items-center gap-3 mb-5">
              {images[0] && (
                <img
                  src={images[0]}
                  alt={product.name}
                  className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1a1a18] line-clamp-2 leading-snug">{product.name}</p>
                <p className="text-sm font-semibold text-[#1a1a18] mt-1">
                  {(product.sale_price || product.price)?.toLocaleString('ru-RU')} ₸
                </p>
              </div>
            </div>

            {/* Sizes */}
            <div className="flex gap-2 flex-wrap mb-3">
              {sizesForColor.map((v) => {
                const outOfStock = (v.stock ?? 0) === 0
                const isSelected = selectedSize === v.size
                return (
                  <button
                    key={v.size}
                    onClick={() => !outOfStock && setSelectedSize(v.size)}
                    disabled={outOfStock}
                    className={`h-11 min-w-[52px] px-3 text-sm rounded-lg border-2 transition-all ${
                      outOfStock
                        ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                        : isSelected
                        ? 'border-[#1a1a18] text-[#1a1a18] font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {v.size}
                  </button>
                )
              })}
            </div>

            {/* Size table link */}
            <button
              type="button"
              onClick={() => setSizeTableOpen(true)}
              className="text-xs text-gray-500 underline mb-5 hover:text-gray-800"
            >
              Таблица размеров →
            </button>

            {/* Add to cart */}
            <button
              onClick={handleSheetAddToCart}
              disabled={sizesForColor.length > 0 && !selectedSize}
              className="w-full h-[52px] rounded-xl bg-[#D4537E] hover:bg-[#c44870] text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              В корзину
            </button>
          </div>
        </div>
      )}

      {/* Size Table Modal */}
      {sizeTableOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/50 px-0 md:px-4"
          onClick={() => setSizeTableOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl px-4 pt-4 pb-8 overflow-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-[#1a1a18]">Таблица размеров</span>
              <button onClick={() => setSizeTableOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f2ed]">
                    {['RU', 'INT', 'Грудь', 'Талия', 'Бёдра'].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium text-[#1a1a18] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['44', 'XS',   '88–91',   '78–81',   '94–97'],
                    ['46', 'S',    '92–95',   '82–84',   '98–101'],
                    ['48', 'M',    '96–99',   '85–87',   '102–105'],
                    ['50', 'L',    '100–103', '88–90',   '106–108'],
                    ['52', 'L/XL', '104–107', '91–94',   '109–112'],
                    ['54', 'XL',   '108–111', '95–99',   '112–116'],
                    ['56', 'XXL',  '112–115', '100–107', '116–120'],
                  ].map(([ru, intl, chest, waist, hips]) => (
                    <tr key={ru} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium">{ru}</td>
                      <td className="px-3 py-2 text-gray-600">{intl}</td>
                      <td className="px-3 py-2 text-gray-600">{chest}</td>
                      <td className="px-3 py-2 text-gray-600">{waist}</td>
                      <td className="px-3 py-2 text-gray-600">{hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl px-5 pt-5 pb-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-base font-semibold text-[#1a1a18]">Оставить отзыв</span>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {reviewSuccess ? (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Спасибо! Отзыв отправлен на модерацию.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Оценка</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                        <Star className={`w-7 h-7 ${n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Ваше имя</label>
                  <input
                    value={reviewForm.author_name}
                    onChange={(e) => setReviewForm((f) => ({ ...f, author_name: e.target.value }))}
                    placeholder="Айгерим"
                    required
                    className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Отзыв</label>
                  <textarea
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                    placeholder="Расскажите о товаре..."
                    required
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Фото (необязательно)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleReviewPhotoUpload}
                    className="text-sm text-gray-600"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos && <p className="text-xs text-gray-400 mt-1">Загрузка фото...</p>}
                  {reviewPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {reviewPhotos.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setReviewPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="h-12 w-full rounded-lg bg-[#1a1a18] text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60"
                >
                  {submittingReview ? 'Отправляем...' : 'Отправить отзыв'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Toast
        message="✓ Добавлено в корзину"
        isVisible={added}
        type="success"
        onClick={() => navigate('/cart')}
        actionText="Перейти →"
      />
      <Toast
        message="Ссылка скопирована"
        isVisible={linkCopied}
        type="success"
      />
    </div>
  )
}
