import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const FILTERS = [
  { label: 'Все', value: null },
  { label: 'Пуховики', value: 'puhoviki' },
  { label: 'Костюмы', value: 'kostyumy' },
  { label: 'Обувь', value: 'obuv' },
  { label: 'Трикотаж', value: 'trikotazh' },
  { label: 'Платья', value: 'platya' },
  { label: 'Аксессуары', value: 'aksessuary' },
]

function priceFor(product) {
  const value = product.sale_price || product.price || 0
  return Number(value).toLocaleString('ru-RU')
}

export default function CatalogPreview({ user, onRequireAccess }) {
  const navigate = useNavigate()
  const [active, setActive] = useState(FILTERS[0])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('id, name, price, sale_price, images, category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (active.value) {
        query = query.eq('category', active.value)
      }

      const { data } = await query
      if (!cancelled) {
        setItems(data || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [active.value])

  const showTiles = useMemo(() => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => ({ id: `s-${i}`, __skeleton: true }))
    }
    return items
  }, [items, loading])

  const openCatalog = () => {
    if (!user) {
      onRequireAccess?.()
      return
    }
    navigate('/catalog')
  }

  return (
    <section className="bg-white" id="looks">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">1 500+ образов</h2>
            <p className="mt-2 text-sm text-gray-600">
              Выбери направление и загляни внутрь. Полный каталог открывается после входа.
            </p>
          </div>
          <button
            type="button"
            onClick={openCatalog}
            className="inline-flex h-11 items-center justify-center rounded-md bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Открыть полный каталог
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isActive = f.label === active.label
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setActive(f)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'bg-pink-100 text-pink-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {showTiles.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl bg-gray-100">
              {p.__skeleton ? (
                <div className="aspect-[3/4] w-full animate-pulse bg-gray-200" />
              ) : (
                <Link to={`/product/${p.id}`}>
                  <img
                    src={p.images?.[0] || `https://picsum.photos/seed/${p.id}/700/900`}
                    alt={p.name}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              )}

              {!p.__skeleton && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
                  <div className="text-sm font-medium text-white line-clamp-1">{p.name}</div>
                  <div className="mt-1 text-sm text-white/90">{priceFor(p)} ₸</div>
                </div>
              )}
            </div>
          ))}

          <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <div>
              <div className="text-2xl font-semibold text-gray-900">+1 495</div>
              <div className="mt-2 text-sm text-gray-600">товаров внутри клуба</div>
              <button
                type="button"
                onClick={openCatalog}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-xs font-medium text-gray-900 transition-colors hover:border-gray-900"
              >
                Открыть каталог
              </button>
            </div>
          </div>
        </div>

        {!user && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            Чтобы добавить в корзину и оформить заказ, нужно войти.{' '}
            <button type="button" onClick={() => onRequireAccess?.()} className="underline">
              Получить доступ
            </button>
            .
          </div>
        )}
      </div>
    </section>
  )
}

