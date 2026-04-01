import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

const navigationItems = [
  { label: 'Каталог', to: '/catalog', match: (pathname) => pathname === '/catalog' },
  { label: 'Пуховики', to: '/catalog/puhoviki', match: (pathname) => pathname === '/catalog/puhoviki' },
  { label: 'Костюмы', to: '/catalog/kostyumy', match: (pathname) => pathname === '/catalog/kostyumy' },
  { label: 'Трикотаж', to: '/catalog/trikotazh', match: (pathname) => pathname === '/catalog/trikotazh' },
  { label: 'Блог', to: '/blog', match: (pathname) => pathname === '/blog' || pathname.startsWith('/blog/') },
]

export default function Header() {
  const location = useLocation()
  const cartItemsCount = useCartStore((state) => state.items.length)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const getNavLinkClassName = (item) => {
    const isActive = item.match(location.pathname)

    return [
      'border-b-2 px-1 py-1 text-sm tracking-wide text-gray-800 transition-all duration-200',
      isActive ? 'border-black' : 'border-transparent hover:border-gray-900',
    ].join(' ')
  }

  return (
    <header className={`sticky top-0 z-50 bg-white border-b border-gray-100 transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-bold uppercase tracking-[0.35em] text-gray-800 sm:text-xl">
          Capriccio
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigationItems.map((item) => (
            <Link key={item.to} to={item.to} className={getNavLinkClassName(item)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button type="button" aria-label="Поиск" className="text-gray-800 transition-colors duration-200 hover:text-black">
            <Search className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Избранное" className="text-gray-800 transition-colors duration-200 hover:text-black">
            <Heart className="h-5 w-5" />
          </button>
          <Link to="/checkout" aria-label="Корзина" className="relative text-gray-800 transition-colors duration-200 hover:text-black">
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <Link to="/account" aria-label="Профиль" className="text-gray-800 transition-colors duration-200 hover:text-black">
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium tracking-wide text-gray-800 transition-all duration-200 hover:border-black hover:text-black"
          >
            Войти
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link to="/checkout" aria-label="Корзина" className="relative text-gray-800 transition-colors duration-200 hover:text-black">
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="text-gray-800 transition-colors duration-200 hover:text-black"
            onClick={() => setIsMobileMenuOpen((prevState) => !prevState)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6">
            {navigationItems.map((item) => (
              <Link key={item.to} to={item.to} className={`${getNavLinkClassName(item)} w-fit`}>
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-gray-800">
              <button type="button" aria-label="Поиск" className="transition-colors duration-200 hover:text-black">
                <Search className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Избранное" className="transition-colors duration-200 hover:text-black">
                <Heart className="h-5 w-5" />
              </button>
              <Link to="/account" aria-label="Профиль" className="transition-colors duration-200 hover:text-black">
                <User className="h-5 w-5" />
              </Link>
            </div>
            <Link
              to="/login"
              className="mt-4 w-full rounded-full border border-gray-200 px-4 py-3 text-center text-sm font-medium tracking-wide text-gray-800 transition-all duration-200 hover:border-black hover:text-black"
            >
              Войти
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
