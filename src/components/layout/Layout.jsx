import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import CartDrawer from '../cart/CartDrawer'
import { useAuthStore } from '../../store/authStore'
import InnerHeader from './InnerHeader'
import BottomNav from './BottomNav'
import DesktopNav from './DesktopNav'

export default function Layout() {
  const location = useLocation()
  const pathname = location.pathname
  const user = useAuthStore((state) => state.user)
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {!isHome && !user && (
        <div style={{ background: '#111111', padding: '7px 16px', textAlign: 'center', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
          Бесплатная доставка от 50 000 ₸ · Возврат 14 дней
        </div>
      )}

      {!isHome && !user && <Header />}

      {!isHome && user && (
        <>
          <div className="md:hidden">
            <InnerHeader />
          </div>
          <div className="hidden md:block">
            <DesktopNav />
          </div>
        </>
      )}

      <main className={`flex-1 ${user && !isHome ? 'pb-20 md:pb-0' : ''}`}>
        <Outlet />
      </main>

      <BottomNav />

      <CartDrawer />
    </div>
  )
}
