import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

const POPULAR_QUERIES = ['Пуховик', 'Костюм 35+', 'Образ на встречу', 'Трикотаж', 'Скидки']
const HISTORY_KEY = 'capriccio_search_history'

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  } catch {
    return []
  }
}

function writeHistory(next) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 5)))
  } catch {
    // ignore
  }
}

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!open) return
    setHistory(readHistory())
    // delay focus to next tick so the input exists
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  const normalized = query.trim()

  useEffect(() => {
    if (!open) return undefined
    if (normalized.length < 2) {
      setResults([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id, name, price, sale_price, images, category')
        .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%,category.ilike.%${normalized}%`)
        .eq('is_active', true)
        .limit(5)

      if (cancelled) return
      setResults(data || [])
      setLoading(false)
    }, 300)

    const trackTimer = window.setTimeout(() => {
      if (!cancelled) trackEvent('search', { query: normalized })
    }, 1000)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(trackTimer)
    }
  }, [normalized, open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const shownHistory = useMemo(() => history.filter(Boolean).slice(0, 5), [history])

  const commitQueryToHistory = (q) => {
    const next = [q, ...readHistory().filter((h) => h !== q)]
    writeHistory(next)
    setHistory(next)
  }

  const applyQuery = (q) => {
    setQuery(q)
    commitQueryToHistory(q)
  }

  const onPickResult = (pickedQuery) => {
    if (pickedQuery) commitQueryToHistory(pickedQuery)
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-white">
      <div className="sticky top-0 z-10 border-b border-[#f0ede8] bg-white">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#f5f2ed] px-3 py-2">
            <Search size={14} className="text-[#888780] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск образов и товаров..."
              className="w-full bg-transparent text-sm text-[#1a1a18] outline-none placeholder:text-[#aaa]"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl border border-[#f0ede8] flex items-center justify-center text-[#888780] hover:text-[#1a1a18] hover:border-[#1a1a18] transition-colors"
            aria-label="Закрыть поиск"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5">
          <div className="text-xs font-medium text-[#888780] uppercase tracking-widest mb-3">Популярное</div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => applyQuery(q)}
                className="rounded-full border border-[#e0ddd8] px-3 py-1.5 text-xs text-[#1a1a18] hover:border-[#1a1a18] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {shownHistory.length > 0 && (
          <div className="mb-5">
            <div className="text-xs font-medium text-[#888780] uppercase tracking-widest mb-3">История</div>
            <div className="flex flex-wrap gap-2">
              {shownHistory.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => applyQuery(h)}
                  className="rounded-full bg-[#f0ede8] px-3 py-1.5 text-xs text-[#1a1a18] hover:bg-[#e8e4df] transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-[#888780] uppercase tracking-widest mb-3">Результаты</div>
          {normalized.length < 2 ? (
            <p className="text-sm text-[#888780]">Введите минимум 2 символа</p>
          ) : loading ? (
            <p className="text-sm text-[#888780]">Ищем...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-[#888780]">Ничего не найдено</p>
          ) : (
            <div className="rounded-2xl border border-[#f0ede8] overflow-hidden">
              {results.map((p) => {
                const price = p.sale_price || p.price || 0
                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    onClick={() => onPickResult(normalized)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#f0ede8] last:border-b-0 hover:bg-[#faf8f4] transition-colors"
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-[#f0ede8] flex-shrink-0">
                      <img
                        src={p.images?.[0] || `https://picsum.photos/seed/search-${p.id}/120/120`}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1a1a18] line-clamp-1">{p.name}</div>
                      <div className="text-xs text-[#888780] line-clamp-1">{p.category}</div>
                    </div>
                    <div className="text-sm font-medium text-[#1a1a18]">
                      {Number(price).toLocaleString('ru-RU')} ₸
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

