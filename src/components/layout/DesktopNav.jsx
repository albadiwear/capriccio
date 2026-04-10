import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useWishlistStore } from '../../store/wishlistStore'

function isActive(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname.startsWith(to)
}

export default function DesktopNav() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const setCartOpen = useCartStore((state) => state.setIsOpen)
  const cartQty = useCartStore((state) => state.items.reduce((sum, i) => sum + (i.quantity || 0), 0))

  const wishlistCount = useWishlistStore((state) => state.count)
  const loadWishlist = useWishlistStore((state) => state.load)

  useEffect(() => {
    if (!user?.id) return
    loadWishlist(user.id)
  }, [loadWishlist, user?.id])

  const links = [
    { label: 'Каталог', to: '/catalog' },
    { label: 'Стилист', to: '/stylist' },
    { label: 'Академия', to: '/academy' },
    { label: 'Избранное', to: '/account/wishlist' },
    { label: 'Кабинет', to: '/account' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#f0ede8] bg-white">
      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-6">
        <Link to="/catalog" className="text-sm font-medium tracking-widest text-[#1a1a18]">
          CAPRICCIO
        </Link>

        <nav className="flex items-center gap-7 text-sm">
          {links.map((l) => {
            const active = l.to === '/stylist' ? pathname === '/stylist' : isActive(pathname, l.to)
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`${
                  l.to === '/stylist'
                    ? `text-sm flex items-center gap-1.5 ${
                        active ? 'text-[#1a1a18] font-medium' : 'text-[#888780] hover:text-[#1a1a18]'
                      }`
                    : `${active ? 'font-medium text-[#1a1a18]' : 'text-[#888780]'} transition-colors hover:text-[#1a1a18]`
                }`}
              >
                {l.to === '/stylist' ? (
                  <>
                    <Sparkles size={14} />
                    Стилист
                  </>
                ) : (
                  l.label
                )}
                {l.to === '/account/wishlist' && wishlistCount > 0 ? ` (${wishlistCount})` : ''}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/catalog" aria-label="Поиск" className="text-[#1a1a18]">
            <Search size={20} />
          </Link>

          <Link to="/account/wishlist" aria-label="Избранное" className="text-[#1a1a18]">
            <Heart size={20} />
          </Link>

          <button
            type="button"
            aria-label="Корзина"
            onClick={() => setCartOpen(true)}
            className="relative text-[#1a1a18]"
          >
            <ShoppingBag size={20} />
            {cartQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a1a18] px-1 text-[10px] leading-none text-white">
                {cartQty}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
