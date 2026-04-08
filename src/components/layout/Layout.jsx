import { Outlet, Link, useLocation } from 'react-router-dom'
import Header from './Header'
import CartDrawer from '../cart/CartDrawer'
import { Home, Grid, Heart, User } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const pathname = location.pathname

  const navItems = [
    {
      label: 'Главная',
      to: '/',
      Icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Каталог',
      to: '/catalog',
      Icon: Grid,
      isActive: pathname.startsWith('/catalog'),
    },
    {
      label: 'Избранное',
      to: '/account/wishlist',
      Icon: Heart,
      isActive: pathname.startsWith('/account/wishlist'),
    },
    {
      label: 'Профиль',
      to: '/account',
      Icon: User,
      isActive: pathname.startsWith('/account') && !pathname.startsWith('/account/wishlist'),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8e0d5] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div
            className="grid grid-cols-4"
            style={{ background: 'rgba(250,248,244,0.97)' }}
          >
            {navItems.map(({ label, to, Icon, isActive }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center py-3"
                style={{ color: isActive ? '#b8975a' : '#8c7b6b' }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-widest mt-0.5">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <CartDrawer />
    </div>
  )
}
