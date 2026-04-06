import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { supabase } from '../../lib/supabase'

const navItems = [
  { label: 'Каталог', to: '/catalog' },
  { label: 'Пуховики', to: '/catalog/puhoviki' },
  { label: 'Костюмы', to: '/catalog/kostyumy' },
  { label: 'Трикотаж', to: '/catalog/trikotazh' },
  { label: 'Блог', to: '/blog' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const location = useLocation()
  const items = useCartStore((state) => state.items)
  const setIsOpen = useCartStore((state) => state.setIsOpen)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true)

      const { data } = await supabase
        .from('products')
        .select('id, name, price, sale_price, category, images')
        .ilike('name', `%${searchQuery.trim()}%`)
        .eq('is_active', true)
        .limit(6)

      setSearchResults(data || [])
      setSearchLoading(false)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-base font-bold tracking-[0.18em] text-gray-900 sm:text-xl sm:tracking-[0.2em]">
          CAPRICCIO
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm tracking-wide transition-colors duration-200 py-1 ${
                location.pathname === item.to
                  ? 'text-gray-900 border-b border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="hidden lg:flex h-12 w-12 items-center justify-center"
            aria-label="Открыть поиск"
          >
            <Search className="w-5 h-5 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" />
          </button>
          <Link to="/account/wishlist" className="hidden lg:block" aria-label="Избранное">
            <Heart className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center"
            aria-label="Открыть корзину"
          >
            <ShoppingBag className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
          <Link to="/account" className="hidden lg:block">
            <User className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
          </Link>
          <button
            className="flex h-12 w-12 items-center justify-center lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {isMenuOpen
              ? <X className="w-5 h-5 text-gray-600" />
              : <Menu className="w-5 h-5 text-gray-600" />
            }
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-12 items-center border-b border-gray-100 px-4 text-sm text-gray-600 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true)
                setIsMenuOpen(false)
              }}
              aria-label="Открыть поиск"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <Link to="/account/wishlist" onClick={() => setIsMenuOpen(false)} aria-label="Избранное">
              <Heart className="w-5 h-5 text-gray-600" />
            </Link>
            <Link to="/account" onClick={() => setIsMenuOpen(false)}>
              <User className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div ref={searchRef} className="absolute left-0 right-0 top-16 border-b border-gray-200 bg-white shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                autoFocus
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <div className="mt-3">
              {searchQuery.trim().length < 2 ? (
                <p className="text-sm text-gray-400">Введите минимум 2 символа</p>
              ) : searchLoading ? (
                <p className="text-sm text-gray-400">Поиск...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-gray-400">Ничего не найдено</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <img
                        src={product.images?.[0] || 'https://picsum.photos/seed/search-product/120/120'}
                        alt={product.name}
                        className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{product.category || 'Без категории'}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {Number(product.sale_price || product.price || 0).toLocaleString('ru-RU')} ₸
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
