export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Добро пожаловать в Capriccio
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Интернет-магазин женской одежды в Казахстане
        </p>
        <p className="text-gray-500">
          Валюта: ₸ (Теңге)
        </p>
      </section>

      <section className="grid grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Доставка</h3>
          <p className="text-gray-600">На всей территории Казахстана</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Качество</h3>
          <p className="text-gray-600">Только оригинальную одежду</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Поддержка</h3>
          <p className="text-gray-600">24/7 помощь клиентам</p>
        </div>
      </section>
    </div>
  )
}
