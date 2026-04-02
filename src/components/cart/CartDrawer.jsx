import { useNavigate } from 'react-router-dom'
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

export default function CartDrawer() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const setIsOpen = useCartStore((state) => state.setIsOpen)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const total = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  function handleCheckout() {
    setIsOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Корзина ({items.length} {pluralItems(items.length)})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Закрыть корзину"
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
            <ShoppingBag className="w-14 h-14 text-gray-200" />
            <p className="text-sm">Корзина пуста</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {items.map((item, idx) => (
              <div key={`${item.id}-${item.color}-${item.size}-${idx}`} className="flex gap-3">
                {/* Image */}
                <div className="w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={item.image || `https://picsum.photos/seed/${item.id}/160/213`}
                    alt={item.name}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                  {(item.color || item.size) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[item.color, item.size].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                  </p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:border-gray-900 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:border-gray-900 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      className="ml-auto p-1 text-gray-300 hover:text-red-500 transition-colors"
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Итого</span>
              <span className="text-lg font-bold text-gray-900">
                {total.toLocaleString('ru-RU')} ₸
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-gray-900 text-white text-sm font-medium tracking-wide rounded hover:bg-gray-700 transition-colors"
            >
              Оформить заказ
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function pluralItems(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'товар'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'товара'
  return 'товаров'
}
