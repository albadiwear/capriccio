import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useSEO } from '../hooks/useSEO'

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

  const price = product.sale_price || product.price
  const originalPrice = product.sale_price ? product.price : null
  const image = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/533`

  const colors = useMemo(() => {
    if (!product.product_variants) return []
    const seen = new Set()
    return product.product_variants.filter((v) => {
      if (!v.color || seen.has(v.color)) return false
      seen.add(v.color)
      return true
    })
  }, [product.product_variants])

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
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-50">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badges?.[0] && (
          <span className="absolute left-3 top-3 rounded bg-gray-900 px-2 py-1 text-xs text-white">
            {product.badges[0]}
          </span>
        )}
        <button
          onClick={async (e) => {
            e.preventDefault()
            await onToggleWishlist(product.id)
          }}
          className="absolute right-3 top-3 rounded-full bg-white p-1.5 shadow-sm transition-transform hover:scale-110"
          aria-label="В избранное"
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 flex h-12 translate-y-full items-center justify-center bg-gray-900 text-xs tracking-wide text-white transition-transform duration-300 group-hover:translate-y-0"
        >
          В корзину
        </button>
      </div>
      <div className="mt-3">
        {product.brand && <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">{product.brand}</p>}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{product.name}</h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{price?.toLocaleString('ru-KZ')} ₸</span>
          {originalPrice && (
            <span className="text-xs text-gray-400 line-through">{originalPrice?.toLocaleString('ru-KZ')} ₸</span>
          )}
        </div>
        {colors.length > 0 && (
          <div className="mt-2 flex gap-1">
            {colors.slice(0, 5).map((v) => {
              const colorDef = COLORS.find((c) => c.value === v.color || c.label === v.color)
              return (
                <span
                  key={v.color}
                  title={v.color}
                  className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-gray-200"
                  style={{ backgroundColor: colorDef?.hex || v.color }}
                />
              )
            })}
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
  const [view, setView] = useState('grid')
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const filtered = useMemo(() => {
    let list = [...products]

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
      if (categoryName && p.category !== categoryName) return false

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
  }, [products, categoryName, filters, sort])

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

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
      <div className="border-b border-gray-100 py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-[0.05em] text-gray-900">{pageTitle}</h1>
          {!categoryName && (
            <p className="mt-1 text-sm text-gray-500">Женская одежда Capriccio</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-12 items-center gap-2 rounded border border-gray-200 px-4 text-sm text-gray-700 transition-colors hover:border-gray-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                category={category}
                onReset={resetFilters}
              />
            </div>
          </aside>

          <div>
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
                    onClick={() => setView('list')}
                    className={`flex h-12 w-12 items-center justify-center transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
                    aria-label="Список"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p className="mb-2 text-lg">Товары не найдены</p>
                <button onClick={resetFilters} className="text-sm underline hover:text-gray-700">
                  Сбросить фильтры
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
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
            ) : (
              <div className="flex flex-col gap-6">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    view="list"
                    wished={wishlistIds.includes(p.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
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
