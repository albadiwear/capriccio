import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Users2,
  Handshake,
  GraduationCap,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { label: 'Дашборд', icon: LayoutDashboard, to: '/admin', adminOnly: true },
  { label: 'Товары', icon: Package, to: '/admin/products', adminOnly: true },
  { label: 'Команда', icon: Users2, to: '/admin/team', adminOnly: true },
  { label: 'Лиды', icon: Users, to: '/admin/leads' },
  { label: 'Заказы', icon: ShoppingBag, to: '/admin/orders' },
  { label: 'Партнёры', icon: Handshake, to: '/admin/partners', adminOnly: true },
  { label: 'Академия', icon: GraduationCap, to: '/admin/academy', badgeKey: 'academy', adminOnly: true },
  { label: 'Чаты', icon: MessageCircle, to: '/admin/chats', badgeKey: 'chats' },
]

const CONTENT_ITEMS = [
  { label: 'Баннеры', to: '/admin/banners' },
  { label: 'Блог', to: '/admin/blog' },
  { label: 'Промокоды', to: '/admin/promo' },
  { label: 'Отзывы', to: '/admin/reviews' },
  { label: 'Уведомления', to: '/admin/notifications' },
]

function SidebarContent({ onClose, pendingCount, unreadChatsCount }) {
  const location = useLocation()
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)
  const isContentRoute = CONTENT_ITEMS.some((item) => location.pathname === item.to)
  const [contentOpen, setContentOpen] = useState(isContentRoute)
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const [userRole, setUserRole] = useState(null)
  const effectiveRole = userRole ?? (adminEmail && user?.email === adminEmail ? 'admin' : null)

  useEffect(() => {
    if (isContentRoute) setContentOpen(true)
  }, [isContentRoute])

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUserRole(data?.role ?? null))
  }, [user?.id])

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
        {NAV_ITEMS.filter((item) => !item.adminOnly || effectiveRole === 'admin').map(({ label, icon: Icon, to, badgeKey }) => {
          const badge = badgeKey === 'academy' && pendingCount > 0
            ? pendingCount
            : badgeKey === 'chats' && unreadChatsCount > 0
              ? unreadChatsCount
              : 0
          return (
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
              {badge > 0 && (
                <span className="ml-auto bg-[#D4537E] text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {badge}
                </span>
              )}
            </NavLink>
          )
        })}

        {effectiveRole === 'admin' && <div className="pt-1">
          <button
            onClick={() => setContentOpen((current) => !current)}
            className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isContentRoute
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>Контент</span>
            {contentOpen ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {contentOpen && (
            <div className="mt-1 space-y-0.5">
              {CONTENT_ITEMS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block rounded-lg py-2 pl-8 pr-3 text-xs transition-colors ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>}
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
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadChatsCount, setUnreadChatsCount] = useState(0)

  useEffect(() => {
    async function loadPending() {
      const { count } = await supabase
        .from('academy_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingCount(count || 0)
    }
    loadPending()
  }, [])

  useEffect(() => {
    async function loadUnreadChats() {
      try {
        const { data: chatRows } = await supabase
          .from('stylist_chats')
          .select('id, last_read_at')
          .order('updated_at', { ascending: false })
          .limit(200)

        if (!chatRows || chatRows.length === 0) {
          setUnreadChatsCount(0)
          return
        }

        let total = 0
        for (const chat of chatRows) {
          const { count } = await supabase
            .from('stylist_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('role', 'manager')
            .gt('created_at', chat.last_read_at || '2000-01-01')
          total += count || 0
        }
        setUnreadChatsCount(total)
      } catch {}
    }

    loadUnreadChats()

    try {
      const channel = supabase
        .channel('admin-sidebar-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stylist_messages' }, () => loadUnreadChats())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stylist_chats' }, () => loadUnreadChats())
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    } catch {}
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-gray-900">
        <SidebarContent pendingCount={pendingCount} unreadChatsCount={unreadChatsCount} />
      </aside>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-opacity ${
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-[100dvh] w-64 bg-gray-900 flex flex-col transform transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent onClose={() => setSidebarOpen(false)} pendingCount={pendingCount} unreadChatsCount={unreadChatsCount} />
        </aside>
      </div>

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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" data-scroll-container="app">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
