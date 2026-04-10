import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

export default function ProductCard({ product, wished, onToggleWishlist, onAddedToCart }) {
  const addItem = useCartStore((state) => state.addItem)
  const [showCart, setShowCart] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const oldPrice = product.old_price ?? (product.sale_price ? product.price : null)
  const price = product.sale_price || product.price || 0
  const stock =
    typeof product.stock === 'number'
      ? product.stock
      : (product.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)

  const handleAdd = () => {
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
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#f0ede8] group">
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {product.is_hit && (
            <span className="absolute top-2 left-2 bg-[#1a1a18] text-white text-[9px] font-medium px-1.5 py-0.5 rounded z-10">
              hit
            </span>
          )}
          {product.is_new && !product.is_hit && (
            <span className="absolute top-2 left-2 bg-[#f0ede8] text-[#1a1a18] text-[9px] font-medium px-1.5 py-0.5 rounded z-10">
              new
            </span>
          )}
          {oldPrice && (
            <span className="absolute top-2 left-2 bg-[#e8453c] text-white text-[9px] font-medium px-1.5 py-0.5 rounded z-10">
              -{Math.round((1 - (price || 0) / oldPrice) * 100)}%
            </span>
          )}
          {stock <= 3 && stock > 0 && (
            <span className="absolute bottom-12 left-2 bg-[#e8453c] text-white text-[9px] px-1.5 py-0.5 rounded z-10">
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

          <div
            className={`
              absolute bottom-0 left-0 right-0 bg-[#1a1a18] py-2.5 z-30 transition-transform duration-200
              ${showCart ? 'translate-y-0' : 'translate-y-full'}
              md:translate-y-full md:group-hover:translate-y-0
            `}
            onClick={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAdd()
                setShowCart(false)
              }}
              className="w-full text-white text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <ShoppingBag size={13} />
              В корзину
            </button>
          </div>
        </div>

        <div className="pt-2 px-0.5">
          <p className="text-[10px] text-[#aaa] uppercase tracking-wide mb-0.5">
            {product.category}
          </p>
          <p className="text-xs text-[#1a1a18] leading-tight mb-1 line-clamp-2">
            {product.name}
          </p>
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
      </Link>

      <div
        className="absolute inset-0 z-20 md:hidden"
        style={{ bottom: '60px' }}
        onClick={(e) => {
          e.preventDefault()
          if (showCart) {
            window.location.href = `/product/${product.id}`
            return
          }
          setShowCart(true)
          clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setShowCart(false), 2000)
        }}
      />
    </div>
  )
}

