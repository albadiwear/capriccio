import { useEffect, useMemo, useState } from 'react'
import { Check, MessageSquare, Trash2, EyeOff, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На модерации' },
  { value: 'published', label: 'Опубликованные' },
]

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= Number(rating || 0)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)

    const { data } = await supabase
      .from('reviews')
      .select('*, products(name, images)')
      .order('created_at', { ascending: false })

    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleApprove(id) {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    setReviews((current) =>
      current.map((review) =>
        review.id === id ? { ...review, is_approved: true } : review
      )
    )
  }

  async function handleHide(id) {
    await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
    setReviews((current) =>
      current.map((review) =>
        review.id === id ? { ...review, is_approved: false } : review
      )
    )
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить этот отзыв?')) return

    await supabase.from('reviews').delete().eq('id', id)
    setReviews((current) => current.filter((review) => review.id !== id))
  }

  const pendingCount = useMemo(
    () => reviews.filter((review) => !review.is_approved).length,
    [reviews]
  )

  const filteredReviews = useMemo(() => {
    if (filter === 'pending') {
      return reviews.filter((review) => !review.is_approved)
    }

    if (filter === 'published') {
      return reviews.filter((review) => review.is_approved)
    }

    return reviews
  }, [reviews, filter])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Отзывы</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ожидают модерации: <span className="font-medium text-gray-900">{pendingCount}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded px-4 py-2 text-sm transition-colors ${
                filter === item.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <MessageSquare className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm">Отзывы не найдены</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Товар</th>
                <th className="px-4 py-3 text-left font-medium">Автор</th>
                <th className="px-4 py-3 text-left font-medium">Оценка</th>
                <th className="px-4 py-3 text-left font-medium">Текст</th>
                <th className="px-4 py-3 text-right font-medium">Дата</th>
                <th className="px-4 py-3 text-center font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => {
                const product = review.products
                const image = product?.images?.[0] || 'https://picsum.photos/seed/review-product/80/80'

                return (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          <img
                            src={image}
                            alt={product?.name || 'Товар'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-medium text-gray-900">
                            {product?.name || 'Товар удалён'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {review.author_name || 'Покупатель'}
                    </td>
                    <td className="px-4 py-3">
                      <RatingStars rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p className="max-w-md line-clamp-3">{review.text || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          review.is_approved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {review.is_approved ? 'Опубликован' : 'На модерации'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="inline-flex items-center gap-1 rounded bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Опубликовать
                        </button>
                        <button
                          onClick={() => handleHide(review.id)}
                          className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2.5 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-200"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Скрыть
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="inline-flex items-center gap-1 rounded bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
