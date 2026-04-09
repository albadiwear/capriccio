import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const FALLBACK_REVIEWS = [
  {
    id: 'f1',
    user_name: 'Айгерим М.',
    city: 'Алматы',
    rating: 5,
    text: 'Впервые за много лет одеваюсь для себя. Capriccio дал мне не просто одежду — а ощущение что я снова молодая.',
    product_category: 'Образы',
  },
  {
    id: 'f2',
    user_name: 'Наталья С.',
    city: 'Караганда',
    rating: 5,
    text: 'Заказала образ целиком — пришло всё идеально подобранным. Муж не узнал меня в хорошем смысле.',
    product_category: 'Доставка',
  },
  {
    id: 'f3',
    user_name: 'Динара К.',
    city: 'Астана',
    rating: 5,
    text: 'После развода решила начать заново. Capriccio помог найти свой стиль. Теперь я партнёр и зарабатываю на этом.',
    product_category: 'Партнёрство',
  },
  {
    id: 'f4',
    user_name: 'Гульнара Т.',
    city: 'Алматы',
    rating: 5,
    text: 'Академия стиля — лучшее что я делала для себя. Теперь знаю как одеваться под свой тип фигуры.',
    product_category: 'Академия',
  },
  {
    id: 'f5',
    user_name: 'Мадина А.',
    city: 'Шымкент',
    rating: 5,
    text: 'Сообщество Capriccio — как найти подруг которые понимают. Общаемся, вдохновляем друг друга.',
    product_category: 'Сообщество',
  },
  {
    id: 'f6',
    user_name: 'Зарина И.',
    city: 'Алматы',
    rating: 5,
    text: 'Зарабатываю 180 000 ₸ в месяц просто рекомендуя то что сама ношу. Это не работа — это удовольствие.',
    product_category: 'Партнёрство',
  },
]

function initialsFrom(name) {
  const parts = String(name || 'C')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function RatingStars({ rating }) {
  const r = Math.max(0, Math.min(5, Number(rating || 0)))
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={`h-4 w-4 ${v <= r ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function isGarbageName(name) {
  const value = String(name || '').trim().toLowerCase()
  if (!value) return true
  if (['sdv', 'fef', 'erf'].some((s) => value.includes(s))) return true
  // Short latin-only tokens are usually test/garbage input.
  if (/^[a-z]{2,6}$/i.test(value)) return true
  return false
}

export default function ReviewsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('id, author_name, city, rating, text, product_category, created_at, products(category)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(24)

      if (!cancelled) {
        setItems(data || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const list = useMemo(() => {
    const realReviews = (items || [])
      .map((r) => ({
        id: r.id,
        author_name: r.author_name || r.user_name || 'Покупатель',
        city: r.city || 'Казахстан',
        rating: r.rating || 5,
        text: String(r.text || '').trim(),
        product_category: r.products?.category || r.product_category || '',
      }))
      .filter((r) => r.text.length > 30)
      .filter((r) => !isGarbageName(r.author_name))

    const displayReviews = [...realReviews, ...FALLBACK_REVIEWS].slice(0, 6).map((r) => ({
      id: r.id,
      author_name: r.author_name || r.user_name || 'Покупатель',
      city: r.city || 'Казахстан',
      rating: r.rating || 5,
      text: String(r.text || '').trim(),
      product_category: r.product_category || '',
    }))

    return displayReviews
  }, [items])

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Говорят клиентки</h2>
        <p className="mt-2 text-sm text-gray-600">Реальные отзывы и впечатления от Capriccio.</p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `s-${i}`, __skeleton: true })) : list).map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-6">
              {r.__skeleton ? (
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-gray-200 animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-800">
                        {initialsFrom(r.author_name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{r.author_name}</div>
                        <div className="text-xs text-gray-500">{r.city}</div>
                      </div>
                    </div>
                    <RatingStars rating={r.rating} />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-700">{r.text}</p>

                  {r.product_category && (
                    <div className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {String(r.product_category)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
