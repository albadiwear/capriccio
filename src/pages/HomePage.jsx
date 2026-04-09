import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSEO } from '../hooks/useSEO'
import HeroSection from '../components/home/HeroSection'
import DirectionsSection from '../components/home/DirectionsSection'
import CatalogPreview from '../components/home/CatalogPreview'
import ReviewsSection from '../components/home/ReviewsSection'
import AccessForm from '../components/home/AccessForm'

export default function HomePage() {
  const user = useAuthStore((state) => state.user)

  useSEO({
    title: 'Capriccio — закрытый клуб',
    description:
      'Закрытый клуб Capriccio: образы, академия стиля, сообщество и премиальный магазин. Вход по регистрации.',
    url: '/',
  })

  const accessRef = useRef(null)

  const scrollToAccess = () => {
    const el = accessRef.current || document.getElementById('access')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navItems = useMemo(
    () => [
      { label: 'Образы', href: '#looks' },
      { label: 'Академия', href: '#academy' },
      { label: 'Партнёрство', href: '#partnership' },
      { label: 'О нас', href: '#about' },
    ],
    []
  )

  const [activeFilter, setActiveFilter] = useState('Все')

  useEffect(() => {
    setActiveFilter('Все')
  }, [])

  return (
    <div className="bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold tracking-[0.35em]">
            CAPRICCIO
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
      {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-gray-900 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={scrollToAccess}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-gray-900 transition-colors hover:border-gray-900"
          >
            Войти
          </button>
        </div>
      </header>

      <HeroSection user={user} onRequireAccess={scrollToAccess} />

      <DirectionsSection />

      <section className="bg-[#1a1a18] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-2 gap-6 border-y border-white/10 py-10 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/10">
            {[
              { value: '5 000+', label: 'Клиенток' },
              { value: '30 лет', label: 'На рынке' },
              { value: '1 500+', label: 'Позиций' },
              { value: '4.9', label: 'Рейтинг' },
            ].map((s) => (
              <div key={s.label} className="px-2 text-center md:px-6">
                <div className="text-4xl font-semibold text-white">{s.value}</div>
                <div className="mt-2 text-sm text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CatalogPreview user={user} onRequireAccess={scrollToAccess} />

      <ReviewsSection />

      <section id="about" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch">
            <div>
              <blockquote className="text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">
                “Мы верим что лучший возраст для перемен — прямо сейчас”
              </blockquote>
              <p className="mt-5 text-sm leading-6 text-gray-600">
                Capriccio — премиум пространство для женщин, которые выбирают стиль осознанно. Мы собираем образы,
                которые подчёркивают статус, сохраняют женственность и дают ощущение “я снова себе нравлюсь”.
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Внутри клуба — подборки, уроки, сообщество и партнёрство. А в магазине — одежда, обувь и аксессуары,
                которые помогают выглядеть современно и дорого без лишних усилий.
              </p>
              <p className="mt-6 text-sm font-medium text-gray-900">
                Основательница Capriccio · Алматы · 30 лет в моде
              </p>
            </div>

            <div className="hidden lg:flex">
              <div className="flex w-full flex-1 items-center justify-center rounded-2xl bg-[#1a1a18] px-10 py-12 text-center">
                <div>
                  <div className="text-3xl font-semibold leading-snug text-white">
                    “30 лет мы помогаем женщинам находить свой стиль”
                  </div>
                  <div className="mt-5 text-sm text-gray-400">
                    Казахстан и СНГ · с 1995 года
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={accessRef}>
        <AccessForm user={user} />
      </div>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold tracking-[0.35em] text-gray-900">CAPRICCIO</div>
              <p className="mt-3 text-sm text-gray-600">
                © 2025 Capriccio · Казахстан и СНГ · 30 лет на рынке
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {[
                { label: 'Каталог', to: '/catalog' },
                { label: 'Академия', to: '#academy' },
                { label: 'Партнёрство', to: '#partnership' },
                { label: 'Доставка', to: '/delivery' },
                { label: 'О нас', to: '#about' },
                { label: 'Контакты', to: '/contacts' },
              ].map((l) => (
                l.to.startsWith('#') ? (
                  <a key={l.label} href={l.to} className="hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  l.to === '/catalog' && !user ? (
                    <button
                      key={l.label}
                      type="button"
                      onClick={scrollToAccess}
                      className="text-left hover:text-gray-900 transition-colors"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <Link key={l.label} to={l.to} className="hover:text-gray-900 transition-colors">
                      {l.label}
                    </Link>
                  )
                )
              ))}
            </div>

            <div className="flex items-start md:justify-end">
              <a
                href="https://wa.me/77000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-md bg-green-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
