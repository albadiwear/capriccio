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
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Старый хедер — только незалогиненным и не на главной/админке */}
      {!user && !isHome && !isAdmin && <Header />}

      {/* Новый хедер — только залогиненным и не на главной/админке */}
      {user && !isHome && !isAdmin && (
        <>
          <div className="md:hidden">
            <InnerHeader />
          </div>
          <div className="hidden md:block">
            <DesktopNav />
          </div>
        </>
      )}

      <main className={`flex-1 ${user && !isHome && !isAdmin ? 'pb-20 md:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* Нижний бар + корзина — только залогиненным и не на главной/админке */}
      {user && !isHome && !isAdmin && <BottomNav />}

      {user && !isHome && !isAdmin && <CartDrawer />}
    </div>
  )
}
