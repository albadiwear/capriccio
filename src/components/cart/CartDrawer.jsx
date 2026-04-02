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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">
            Корзина ({items.length} {pluralItems(items.length)})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Закрыть корзину"
            className="flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:text-gray-900"
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
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
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
                      className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 transition-colors hover:border-gray-900"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 transition-colors hover:border-gray-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id, item.color, item.size)}
                      className="ml-auto flex h-10 w-10 items-center justify-center text-gray-300 transition-colors hover:text-red-500"
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
          <div className="space-y-4 border-t border-gray-100 px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Итого</span>
              <span className="text-lg font-bold text-gray-900">
                {total.toLocaleString('ru-RU')} ₸
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="h-12 w-full rounded bg-gray-900 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700"
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
