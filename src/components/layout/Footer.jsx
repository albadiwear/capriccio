import { Link } from 'react-router-dom'
import { ExternalLink, Send, MessageCircle, MapPin, Clock, Mail } from 'lucide-react'

const customerLinks = [
  { label: 'Каталог', to: '/catalog' },
  { label: 'Доставка и оплата', to: '/delivery' },
  { label: 'Возврат и обмен', to: '/delivery' },
  { label: 'Таблица размеров', to: '/delivery' },
]

const companyLinks = [
  { label: 'О нас', to: '/about' },
  { label: 'Контакты', to: '/contacts' },
  { label: 'Блог', to: '/blog' },
  { label: 'Партнёрская программа', to: '/account/partner' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: ExternalLink },
  { label: 'Telegram', href: 'https://t.me', icon: Send },
  { label: 'WhatsApp', href: 'https://wa.me', icon: MessageCircle },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 px-4 py-8 text-gray-400 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="text-lg font-bold tracking-[0.2em] text-white">
              CAPRICCIO
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
              Премиальная одежда для современных женщин
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((item) => {
                const Icon = item.icon

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Покупателям</h3>
            <div className="space-y-3">
              {customerLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">О компании</h3>
            <div className="space-y-3">
              {companyLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Контакты</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <span>г. Алматы, ул. Примерная, 123</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Пн-Вс: 10:00 - 22:00</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0" />
                <a
                  href="mailto:info@capriccio.kz"
                  className="text-gray-400 transition-colors duration-200 hover:text-white"
                >
                  info@capriccio.kz
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-sm md:flex-row md:text-left">
            <p>© 2026 Capriccio. Все права защищены.</p>
            <p>Разработано с ❤️ в Казахстане</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
