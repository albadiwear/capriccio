import { useState } from 'react'
import { Truck, CreditCard, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

const deliveryMethods = [
  { title: 'Курьер по Алматы', price: 'от 1 500 ₸', time: 'срок 1-2 дня' },
  { title: 'Казпочта', price: 'от 2 000 ₸', time: 'срок 3-7 дней' },
  { title: 'СДЭК', price: 'от 2 500 ₸', time: 'срок 2-5 дней' },
  { title: 'Яндекс Доставка', price: 'от 1 800 ₸', time: 'срок 1-2 дня' },
  { title: 'InDriver', price: 'от 1 200 ₸', time: 'в день заказа' },
]

const paymentMethods = [
  'Карта Visa / Mastercard',
  'Kaspi Pay (скоро)',
  'Наложенный платёж',
  'Криптовалюта USDT',
]

const faqItems = [
  {
    question: 'Как отследить заказ?',
    answer:
      'После оформления заказа мы связываемся с вами и отправляем информацию по статусу доставки. Для некоторых служб доставки предоставляется трек-номер.',
  },
  {
    question: 'Можно ли примерить перед покупкой?',
    answer:
      'Для заказов по Алматы возможность примерки зависит от способа доставки. Уточните детали у менеджера при подтверждении заказа.',
  },
  {
    question: 'Что делать если товар не подошёл по размеру?',
    answer:
      'Вы можете оформить возврат или обмен в течение 14 дней, если товар не был в использовании и сохранены все бирки и упаковка.',
  },
  {
    question: 'Доставляете ли в другие страны СНГ?',
    answer:
      'Да, мы рассматриваем доставку в страны СНГ. Условия и стоимость рассчитываются индивидуально после оформления заявки.',
  },
]

export default function DeliveryPage() {
  useSEO({
    title: 'Доставка и оплата',
    description: 'Доставка по Казахстану и СНГ. Курьер, Казпочта, СДЭК, Яндекс Доставка.',
    url: '/delivery',
  })
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="bg-white px-4 py-8 text-gray-900 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Capriccio Service</p>
          <h1 className="mt-4 text-2xl font-bold sm:text-4xl md:text-5xl">Доставка и оплата</h1>
          <p className="mt-4 text-base text-gray-500 md:text-lg">
            Удобные способы доставки по Алматы, Казахстану и СНГ, а также безопасные варианты оплаты
          </p>
        </div>

        <section className="py-8 md:py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Способы доставки</h2>
            <p className="mt-3 text-gray-500">
              Бесплатная доставка по Алматы при заказе от 50 000 ₸
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {deliveryMethods.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Truck className="h-5 w-5 text-gray-900" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-600">{item.price}</p>
                <p className="mt-1 text-sm text-gray-500">{item.time}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 md:py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Способы оплаты</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {paymentMethods.map((item) => (
              <div key={item} className="rounded-2xl border border-gray-200 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <CreditCard className="h-5 w-5 text-gray-900" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 md:py-16">
          <div className="rounded-3xl bg-gray-50 p-8 md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <RotateCcw className="h-6 w-6 text-gray-900" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 md:text-3xl">Возврат и обмен</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-600 md:text-base">
              <p>
                Возврат возможен в течение 14 дней с момента получения заказа. Товар не должен быть
                в использовании, а оригинальная упаковка, бирки и товарный вид должны быть сохранены.
              </p>
              <p>
                Чтобы оформить возврат или обмен, напишите нам в WhatsApp или на email. Мы подскажем
                дальнейшие шаги и быстро поможем с оформлением.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Часто задаваемые вопросы</h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index

              return (
                <div key={item.question} className="rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span className="text-base font-medium text-gray-900">{item.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-6 py-5 text-sm leading-7 text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
