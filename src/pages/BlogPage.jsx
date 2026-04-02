import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const categories = ['Все', 'Советы', 'Тренды', 'Уход', 'Новости']

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function BlogCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-lg bg-gray-200" />
      <div className="mt-4 h-5 w-24 rounded-full bg-gray-200" />
      <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
      <div className="mt-3 h-6 w-5/6 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
      <div className="mt-5 h-4 w-28 rounded bg-gray-200" />
    </div>
  )
}

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Все')

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      setPosts(data || [])
      setLoading(false)
    }

    loadPosts()
  }, [])

  const filteredPosts =
    activeCategory === 'Все'
      ? posts
      : posts.filter((post) => post.category === activeCategory)

  return (
    <div className="bg-white px-4 py-8 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Capriccio Journal</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-4xl md:text-5xl">Блог</h1>
          <p className="mt-4 text-base text-gray-500 md:text-lg">
            Советы по стилю, тренды и новости Capriccio
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`min-h-12 rounded-full px-5 py-2 text-sm transition-colors ${
                activeCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <BlogCardSkeleton key={index} />)
          ) : (
            filteredPosts.map((post) => (
              <article key={post.id} className="group">
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={post.preview_image || 'https://picsum.photos/seed/blog-preview/800/450'}
                      alt={post.title}
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(post.published_at)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
                      {post.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {(post.content || '').slice(0, 120)}
                      {(post.content || '').length > 120 ? '...' : ''}
                    </p>

                    <span className="mt-5 inline-flex text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-600">
                      Читать далее
                    </span>
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>

        {!loading && filteredPosts.length === 0 && (
          <div className="mt-16 rounded-2xl border border-gray-200 px-6 py-12 text-center text-gray-500">
            В этой категории пока нет статей
          </div>
        )}
      </div>
    </div>
  )
}
