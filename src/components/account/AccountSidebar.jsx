import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, ShoppingBag, MapPin, Heart, Users, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { label: 'Профиль', icon: User, to: '/account' },
  { label: 'Мои заказы', icon: ShoppingBag, to: '/account/orders' },
  { label: 'Мои адреса', icon: MapPin, to: '/account/addresses' },
  { label: 'Избранное', icon: Heart, to: '/account/wishlist' },
  { label: 'Партнёрская программа', icon: Users, to: '/account/partner' },
]

function useAccountNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (to) => {
    if (to === '/account') return location.pathname === '/account'
    return location.pathname.startsWith(to)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return { isActive, handleSignOut }
}

export function AccountSidebarMobile() {
  const { isActive } = useAccountNav()

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-1 lg:hidden">
      {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
        <Link
          key={to}
          to={to}
          className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
            isActive(to)
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}

export function AccountSidebarDesktop() {
  const { isActive, handleSignOut } = useAccountNav()

  return (
    <aside className="hidden rounded-2xl bg-white p-4 shadow-sm lg:block">
      <nav className="space-y-2">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <Link
            key={to}
            to={to}
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
              isActive(to)
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}

        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </nav>
    </aside>
  )
}

export default function AccountSidebar() {
  return (
    <>
      <AccountSidebarMobile />
      <AccountSidebarDesktop />
    </>
  )
}
