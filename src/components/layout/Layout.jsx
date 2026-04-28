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
  const loading = useAuthStore((state) => state.loading)

  const isHome = pathname === '/'
  const isAdmin = pathname.startsWith('/admin')
  const isBlog = pathname.startsWith('/blog')

  // Пока сессия загружается — показываем пустую шапку без меню
  if (loading && !isHome && !isAdmin) {
    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-white">
        <div className="h-[52px] border-b border-[#f0ede8] bg-white flex items-center justify-center">
          <span className="text-sm font-medium tracking-widest text-[#1a1a18]">CAPRICCIO</span>
        </div>
        <main className="flex-1 overflow-y-auto" data-scroll-container="app">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-white">
      {/* Старый хедер — только незалогиненным и не на главной/админке/блоге */}
      {!user && !isHome && !isAdmin && !isBlog && <Header />}

      {isBlog && (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="text-sm font-semibold tracking-[0.35em]">CAPRICCIO</a>
            <a href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Блог</a>
            <a href="/#access" className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-gray-900 transition-colors hover:border-gray-900">Войти</a>
          </div>
        </header>
      )}

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

      <main
        className={`flex-1 overflow-y-auto ${user && !isHome && !isAdmin ? 'pb-20 md:pb-0' : ''}`}
        data-scroll-container="app"
      >
        <Outlet />
      </main>

      {user && !isHome && !isAdmin && <BottomNav />}
      {user && !isHome && !isAdmin && <CartDrawer />}
    </div>
  )
}
