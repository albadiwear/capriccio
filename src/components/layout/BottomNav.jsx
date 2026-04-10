import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, LayoutGrid, ShoppingBag, Sparkles, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

function isActive(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname.startsWith(to)
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)

  if (!user) return null
  if (pathname === '/') return null

  const items = [
    { label: 'Каталог', to: '/catalog', Icon: LayoutGrid },
    { label: 'Корзина', to: '/cart', Icon: ShoppingBag },
    { label: 'Стилист', to: '/stylist', Icon: Sparkles, isCenter: true },
    { label: 'Академия', to: '/academy', Icon: GraduationCap },
    { label: 'Профиль', to: '/account', Icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#f0ede8] bg-white md:hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-5 items-end py-2">
          {items.map(({ label, to, Icon, isCenter }) => {
            const active = isActive(pathname, to)
            const baseColor = active ? 'text-[#1a1a18]' : 'text-[#c0bdb8]'

            if (isCenter) {
              return (
                <Link key={to} to={to} className="flex flex-col items-center justify-end">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#1a1a18]"
                    style={{ marginTop: '-12px' }}
                    aria-hidden="true"
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="mt-1 text-[8px] font-bold text-[#1a1a18]">Стилист</div>
                </Link>
              )
            }

            return (
              <Link key={to} to={to} className="flex flex-col items-center justify-end py-1">
                <Icon size={20} className={baseColor} />
                <div className="mt-1 text-[8px] text-[#888780]">{label}</div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
