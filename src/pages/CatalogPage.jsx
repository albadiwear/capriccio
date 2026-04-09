import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Heart, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useSEO } from '../hooks/useSEO'
import ProductFeed from '../components/catalog/ProductFeed'

const CATEGORY_MAP = {
  puhoviki: 'Пуховики',
  kostyumy: 'Костюмы',
  trikotazh: 'Трикотаж',
  obuv: 'Обувь',
  povsednevnoe: 'Повседневное',
}

const CATEGORY_TITLES = {
  puhoviki: 'Каталог пуховиков',
  kostyumy: 'Каталог костюмов',
  trikotazh: 'Каталог трикотажа',
  obuv: 'Каталог обуви',
  povsednevnoe: 'Повседневная одежда',
}

const COLORS = [
  { label: 'Чёрный', value: 'black', hex: '#000000' },
  { label: 'Тёмно-синий', value: 'navy', hex: '#1B2A4A' },
  { label: 'Бежевый', value: 'beige', hex: '#F5F0E8' },
  { label: 'Хаки', value: 'khaki', hex: '#6B6B47' },
  { label: 'Серый', value: 'gray', hex: '#808080' },
  { label: 'Тёмно-зелёный', value: 'darkgreen', hex: '#2D4A3E' },
  { label: 'Бордовый', value: 'bordeaux', hex: '#6D1F2B' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const LENGTHS = ['Короткие', 'Средние', 'Длинные']
const ALL_CATEGORIES = [
  'Пуховики',
  'Костюмы',
  'Трикотаж',
  'Обувь',
  'Шапки',
  'Сумки',
  'Аксессуары',
  'Очки',
  'Ремни',
  'Косметика',
  'Украшения',
]
const SEASONS = ['Весна', 'Лето', 'Осень', 'Зима']

const SORT_OPTIONS = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'newest', label: 'Новинки' },
]

const MAX_PRICE = 200000

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 aspect-[3/4] rounded-lg bg-gray-200" />
      <div className="mb-2 h-3 w-1/3 rounded bg-gray-200" />
      <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
    </div>
  )
}

function ProductCard({ product, view, wished, onToggleWishlist }) {
  const addItem = useCartStore((state) => state.addItem)

  const [reviewCount, setReviewCount] = useState(0)

  const price = product.sale_price || product.price
  const oldPrice = product.old_price ?? (product.sale_price ? product.price : null)
  const image = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/533`
  const stock =
    typeof product.stock === 'number'
      ? product.stock
      : (product.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)

  useEffect(() => {
    let cancelled = false
    if (!product?.id) return undefined

    async function loadCount() {
      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('product_id', product.id)

      if (!cancelled) setReviewCount(count || 0)
    }

    loadCount()
    return () => {
      cancelled = true
    }
  }, [product?.id])

  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem({ id: product.id, name: product.name, price, image, quantity: 1 })
  }

  if (view === 'list') {
    return (
      <Link to={`/product/${product.id}`} className="group flex gap-4 border-b border-gray-100 pb-6">
        <div className="relative w-32 flex-shrink-0">
          <img src={image} alt={product.name} className="aspect-[3/4] w-full rounded-lg object-cover" />
          {product.badges?.[0] && (
            <span className="absolute left-2 top-2 rounded bg-gray-900 px-2 py-0.5 text-xs text-white">
              {product.badges[0]}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            {product.brand && <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">{product.brand}</p>}
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">
                {price?.toLocaleString('ru-KZ')} ₸
              </span>
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {originalPrice?.toLocaleString('ru-KZ')} ₸
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="mt-3 self-start rounded bg-gray-900 px-5 py-2 text-xs tracking-wide text-white transition-colors hover:bg-gray-700"
          >
            В корзину
          </button>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/product/${product.id}`} className="block rounded-xl border border-[#f0ede8]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-[#f0ede8]">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />

        {product.is_hit && (
          <span className="absolute left-2 top-2 rounded bg-[#1a1a18] px-1.5 py-0.5 text-[9px] font-medium text-white">
            hit
          </span>
        )}
        {!product.is_hit && product.is_new && (
          <span className="absolute left-2 top-2 rounded bg-[#f0ede8] px-1.5 py-0.5 text-[9px] font-medium text-[#1a1a18]">
            new
          </span>
        )}
        {!product.is_hit && !product.is_new && oldPrice && (
          <span className="absolute left-2 top-2 rounded bg-[#e8453c] px-1.5 py-0.5 text-[9px] font-medium text-white">
            -{Math.round((1 - (price || 0) / oldPrice) * 100)}%
          </span>
        )}

        {stock <= 3 && stock > 0 && (
          <span className="absolute bottom-2 left-2 rounded bg-[#e8453c] px-1.5 py-0.5 text-[9px] font-medium text-white">
            Осталось {stock}
          </span>
        )}

        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault()
            await onToggleWishlist(product.id)
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90"
          aria-label="В избранное"
        >
          <Heart size={12} className={`${wished ? 'fill-[#1a1a18] text-[#1a1a18]' : 'text-[#1a1a18]'}`} />
        </button>
      </div>

      <div className="p-2">
        <div className="mb-0.5 text-[9px] uppercase tracking-wide text-[#aaa]">
          {product.category}
        </div>
        <div className="mb-1 text-[11px] leading-tight text-[#1a1a18]">
          {product.name}
        </div>
        <div className="flex items-baseline gap-1">
          {oldPrice && (
            <span className="text-[10px] text-[#bbb] line-through">
              {Number(oldPrice).toLocaleString('ru-RU')} ₸
            </span>
          )}
          <span className="text-[12px] font-medium text-[#1a1a18]">
            {Number(price || 0).toLocaleString('ru-RU')} ₸
          </span>
        </div>
        {reviewCount > 0 && (
          <div className="mt-0.5 text-[9px] text-[#888780]">
            Носят {reviewCount} женщин
          </div>
        )}
      </div>
    </Link>
  )
}

