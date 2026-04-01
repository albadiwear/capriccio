# Capriccio - Структура проекта

## 📁 Структура папок

```
capriccio/
├── src/
│   ├── components/              # React компоненты
│   │   ├── layout/             # Header, Footer, Layout
│   │   │   ├── Layout.jsx
│   │   │   └── index.js
│   │   ├── catalog/            # Каталог товаров
│   │   │   ├── Catalog.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── index.js
│   │   ├── product/            # Детальная страница товара
│   │   │   ├── ProductDetail.jsx
│   │   │   └── index.js
│   │   ├── cart/               # Корзина
│   │   │   ├── Cart.jsx
│   │   │   ├── CartItem.jsx
│   │   │   └── index.js
│   │   ├── checkout/           # Оформление заказа
│   │   │   ├── Checkout.jsx
│   │   │   └── index.js
│   │   ├── account/            # Личный кабинет
│   │   │   ├── Account.jsx
│   │   │   └── index.js
│   │   ├── partner/            # Партнёры
│   │   │   ├── Partner.jsx
│   │   │   └── index.js
│   │   ├── admin/              # Админ панель
│   │   │   ├── Admin.jsx
│   │   │   └── index.js
│   │   ├── ui/                 # UI компоненты
│   │   │   ├── Button.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── pages/                  # Страницы приложения
│   │   ├── HomePage.jsx
│   │   └── index.js
│   ├── hooks/                  # Custom React hooks
│   │   ├── useFetch.js         # Fetch данные
│   │   ├── useSupabase.js      # Работа с Supabase
│   │   └── index.js
│   ├── lib/                    # Утилиты и конфигурация
│   │   ├── supabase.js         # Инициализация Supabase
│   │   └── index.js
│   ├── store/                  # Zustand хранилище
│   │   ├── store.js
│   │   └── index.js
│   ├── utils/                  # Утилиты и помощники
│   │   ├── helpers.js          # formatPrice, formatDate и т.д.
│   │   └── index.js
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── public/                     # Статические файлы
│   └── Images/
├── index.html
├── package.json
├── tailwind.config.js          # Tailwind CSS конфиг
├── postcss.config.js           # PostCSS конфиг
├── vite.config.js              # Vite конфиг
├── eslint.config.js            # ESLint конфиг
├── .env.example                # Пример переменных окружения
└── .env.local                  # Локальные переменные окружения
```

## 📦 Основные библиотеки

- **React 19**: UI библиотека
- **React Router DOM 7**: Маршрутизация
- **Tailwind CSS 4**: Утилиты для стилей
- **Zustand 5**: State management
- **Supabase JS 2**: Backend и база данных
- **Vite 8**: Bundler и dev server

## 🔧 Переменные окружения

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 💾 Использование Supabase

### Инициализация
```javascript
import { supabase } from '@/lib/supabase'
```

### Custom Hook `useSupabase`
```javascript
import { useSupabase } from '@/hooks'

function MyComponent() {
  const { query, insert, update, remove } = useSupabase()
  
  // Запрос данных
  const { data, error } = await query('products', {
    select: '*',
    limit: 10,
    order: ['price', true]
  })
  
  // Вставка
  await insert('orders', { product_id: 123, quantity: 2 })
  
  // Обновление
  await update('orders', 1, { status: 'processing' })
  
  // Удаление
  await remove('orders', 1)
}
```

## 🏪 State Management (Zustand)

```javascript
import { useStore } from '@/store'

function ShoppingCart() {
  const { cart, addToCart, removeFromCart, clearCart } = useStore()
  
  const handleAddProduct = (product) => {
    addToCart(product)
  }
  
  return (
    <div>
      {cart.map(item => (
        <div key={item.id}>
          {item.name} - {formatPrice(item.price)}
          <button onClick={() => removeFromCart(item.id)}>Удалить</button>
        </div>
      ))}
      <button onClick={clearCart}>Очистить корзину</button>
    </div>
  )
}
```

## 🛠️ Утилиты

### Форматирование цены (KZT)
```javascript
import { formatPrice } from '@/utils'

formatPrice(15000) // "15,000 ₸"
```

### Извлечение данных
```javascript
import { useFetch } from '@/hooks'

const { data, loading, error } = useFetch('https://api.example.com/products')
```

## 📝 Соглашения по кодированию

- Компоненты: `PascalCase` (ProductCard.jsx)
- Функции/переменные: `camelCase` (formatPrice)
- Файлы утилит: `camelCase` (helpers.js)
- Структурные папки: `lowercase` (components, hooks, lib)

## 🚀 Команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Просмотр сборки
npm run preview

# Линтинг
npm run lint
```

## 🌍 Локализация

Проект использует `Intl.NumberFormat` с локалью `ru-KZ` для форматирования цены и даты.

## 📱 Валюта

Все цены отображаются в **тенге (₸)** - казахстанская валюта.
