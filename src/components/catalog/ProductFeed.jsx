import { useEffect, useMemo, useState } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/cartStore'

function formatKzt(value) {
  return Number(value || 0).toLocaleString('ru-RU') + ' ₸'
}

function computeStock(product) {
  if (typeof product?.stock === 'number') return product.stock
  return (product?.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
}

function computeSizes(product) {
  const map = new Map()
  for (const v of product?.product_variants || []) {
    if (!v?.size) continue
    map.set(v.size, (map.get(v.size) || 0) + (v.stock || 0))
  }
  return Array.from(map.entries()).map(([size, stock]) => ({ size, stock }))
}

export default function ProductFeed({ products, wishlistIds, onToggleWishlist }) {
  const addItem = useCartStore((state) => state.addItem)

  const [selectedSizes, setSelectedSizes] = useState({})
  const [errors, setErrors] = useState({})
  const [reviewCounts, setReviewCounts] = useState({})

  const idsKey = useMemo(() => (products || []).map((p) => p.id).join(','), [products])

  useEffect(() => {
    let cancelled = false

    async function loadCounts() {
      const next = {}
      // Avoid hammering the API if the list is huge.
      const slice = (products || []).slice(0, 40)
      for (const p of slice) {
        const { count } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', true)
          .eq('product_id', p.id)

        next[p.id] = count || 0
      }

      if (!cancelled) setReviewCounts(next)
    }

    loadCounts()
    return () => {
      cancelled = true
    }
  }, [idsKey, products])

  const handleShare = async (productId) => {
    const url = `${window.location.origin}/product/${productId}`
    try {
      if (navigator.share) {
        await navigator.share({ url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore
    }
  }

  const addToCart = (product, selectedSize) => {
    if (!selectedSize) {
      setErrors((p) => ({ ...p, [product.id]: 'Выберите размер' }))
      return
    }
    setErrors((p) => ({ ...p, [product.id]: '' }))

    const price = product.sale_price || product.price || 0
    addItem({
      id: product.id,
      name: product.name,
      price,
      image: product.images?.[0],
      size: selectedSize,
      quantity: 1,
    })
  }

  return (
    <div className="rounded-xl border border-[#f0ede8]">
      {(products || []).map((product) => {
        const wished = wishlistIds?.includes(product.id)
        const price = product.sale_price || product.price
        const oldPrice = product.old_price ?? (product.sale_price ? product.price : null)
        const stock = computeStock(product)
        const sizes = computeSizes(product)
        const selectedSize = selectedSizes[product.id] || ''
        const reviewCount = reviewCounts[product.id] || 0

        return (
          <div key={product.id} className="border-b border-[#f0ede8] last:border-b-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ede8] text-xs font-medium text-[#888780]">
                CA
              </div>
              <div>
                <div className="text-sm font-medium text-[#1a1a18]">Capriccio</div>
                <div className="text-xs text-[#888780]">{product.category}</div>
              </div>
            </div>

            <div className="relative w-full aspect-square">
              <img
                src={product.images?.[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.is_hit && (
                <span className="absolute left-3 top-3 rounded bg-[#1a1a18] px-2 py-0.5 text-[10px] text-white">
                  hit
                </span>
              )}
              {!product.is_hit && product.is_new && (
                <span className="absolute left-3 top-3 rounded bg-[#f0ede8] px-2 py-0.5 text-[10px] text-[#1a1a18]">
                  new
                </span>
              )}
              {!product.is_hit && !product.is_new && oldPrice && (
                <span className="absolute left-3 top-3 rounded bg-[#e8453c] px-2 py-0.5 text-[10px] text-white">
                  -{Math.round((1 - (price || 0) / oldPrice) * 100)}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2">
              <button
                type="button"
                onClick={() => onToggleWishlist?.(product.id)}
                aria-label="В избранное"
                className="text-[#1a1a18]"
              >
                <Heart size={22} className={wished ? 'fill-[#1a1a18]' : ''} />
              </button>
              <button
                type="button"
                onClick={() => handleShare(product.id)}
                aria-label="Поделиться"
                className="text-[#1a1a18]"
              >
                <Share2 size={22} />
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-lg font-medium text-[#1a1a18]">
                  {formatKzt(price)}
                </span>
                {oldPrice && (
                  <span className="text-sm text-[#bbb] line-through">
                    {formatKzt(oldPrice)}
                  </span>
                )}
              </div>
              <div className="mb-1 text-sm text-[#1a1a18]">{product.name}</div>
              <div className="mb-3 text-xs text-[#888780]">
                Носят {reviewCount} женщин
                {stock <= 3 && stock > 0 ? ` · Осталось ${stock} шт.` : ''}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.stock === 0}
                    onClick={() => {
                      setSelectedSizes((p) => ({ ...p, [product.id]: s.size }))
                      setErrors((p) => ({ ...p, [product.id]: '' }))
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      selectedSize === s.size
                        ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                        : s.stock === 0
                          ? 'cursor-not-allowed border-[#f0ede8] text-[#ccc] line-through'
                          : 'border-[#e0ddd8] text-[#1a1a18]'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>

              {errors[product.id] && (
                <div className="mb-2 text-xs text-[#e8453c]">
                  {errors[product.id]}
                </div>
              )}

              <button
                type="button"
                onClick={() => addToCart(product, selectedSize)}
                className="w-full rounded-xl bg-[#1a1a18] py-3 text-sm font-medium text-white"
              >
                В корзину
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

