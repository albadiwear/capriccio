import { useEffect, useState } from 'react'
import { Shirt, Sparkles, GraduationCap, Users, Star } from 'lucide-react'

const DIRECTIONS = [
  {
    title: 'Образы',
    desc: 'Готовые луки от стилистов — одежда, обувь, аксессуары',
    tint: '#FBEAF0',
    iconColor: '#d75a8b',
    to: '#looks',
    Icon: Shirt,
  },
  {
    title: 'Красота',
    desc: 'Косметика и уход специально для кожи 35+',
    tint: '#E1F5EE',
    iconColor: '#1f8a5b',
    to: '#access',
    Icon: Sparkles,
  },
  {
    title: 'Академия',
    desc: 'Курсы по стилю, образу и уверенности в себе',
    tint: '#EEEDFE',
    iconColor: '#5b5bd6',
    to: '#academy',
    Icon: GraduationCap,
  },
  {
    title: 'Сообщество',
    desc: 'Живое общение с женщинами которые вдохновляют',
    tint: '#FAECE7',
    iconColor: '#d66353',
    to: '#access',
    Icon: Users,
  },
  {
    title: 'Партнёрство',
    desc: 'Зарабатывай рекомендуя — до 10% с каждой продажи',
    tint: '#FAEEDA',
    iconColor: '#b8975a',
    to: '#partnership',
    Icon: Star,
  },
]

export default function DirectionsSection() {
  return (
    <section className="bg-white" id="academy">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Всё для твоего преображения
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          Внутри Capriccio — образы, обучение, партнёрство и сообщество. Всё собрано так, чтобы вдохновлять и вести к результату.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {DIRECTIONS.map(({ title, desc, tint, iconColor, to, Icon }) => (
            <a
              key={title}
              href={to}
              className="group rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-200"
              style={{ background: tint }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
                  <Icon className="h-5 w-5" style={{ color: iconColor }} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-900">{title}</div>
                <div className="mt-2 text-xs leading-5 text-gray-700/80">{desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div id="partnership" className="h-0" />
      </div>
    </section>
  )
}
