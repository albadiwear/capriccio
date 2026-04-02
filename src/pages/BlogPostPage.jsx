import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Send, MessageCircle, Link2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function RelatedPostCard({ post }) {
  return (
    <article className="group">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="overflow-hidden rounded-lg">
          <img
            src={post.preview_image || 'https://picsum.photos/seed/blog-related/800/450'}
            alt={post.title}
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="mt-4">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {post.category}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
            {post.title}
          </h3>
        </div>
      </Link>
    </article>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!data) {
        navigate('/blog', { replace: true })
        return
      }

      setPost(data)

      const { data: related } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .eq('category', data.category)
        .neq('slug', data.slug)
        .order('published_at', { ascending: false })
        .limit(3)

      setRelatedPosts(related || [])
      setLoading(false)
    }

    loadPost()
  }, [slug, navigate])

  const pageUrl =
    typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="mt-6 aspect-video rounded-lg bg-gray-200" />
          <div className="mt-6 h-5 w-40 rounded bg-gray-200" />
          <div className="mt-4 h-10 w-5/6 rounded bg-gray-200" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="bg-white px-4 py-8 sm:px-6 md:py-16">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="transition-colors hover:text-gray-900">
            Главная
          </Link>
          <span>→</span>
          <Link to="/blog" className="transition-colors hover:text-gray-900">
            Блог
          </Link>
          <span>→</span>
          <span className="text-gray-500">{post.title}</span>
        </nav>

        <img
          src={post.preview_image || 'https://picsum.photos/seed/blog-post/1200/700'}
          alt={post.title}
          className="aspect-video w-full rounded-2xl object-cover"
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {post.category}
          </span>
          <span className="text-sm text-gray-400">{formatDate(post.published_at)}</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900 md:text-4xl">
          {post.title}
        </h1>

        <div className="prose prose-gray mt-8 max-w-none text-gray-600">
          <div className="whitespace-pre-wrap leading-8">{post.content}</div>
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Поделиться</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
            >
              <Send className="h-4 w-4" />
              Telegram
            </a>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${pageUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
            >
              <Link2 className="h-4 w-4" />
              {copied ? 'Ссылка скопирована' : 'Копировать ссылку'}
            </button>
          </div>
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <div className="mx-auto mt-20 max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Похожие статьи</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <RelatedPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
