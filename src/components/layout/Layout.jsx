import { Outlet, Link, useLocation } from 'react-router-dom'
import Header from './Header'
import CartDrawer from '../cart/CartDrawer'
import { Home, Grid, Search, User } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const pathname = location.pathname

  const navItems = [
    { label: 'Главная', to: '/', Icon: Home, isActive: pathname === '/' },
    { label: 'Каталог', to: '/catalog', Icon: Grid, isActive: pathname.startsWith('/catalog') },
    { label: 'Поиск', to: '/search', Icon: Search, isActive: pathname === '/search' },
    { label: 'Профиль', to: '/account', Icon: User, isActive: pathname.startsWith('/account') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <div style={{ background: '#111111', padding: '7px 16px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
        Бесплатная доставка от 50 000 ₸ · Возврат 14 дней
      </div>

      <Header />

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ borderTop: '0.5px solid #ebebeb', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-4">
            {navItems.map(({ label, to, Icon, isActive }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center py-3"
                style={{ color: isActive ? '#111111' : '#aaaaaa', textDecoration: 'none' }}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <CartDrawer />
    </div>
  )
}
