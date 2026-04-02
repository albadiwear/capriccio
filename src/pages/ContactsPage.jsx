import { useState } from 'react'
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  ExternalLink,
} from 'lucide-react'

const contactItems = [
  {
    icon: MapPin,
    label: 'Адрес',
    value: 'г. Алматы, ул. Примерная, 123',
    href: null,
  },
  {
    icon: Phone,
    label: 'Телефон',
    value: '+7 (708) 293-82-96',
    href: 'tel:+77082938296',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@capriccio.kz',
    href: 'mailto:info@capriccio.kz',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+7 (708) 293-82-96',
    href: 'https://wa.me/77082938296',
  },
  {
    icon: Clock,
    label: 'Режим работы',
    value: 'Пн-Вс 10:00-22:00',
    href: null,
  },
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

export default function ContactsPage() {
  const [formData, setFormData] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log(formData)
    setSubmitted(true)
    setFormData(initialForm)
  }

  return (
    <div className="bg-white px-4 py-8 text-gray-900 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Capriccio</p>
          <h1 className="mt-4 text-2xl font-bold md:text-5xl sm:text-4xl">Контакты</h1>
          <p className="mt-4 text-base text-gray-500 md:text-lg">
            Мы всегда на связи и готовы помочь с выбором, заказом и доставкой
          </p>
        </div>

        <section className="py-8 md:py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Свяжитесь с нами</h2>
              <div className="mt-8 space-y-6">
                {contactItems.map((item) => {
                  const Icon = item.icon
                  const content = item.href ? (
                    <a href={item.href} className="transition-colors hover:text-gray-900">
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )

                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Icon className="h-5 w-5 text-gray-900" />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-gray-400">{item.label}</p>
                        <div className="mt-2 text-base text-gray-700">{content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-10">
                <p className="text-sm uppercase tracking-wide text-gray-400">Соцсети</p>
                <div className="mt-4 flex items-center gap-4">
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
                    aria-label="Telegram"
                  >
                    <Send className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
                    aria-label="Instagram"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">Форма обратной связи</h2>
              <p className="mt-3 text-sm text-gray-500">
                Оставьте сообщение, и мы свяжемся с вами в ближайшее время
              </p>

              {submitted && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Спасибо! Мы свяжемся с вами в ближайшее время
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Имя"
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Телефон"
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Тема"
                  className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Сообщение"
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <button
                  type="submit"
                  className="h-12 w-full rounded-lg bg-gray-900 px-6 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  Отправить
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-16">
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-200 px-6 text-center text-gray-600">
            Карта — г. Алматы, ул. Примерная, 123
          </div>
        </section>
      </div>
    </div>
  )
}
