import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

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
  const location = useLocation()
  const items = useCartStore((state) => state.items)
  const setIsOpen = useCartStore((state) => state.setIsOpen)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

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
          <Search className="w-5 h-5 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors hidden lg:block" />
          <Heart className="w-5 h-5 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors hidden lg:block" />
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
            <Link to="/account" onClick={() => setIsMenuOpen(false)}>
              <User className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