function FilterPanel({ filters, setFilters, category, onReset }) {
  const isPuhoviki = category === 'puhoviki'

  const toggleArray = (key, value) => {
    setFilters((prev) => {
      const arr = prev[key]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  return (
    <div className="space-y-7">
      {isPuhoviki && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Длина</h3>
          <div className="space-y-2">
            {LENGTHS.map((l) => (
              <label key={l} className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.lengths.includes(l)}
                  onChange={() => toggleArray('lengths', l)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Категория</h3>
        <div className="space-y-2">
          {ALL_CATEGORIES.map((item) => (
            <label key={item} className="group flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.categories.includes(item)}
                onChange={() => toggleArray('categories', item)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Цвет</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => toggleArray('colors', c.value)}
              title={c.label}
              className={`h-7 w-7 rounded-full transition-all ${
                filters.colors.includes(c.value)
                  ? 'ring-2 ring-gray-900 ring-offset-2'
                  : 'ring-1 ring-gray-200 hover:ring-gray-400'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Размер</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArray('sizes', s)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                filters.sizes.includes(s)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">
          Цена: {filters.priceMin.toLocaleString('ru-KZ')} — {filters.priceMax.toLocaleString('ru-KZ')} ₸
        </h3>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={1000}
            value={filters.priceMin}
            onChange={(e) => setFilters((p) => ({ ...p, priceMin: Math.min(Number(e.target.value), p.priceMax - 1000) }))}
            className="w-full accent-gray-900"
          />
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={1000}
            value={filters.priceMax}
            onChange={(e) => setFilters((p) => ({ ...p, priceMax: Math.max(Number(e.target.value), p.priceMin + 1000) }))}
            className="w-full accent-gray-900"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Скидки</h3>
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => setFilters((p) => ({ ...p, onSale: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">Только со скидкой</span>
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-900">Сезон</h3>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((season) => (
            <button
              key={season}
              onClick={() => toggleArray('seasons', season)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                filters.seasons.includes(season)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      <label className="group flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => setFilters((p) => ({ ...p, inStock: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">Только в наличии</span>
      </label>

      <button
        onClick={onReset}
        className="h-12 w-full rounded border border-gray-200 text-sm text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
      >
        Сбросить фильтры
      </button>
    </div>
  )
}

const DEFAULT_FILTERS = {
  categories: [],
  colors: [],
  sizes: [],
  lengths: [],
  seasons: [],
  onSale: false,
  priceMin: 0,
  priceMax: MAX_PRICE,
  inStock: false,
}

export default function CatalogPage() {
  useSEO({
    title: 'Каталог одежды',
    description: 'Каталог женской одежды премиум класса. Пуховики, костюмы, трикотаж, обувь.',
    url: '/catalog',
  })
  const navigate = useNavigate()
  const { category } = useParams()
  const categoryName = CATEGORY_MAP[category] || null
  const pageTitle = CATEGORY_TITLES[category] || 'Каталог'

  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState(() => localStorage.getItem('capriccio_catalog_view') || 'grid')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(categoryName || 'Все')
  const [desktopDropdown, setDesktopDropdown] = useState(null) // 'price' | 'size' | 'season' | null
  const desktopFiltersRef = useRef(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')

    if (ref) {
      localStorage.setItem('ref_code', ref)
      localStorage.setItem('ref_expires', String(Date.now() + 30 * 24 * 60 * 60 * 1000))
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error) console.error(error)
        setProducts(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    async function loadWishlist() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser || null)

      if (!currentUser) {
        setWishlistIds([])
        return
      }

      const { data } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', currentUser.id)

      setWishlistIds((data || []).map((item) => item.product_id))
    }

    loadWishlist()
  }, [])

  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [category])

  useEffect(() => {
    setActiveCategory(categoryName || 'Все')
  }, [categoryName])

  useEffect(() => {
    localStorage.setItem('capriccio_catalog_view', view)
  }, [view])

  useEffect(() => {
    if (!desktopDropdown) return undefined
    const onDown = (e) => {
      if (!desktopFiltersRef.current) return
      if (!desktopFiltersRef.current.contains(e.target)) {
        setDesktopDropdown(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [desktopDropdown])

  const filtered = useMemo(() => {
    let list = [...products]

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => String(p.name || '').toLowerCase().includes(q))
    }

    const hasExtraFilters =
      filters.categories.length > 0 ||
      filters.colors.length > 0 ||
      filters.sizes.length > 0 ||
      filters.lengths.length > 0 ||
      filters.seasons.length > 0 ||
      filters.onSale ||
      filters.inStock ||
      filters.priceMin !== 0 ||
      filters.priceMax !== MAX_PRICE

    if (!categoryName && !hasExtraFilters) {
      switch (sort) {
        case 'price_asc':
          list.sort((a, b) => (a.sale_price || a.price || 0) - (b.sale_price || b.price || 0))
          break
        case 'price_desc':
          list.sort((a, b) => (b.sale_price || b.price || 0) - (a.sale_price || a.price || 0))
          break
        case 'newest':
          list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          break
        default:
          break
      }

      return list
    }

    list = list.filter((p) => {
      if (activeCategory && activeCategory !== 'Все') {
        if (activeCategory === 'Скидки') {
          if (!p.sale_price) return false
        } else if (activeCategory === 'Новинки') {
          if (!p.is_new) return false
        } else if (p.category !== activeCategory) {
          return false
        }
      } else if (categoryName && p.category !== categoryName) {
        return false
      }

      if (filters.categories.length > 0 && !filters.categories.includes(p.category)) {
        return false
      }

      if (filters.colors.length > 0) {
        const hasMatchingColor = p.product_variants?.some((v) => {
          const colorDef = COLORS.find((c) => c.hex === v.color || c.value === v.color || c.label === v.color)
          return colorDef && filters.colors.includes(colorDef.value)
        })
        if (!hasMatchingColor) return false
      }

      if (filters.sizes.length > 0) {
        const hasMatchingSize = p.product_variants?.some((v) => filters.sizes.includes(v.size))
        if (!hasMatchingSize) return false
      }

      if (filters.lengths.length > 0) {
        const hasMatchingLength = filters.lengths.some((l) => p.length === l || p.tags?.includes(l))
        if (!hasMatchingLength) return false
      }

      if (filters.onSale && !p.sale_price) return false

      if (filters.seasons.length > 0) {
        const hasMatchingSeason = filters.seasons.some(
          (season) => p.season === season || p.tags?.includes(season)
        )
        if (!hasMatchingSeason) return false
      }

      const price = p.sale_price || p.price || 0
      if (price < filters.priceMin || price > filters.priceMax) return false

      if (filters.inStock) {
        const inStock = p.product_variants?.some((v) => (v.stock ?? 0) > 0)
        if (!inStock) return false
      }

      return true
    })

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => (a.sale_price || a.price || 0) - (b.sale_price || b.price || 0))
        break
      case 'price_desc':
        list.sort((a, b) => (b.sale_price || b.price || 0) - (a.sale_price || a.price || 0))
        break
      case 'newest':
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      default:
        break
    }

    return list
  }, [products, categoryName, filters, sort, activeCategory, searchQuery])

  const resetFilters = () => setFilters(DEFAULT_FILTERS)
  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
    setActiveCategory(categoryName || 'Все')
    setDesktopDropdown(null)
  }

  const onlyDiscount = filters.onSale
  const setOnlyDiscount = (val) => setFilters((p) => ({ ...p, onSale: val }))

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    (activeCategory && activeCategory !== 'Все') ||
    filters.categories.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.lengths.length > 0 ||
    filters.seasons.length > 0 ||
    filters.onSale ||
    filters.inStock ||
    filters.priceMin !== 0 ||
    filters.priceMax !== MAX_PRICE

  async function handleToggleWishlist(productId) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('product_id', productId)
      .single()

    if (existing?.id) {
      await supabase.from('wishlist').delete().eq('id', existing.id)
      setWishlistIds((current) => current.filter((id) => id !== productId))
      return
    }

    await supabase.from('wishlist').insert({ user_id: currentUser.id, product_id: productId })
    setWishlistIds((current) => [...new Set([...current, productId])])
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="px-6 pb-2 pt-4 md:px-8 md:pb-3 md:pt-5">
          <div className="flex items-center gap-2 rounded-xl bg-[#f5f2ed] px-4 py-2.5 md:gap-3 md:rounded-2xl md:px-5 md:py-3.5">
            <Search size={15} className="flex-shrink-0 text-[#888780] md:hidden" />
            <Search size={18} className="hidden flex-shrink-0 text-[#888780] md:block" />
            <input
              placeholder="Поиск образов и товаров..."
              className="flex-1 bg-transparent text-sm text-[#1a1a18] outline-none placeholder:text-[#aaa] md:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-6 pb-3">
          {['Все', 'Пуховики', 'Костюмы', 'Платья', 'Трикотаж', 'Обувь', 'Шапки', 'Сумки', 'Аксессуары', 'Скидки', 'Новинки'].map((catLabel) => (
            <button
              key={catLabel}
              type="button"
              onClick={() => setActiveCategory(catLabel)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors md:px-5 md:py-2 md:text-sm ${
                activeCategory === catLabel
                  ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                  : 'border-[#e0ddd8] text-[#888780] hover:border-[#1a1a18]'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>

        <div ref={desktopFiltersRef} className="hidden items-center gap-3 px-8 pb-4 md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopDropdown((v) => (v === 'price' ? null : 'price'))}
              className="flex items-center gap-2 rounded-full border border-[#e0ddd8] px-4 py-2 text-sm text-[#888780] transition-colors hover:border-[#1a1a18]"
            >
              Цена
              <ChevronDown size={14} className="text-[#888780]" />
            </button>
            {desktopDropdown === 'price' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-[#f0ede8] bg-white p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={MAX_PRICE}
                    value={filters.priceMin}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(Number(e.target.value || 0), filters.priceMax - 1000))
                      setFilters((p) => ({ ...p, priceMin: val }))
                    }}
                    placeholder="от"
                    className="h-10 w-full rounded-lg border border-[#e0ddd8] px-3 text-sm text-[#1a1a18] outline-none focus:border-[#1a1a18]"
                  />
                  <input
                    type="number"
                    min={0}
                    max={MAX_PRICE}
                    value={filters.priceMax}
                    onChange={(e) => {
                      const val = Math.max(filters.priceMin + 1000, Math.min(Number(e.target.value || 0), MAX_PRICE))
                      setFilters((p) => ({ ...p, priceMax: val }))
                    }}
                    placeholder="до"
                    className="h-10 w-full rounded-lg border border-[#e0ddd8] px-3 text-sm text-[#1a1a18] outline-none focus:border-[#1a1a18]"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={MAX_PRICE}
                    step={1000}
                    value={filters.priceMin}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, priceMin: Math.min(Number(e.target.value), p.priceMax - 1000) }))
                    }
                    className="w-full accent-[#1a1a18]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={MAX_PRICE}
                    step={1000}
                    value={filters.priceMax}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, priceMax: Math.max(Number(e.target.value), p.priceMin + 1000) }))
                    }
                    className="w-full accent-[#1a1a18]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopDropdown((v) => (v === 'size' ? null : 'size'))}
              className="flex items-center gap-2 rounded-full border border-[#e0ddd8] px-4 py-2 text-sm text-[#888780] transition-colors hover:border-[#1a1a18]"
            >
              Размер
              <ChevronDown size={14} className="text-[#888780]" />
            </button>
            {desktopDropdown === 'size' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-[360px] rounded-xl border border-[#f0ede8] bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '44', '46', '48', '50', '52'].map((s) => {
                    const active = filters.sizes.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setFilters((p) => ({
                            ...p,
                            sizes: active ? p.sizes.filter((v) => v !== s) : [...p.sizes, s],
                          }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                            : 'border-[#e0ddd8] text-[#888780] hover:border-[#1a1a18]'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setDesktopDropdown(null)}
                  className="mt-4 h-10 w-full rounded-lg border border-[#e0ddd8] text-sm text-[#1a1a18] transition-colors hover:border-[#1a1a18]"
                >
                  Применить
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopDropdown((v) => (v === 'season' ? null : 'season'))}
              className="flex items-center gap-2 rounded-full border border-[#e0ddd8] px-4 py-2 text-sm text-[#888780] transition-colors hover:border-[#1a1a18]"
            >
              Сезон
              <ChevronDown size={14} className="text-[#888780]" />
            </button>
            {desktopDropdown === 'season' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-[260px] rounded-xl border border-[#f0ede8] bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map((season) => {
                    const active = filters.seasons.includes(season)
                    return (
                      <button
                        key={season}
                        type="button"
                        onClick={() => setFilters((p) => ({ ...p, seasons: active ? [] : [season] }))}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                            : 'border-[#e0ddd8] text-[#888780] hover:border-[#1a1a18]'
                        }`}
                      >
                        {season}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              onlyDiscount
                ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                : 'border-[#e0ddd8] text-[#888780] hover:border-[#1a1a18]'
            }`}
            onClick={() => setOnlyDiscount(!onlyDiscount)}
          >
            Скидки
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-sm text-[#888780] underline"
            >
              Сбросить всё
            </button>
          )}
        </div>

        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-12 items-center gap-2 rounded border border-gray-200 px-4 text-sm text-gray-700 transition-colors hover:border-gray-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
          </button>
        </div>

        <div className="w-full">
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Найдено: <span className="font-medium text-gray-900">{loading ? '...' : filtered.length}</span> товаров
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="min-h-12 rounded border border-gray-200 px-3 text-sm text-gray-700 focus:border-gray-900 focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex overflow-hidden rounded border border-gray-200">
                <button
                  onClick={() => setView('grid')}
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  aria-label="Сетка"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('feed')}
                  className={`flex h-12 w-12 items-center justify-center transition-colors ${view === 'feed' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  aria-label="Лента"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="mb-2 text-lg">Товары не найдены</p>
              <button onClick={resetFilters} className="text-sm underline hover:text-gray-700">
                Сбросить фильтры
              </button>
            </div>
          ) : view === 'feed' ? (
            <ProductFeed
              products={filtered}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  view="grid"
                  wished={wishlistIds.includes(p.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-900">Фильтры</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Закрыть">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-4 py-6 sm:px-6">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                category={category}
                onReset={() => {
                  resetFilters()
                  setDrawerOpen(false)
                }}
              />
            </div>
            <div className="px-4 pb-6 sm:px-6">
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-12 w-full rounded bg-gray-900 text-sm tracking-wide text-white transition-colors hover:bg-gray-700"
              >
                Показать {filtered.length} товаров
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
