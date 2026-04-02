import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'

const CATEGORY_LABELS = {
  puhoviki: 'Пуховики',
  kostyumy: 'Костюмы',
  trikotazh: 'Трикотаж',
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
      <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

function ProductCard({ product, view }) {
  const addItem = useCartStore((state) => state.addItem)
  const [wished, setWished] = useState(false)

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
      <Link to={`/product/${product.id}`} className="flex gap-4 group border-b border-gray-100 pb-6">
        <div className="relative w-32 flex-shrink-0">
          <img src={image} alt={product.name} className="w-full aspect-[3/4] object-cover rounded-lg" />
          {product.badges?.[0] && (
            <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded">
              {product.badges[0]}
            </span>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 py-1">
          <div>
            {product.brand && <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.brand}</p>}
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
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
            className="mt-3 self-start px-5 py-2 bg-gray-900 text-white text-xs tracking-wide rounded hover:bg-gray-700 transition-colors"
          >
            В корзину
          </button>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative overflow-hidden rounded-lg bg-gray-50 aspect-[3/4]">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badges?.[0] && (
          <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            {product.badges[0]}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); setWished((w) => !w) }}
          className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"
          aria-label="В избранное"
        >
          <Heart className={`w-4 h-4 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 flex h-12 items-center justify-center bg-gray-900 text-xs tracking-wide text-white translate-y-full transition-transform duration-300 group-hover:translate-y-0"
        >
          В корзину
        </button>
      </div>
      <div className="mt-3">
        {product.brand && <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.brand}</p>}
        <h3 className="text-sm text-gray-900 font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-semibold text-gray-900">{price?.toLocaleString('ru-KZ')} ₸</span>
          {originalPrice && (
            <span className="text-xs text-gray-400 line-through">{originalPrice?.toLocaleString('ru-KZ')} ₸</span>
          )}
        </div>
        {colors.length > 0 && (
          <div className="flex gap-1 mt-2">
            {colors.slice(0, 5).map((v) => {
              const colorDef = COLORS.find((c) => c.value === v.color || c.label === v.color)
              return (
                <span
                  key={v.color}
                  title={v.color}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
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
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">Длина</h3>
          <div className="space-y-2">
            {LENGTHS.map((l) => (
              <label key={l} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.lengths.includes(l)}
                  onChange={() => toggleArray('lengths', l)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">Цвет</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => toggleArray('colors', c.value)}
              title={c.label}
              className={`w-7 h-7 rounded-full transition-all ${
                filters.colors.includes(c.value)
                  ? 'ring-2 ring-offset-2 ring-gray-900'
                  : 'ring-1 ring-gray-200 hover:ring-gray-400'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">Размер</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArray('sizes', s)}
              className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                filters.sizes.includes(s)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">
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

      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => setFilters((p) => ({ ...p, inStock: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Только в наличии</span>
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
  colors: [],
  sizes: [],
  lengths: [],
  priceMin: 0,
  priceMax: MAX_PRICE,
  inStock: false,
}

export default function CatalogPage() {
  const { category } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState('grid')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [category])

  const filtered = useMemo(() => {
    let list = [...products]

    if (category) {
      list = list.filter((p) => p.category === category || p.slug?.startsWith(category))
    }

    if (filters.colors.length > 0) {
      list = list.filter((p) =>
        p.product_variants?.some((v) => {
          const colorDef = COLORS.find((c) => c.hex === v.color || c.value === v.color || c.label === v.color)
          return colorDef && filters.colors.includes(colorDef.value)
        })
      )
    }

    if (filters.sizes.length > 0) {
      list = list.filter((p) =>
        p.product_variants?.some((v) => filters.sizes.includes(v.size))
      )
    }

    if (filters.lengths.length > 0) {
      list = list.filter((p) =>
        filters.lengths.some((l) => p.length === l || p.tags?.includes(l))
      )
    }

    list = list.filter((p) => {
      const price = p.sale_price || p.price || 0
      return price >= filters.priceMin && price <= filters.priceMax
    })

    if (filters.inStock) {
      list = list.filter((p) =>
        p.product_variants?.some((v) => (v.stock ?? 0) > 0)
      )
    }

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
  }, [products, category, filters, sort])

  const categoryLabel = category ? CATEGORY_LABELS[category] || category : null

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-[0.05em] text-gray-900">
            {categoryLabel ? `Каталог — ${categoryLabel}` : 'Каталог'}
          </h1>
          {!categoryLabel && (
            <p className="mt-1 text-sm text-gray-500">Женская одежда Capriccio</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-12 items-center gap-2 rounded border border-gray-200 px-4 text-sm text-gray-700 transition-colors hover:border-gray-900"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          {/* Desktop filter sidebar */}
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

          {/* Product area */}
          <div>
            {/* Sort bar */}
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
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`flex h-12 w-12 items-center justify-center transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
                    aria-label="Список"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products grid / list */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p className="text-lg mb-2">Товары не найдены</p>
                <button onClick={resetFilters} className="text-sm underline hover:text-gray-700">
                  Сбросить фильтры
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                {filtered.map((p) => <ProductCard key={p.id} product={p} view="grid" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filtered.map((p) => <ProductCard key={p.id} product={p} view="list" />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
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
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="px-4 py-6 sm:px-6">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                category={category}
                onReset={() => { resetFilters(); setDrawerOpen(false) }}
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
