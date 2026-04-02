import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function OrderSuccessPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Заказ оформлен!</h1>
        {id && (
          <p className="text-sm text-gray-500 mb-3">
            Номер заказа: <span className="font-medium text-gray-900">#{id}</span>
          </p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/catalog"
            className="px-6 py-3 border border-gray-200 rounded text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            Вернуться в каталог
          </Link>
          <Link
            to="/account/orders"
            className="px-6 py-3 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Мои заказы
          </Link>
        </div>
      </div>
    </div>
  )
}
