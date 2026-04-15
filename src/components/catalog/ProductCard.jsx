import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

export default function ProductCard({ product, wished, onToggleWishlist, onAddedToCart, imageLoading = 'lazy' }) {
  const addItem = useCartStore((state) => state.addItem)
  const [tapped, setTapped] = useState(false)
  const timerRef = useRef(null)

  const oldPrice = product.old_price ?? (product.sale_price ? product.price : null)
  const price = product.sale_price || product.price || 0
  const stock =
    typeof product.stock === 'number'
      ? product.stock
      : (product.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleTap = (e) => {
    if (window.matchMedia('(hover: none)').matches) {
      // Mobile: first tap shows the button for 2s (no navigation)
      if (!tapped) {
        e.preventDefault()
        e.stopPropagation()
        setTapped(true)
        if (timerRef.current) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => setTapped(false), 2000)
        return
      }
      // If already tapped, let the Link navigate on the next tap
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: product.id,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      quantity: 1,
      size: null,
    })
    onAddedToCart?.()
  }

  return (
    <div className="relative">
      <Link to={`/product/${product.id}`} className="block group" onClick={handleTap}>
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#f0ede8]">
          <img
            loading={imageLoading}
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
          />

          {product.is_hit && (
            <span className="absolute top-2 left-2 bg-[#1a1a18] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full z-10">
              hit
            </span>
          )}
          {product.is_new && !product.is_hit && !oldPrice && (
            <span className="absolute top-2 left-2 bg-white/90 text-[#1a1a18] text-[9px] font-medium px-1.5 py-0.5 rounded-full z-10">
              new
            </span>
          )}
          {oldPrice && (
            <span className="absolute top-2 left-2 bg-[#e8453c] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full z-10">
              -{Math.round((1 - (price || 0) / oldPrice) * 100)}%
            </span>
          )}
          {stock <= 3 && stock > 0 && (
            <span className="absolute top-2 right-10 bg-[#e8453c] text-white text-[9px] px-1.5 py-0.5 rounded-full z-10">
              Осталось {stock}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist?.(product.id)
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center z-30"
            aria-label="В избранное"
          >
            <Heart size={13} className={wished ? 'fill-[#1a1a18] text-[#1a1a18]' : 'text-[#1a1a18]'} />
          </button>
        </div>

        <div className="px-2 pt-2 pb-1">
          <p className="text-[10px] text-[#aaa] uppercase tracking-wide mb-0.5 truncate">
            {product.category}
          </p>
          <p className="text-xs text-[#1a1a18] leading-tight mb-1.5 line-clamp-2 min-h-[2rem]">
            {product.name}
          </p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              {oldPrice && (
                <span className="text-[10px] text-[#bbb] line-through">
                  {Number(oldPrice).toLocaleString('ru-RU')} ₸
                </span>
              )}
              <span className="text-sm font-medium text-[#1a1a18]">
                {Number(price).toLocaleString('ru-RU')} ₸
              </span>
            </div>
          </div>

          <div
            className={`
              overflow-hidden transition-[max-height,opacity] duration-200
              md:max-h-0 md:opacity-0 md:group-hover:max-h-20 md:group-hover:opacity-100
              ${tapped ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 md:max-h-0 md:opacity-0'}
            `}
          >
            <button
              type="button"
              onClick={handleAdd}
              className={`
                w-full bg-[#1a1a18] text-white rounded-lg py-2.5 text-xs font-medium
                flex items-center justify-center gap-1.5
                ${tapped ? 'pointer-events-auto' : 'pointer-events-none md:pointer-events-auto'}
              `}
              aria-label="В корзину"
            >
              <ShoppingBag size={13} className="text-white" />
              В корзину
            </button>
          </div>
        </div>
      </Link>
    </div>
  )
}
