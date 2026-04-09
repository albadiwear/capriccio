import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function HeroSection({ user, onRequireAccess }) {
  const [heroImage, setHeroImage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHeroImage() {
      const { data } = await supabase
        .from('products')
        .select('images')
        .eq('is_active', true)
        .limit(1)

      const url = data?.[0]?.images?.[0] || ''
      if (!cancelled) setHeroImage(url)
    }

    loadHeroImage()
    return () => {
      cancelled = true
    }
  }, [])

  const canOpenCatalog = Boolean(user)

  return (
    <section className="relative -mt-14 min-h-screen overflow-hidden bg-[#1a1a18] pt-16 text-white">
      <div className="absolute inset-0">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-800">
            Закрытый клуб · 5 000+ участниц
          </div>

          <h1 className="mt-6 text-5xl font-medium leading-[1.05] text-white md:text-7xl">
            Твоё второе дыхание
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-gray-300">
            Пространство для женщин 35+ которые хотят перемен
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            {canOpenCatalog ? (
              <Link
                to="/catalog"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-[#1a1a18] transition-colors hover:bg-gray-100"
              >
                Получить доступ
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onRequireAccess?.()}
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-[#1a1a18] transition-colors hover:bg-gray-100"
              >
                Получить доступ
              </button>
            )}
            <a
              href="#looks"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Смотреть образы
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Регистрация бесплатна · Доступ сразу · Казахстан и СНГ
          </p>
        </div>
      </div>
    </section>
  )
}
