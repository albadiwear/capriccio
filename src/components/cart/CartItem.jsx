import { formatPrice } from '../../utils/helpers'

export function CartItem({ item, onRemove, onQuantityChange }) {
  return (
    <div className="flex gap-4 bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex-shrink-0 h-24 w-24 bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              −
            </button>
            <span className="px-4">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <span className="font-bold text-lg">
            {formatPrice(item.price * item.quantity)}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export function CartSummary({ total }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Итого</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-gray-600">
          <span>Сумма товаров:</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Доставка:</span>
          <span>Бесплатно</span>
        </div>
      </div>
      <div className="border-t pt-4 flex justify-between text-xl font-bold text-gray-900 mb-4">
        <span>Итого к оплате:</span>
        <span>{formatPrice(total)}</span>
      </div>
      <button className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition">
        Оформить заказ
      </button>
    </div>
  )
}
