import { Link } from 'react-router-dom'
import { Shield, Star, HeadphonesIcon } from 'lucide-react'

const stats = [
  { value: '500+', label: 'брендов' },
  { value: '10 000+', label: 'клиентов' },
  { value: '5', label: 'лет на рынке' },
  { value: 'Казахстан и СНГ', label: 'география доставки' },
]

const values = [
  {
    icon: Shield,
    title: 'Качество',
    description:
      'Мы отбираем только качественные вещи и работаем с проверенными брендами, которым доверяют женщины по всему Казахстану.',
  },
  {
    icon: Star,
    title: 'Стиль',
    description:
      'В центре Capriccio — современная женственность, актуальные силуэты и вещи, которые легко вписываются в повседневный гардероб.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Сервис',
    description:
      'Мы сопровождаем клиента на каждом этапе: от выбора размера до доставки и послепродажной поддержки.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <img
          src="https://picsum.photos/seed/about-hero/1920/600"
          alt="О бренде Capriccio"
          className="h-[420px] w-full object-cover md:h-[520px]"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center sm:px-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Capriccio</p>
            <h1 className="mt-4 text-2xl font-bold text-white sm:text-4xl md:text-6xl">О нас</h1>
            <p className="mt-4 text-lg text-white/80">
              Премиальная одежда для современных женщин
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-gray-400">История бренда</p>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">Наша история</h2>
            <p className="mt-6 text-base leading-8 text-gray-600">
              Capriccio — казахстанский бутик премиальной женской одежды. Мы работаем с
              лучшими европейскими и казахстанскими брендами, отбирая только качественные
              и стильные вещи для современных женщин. Основан в Алматы, доставляем по всему
              Казахстану и СНГ.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl">
            <img
              src="https://picsum.photos/seed/about-story/800/600"
              alt="История бренда Capriccio"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
                <p className="text-3xl font-bold text-gray-900 md:text-4xl">{item.value}</p>
                <p className="mt-3 text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Почему мы</p>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">Наши ценности</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="rounded-2xl border border-gray-200 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-6 w-6 text-gray-900" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gray-900 px-8 py-14 text-center text-white md:px-12">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Capriccio</p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Откройте наш каталог</h2>
          <p className="mt-4 text-base text-white/70">
            Подберите вещи, которые подчеркнут ваш стиль и станут основой современного гардероба.
          </p>
          <Link
            to="/catalog"
            className="mt-8 inline-flex items-center bg-white px-8 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
          >
            Перейти в каталог
          </Link>
        </div>
      </section>
    </div>
  )
}
