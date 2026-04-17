import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Search, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useCartStore } from '../../store/cartStore'
import SearchOverlay from '../catalog/SearchOverlay'

export default function InnerHeader() {
  const user = useAuthStore((state) => state.user)
  const count = useWishlistStore((state) => state.count)
  const load = useWishlistStore((state) => state.load)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const cartQty = useCartStore((state) => state.items.reduce((sum, i) => sum + (i.quantity || 0), 0))

  useEffect(() => {
    if (!user?.id) return
    load(user.id)
  }, [load, user?.id])

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#f0ede8] bg-white">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/catalog"
            className="text-sm font-medium tracking-widest text-[#1a1a18]"
          >
            CAPRICCIO
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск"
              className="text-[#1a1a18]"
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/cart')}
              aria-label="Корзина"
              className="relative text-[#1a1a18]"
            >
              <ShoppingBag size={20} />
              {cartQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4537E] px-1 text-[10px] leading-none text-white">
                  {cartQty}
                </span>
              )}
            </button>

            <Link to="/account/wishlist" aria-label="Избранное" className="relative text-[#1a1a18]">
              <Heart size={20} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a1a18] px-1 text-[10px] leading-none text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
