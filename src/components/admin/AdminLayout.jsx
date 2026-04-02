import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Handshake,
  FileText,
  Tag,
  Images,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { label: 'Дашборд', icon: LayoutDashboard, to: '/admin' },
  { label: 'Товары', icon: Package, to: '/admin/products' },
  { label: 'Заказы', icon: ShoppingBag, to: '/admin/orders' },
  { label: 'Покупатели', icon: Users, to: '/admin/customers' },
  { label: 'Партнёры', icon: Handshake, to: '/admin/partners' },
  { label: 'Блог', icon: FileText, to: '/admin/blog' },
  { label: 'Баннеры', icon: Images, to: '/admin/banners' },
  { label: 'Промокоды', icon: Tag, to: '/admin/promo' },
]

function SidebarContent({ onClose }) {
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <span className="text-sm font-bold tracking-[0.15em] text-white">CAPRICCIO ADMIN</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-gray-900">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-4 bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold tracking-widest text-gray-900">CAPRICCIO ADMIN</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
