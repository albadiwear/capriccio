import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const subtotal = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#888780] text-lg">Корзина пуста</p>
        <Link
          to="/catalog"
          className="bg-[#1a1a18] text-white px-8 py-3 rounded-xl text-sm"
        >
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-medium mb-6 text-[#1a1a18]">Корзина</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map((item, i) => (
          (() => {
            const productId = item.product_id ?? item.id
            const size = item.size ?? null
            return (
          <div
            key={`${productId}-${item.color}-${item.size}-${i}`}
            className="flex gap-4 border border-[#f0ede8] rounded-xl p-4"
          >
            <img
              src={item.image || `https://picsum.photos/seed/cart-${productId}/160/220`}
              alt={item.name}
              className="w-20 h-24 object-cover rounded-lg bg-[#f0ede8] flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a18] mb-1 line-clamp-2">
                {item.name}
              </p>
              {(item.color || item.size) && (
                <p className="text-xs text-[#888780] mb-2">
                  {[item.color, item.size].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#1a1a18]">
                  {Number(item.price).toLocaleString('ru-RU')} ₸
                  <span className="text-xs font-normal text-[#888780]"> × {item.quantity}</span>
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeItem(productId, size)
                  }}
                  className="p-2 text-[#888780] hover:text-[#e8453c] transition-colors cursor-pointer"
                  aria-label="Удалить из корзины"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(productId, size, item.quantity - 1)}
                  className="w-7 h-7 border border-[#e0ddd8] rounded-lg flex items-center justify-center text-sm hover:border-[#1a1a18]"
                  aria-label="Уменьшить количество"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center text-[#1a1a18]">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(productId, size, item.quantity + 1)}
                  className="w-7 h-7 border border-[#e0ddd8] rounded-lg flex items-center justify-center text-sm hover:border-[#1a1a18]"
                  aria-label="Увеличить количество"
                >
                  +
                </button>
              </div>
            </div>
          </div>
            )
          })()
        ))}
      </div>

      <div className="border border-[#f0ede8] rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#888780]">Подытог</span>
          <span className="text-[#1a1a18] font-medium">{subtotal.toLocaleString('ru-RU')} ₸</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/checkout')}
        className="w-full bg-[#1a1a18] text-white px-8 py-3 rounded-xl text-sm font-medium"
      >
        Перейти к оформлению
      </button>

      <div className="mt-4 text-center">
        <Link to="/catalog" className="text-sm text-[#888780] underline hover:text-[#1a1a18]">
          Продолжить покупки
        </Link>
      </div>
      </div>
    </div>
  )
}
