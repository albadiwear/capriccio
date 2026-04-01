# Примеры компонентов и использования

## 1. Использование ProductCard

```jsx
// src/pages/HomePage.jsx
import { ProductCard } from '@/components'
import { formatPrice } from '@/utils'

export function HomePage() {
  const products = [
    { id: 1, name: 'Платье', price: 25000, image: '/images/dress.jpg' },
    { id: 2, name: 'Юбка', price: 18000, image: '/images/skirt.jpg' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onAddToCart={() => handleAddToCart(product)}
        />
      ))}
    </div>
  )
}
```

## 2. Работа с корзиной (Zustand)

```jsx
// src/components/cart/Cart.jsx
import { useStore } from '@/store'
import { formatPrice } from '@/utils'
import { CartItem } from './CartItem'

export function Cart() {
  const { cart, clearCart } = useStore()
  
  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Корзина</h1>
      
      {cart.length === 0 ? (
        <p className="text-gray-500">Корзина пуста</p>
      ) : (
        <>
          {cart.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xl font-bold">
              Итого: {formatPrice(total)}
            </p>
            <button onClick={clearCart} className="mt-2 btn btn-primary">
              Оформить заказ
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

## 3. Загрузка данных из Supabase

```jsx
// src/components/catalog/Catalog.jsx
import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks'
import { ProductCard } from './ProductCard'

export function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { query } = useSupabase()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await query('products', {
        select: '*',
        limit: 20,
        order: ['created_at', false]
      })
      
      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

## 4. Custom Button компонент

```jsx
// Использование UI Button
import { Button } from '@/components'

export function MyComponent() {
  return (
    <div className="space-y-2">
      <Button variant="primary">Добавить в корзину</Button>
      <Button variant="secondary">Отмена</Button>
      <Button variant="danger">Удалить</Button>
    </div>
  )
}
```

## 5. Форма с валидацией

```jsx
// src/components/checkout/Checkout.jsx
import { useState } from 'react'
import { validateEmail, formatPrice } from '@/utils'
import { Button } from '@/components'

export function Checkout() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!validateEmail(email)) {
      newErrors.email = 'Некорректный email'
    }
    
    if (Object.keys(newErrors).length === 0) {
      // Отправить заказ
      console.log('Order submitted')
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
      </div>
      <Button variant="primary" type="submit">
        Оформить заказ
      </Button>
    </form>
  )
}
```

## 6. Использование formatPrice и formatDate

```jsx
import { formatPrice, formatDate } from '@/utils'

// Форматирование цены
const price = formatPrice(15000)  // "15,000 ₸"

// Форматирование даты
const date = formatDate('2025-03-31')  // "31 марта 2025 г."

// Обрезание текста
import { truncateText } from '@/utils'
const description = truncateText('Длинное описание...', 50)
```

## 7. Layout с навигацией

```jsx
// src/components/layout/Layout.jsx
import { useState } from 'react'
import { Header, Footer } from './Layout'

export function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

// App.jsx
import App from './App'
import { Layout } from '@/components'

function App() {
  return (
    <Layout>
      {/* Основной контент */}
    </Layout>
  )
}
```

## 8. Интеграция с Router (пример)

```jsx
// main.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages'
import { Layout } from '@/components'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Добавить другие маршруты */}
        </Routes>
      </Layout>
    </Router>
  )
}
```

## 9. Приватные переменные окружения

Создайте `.env.local` файл в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Используйте в коде:

```javascript
const url = import.meta.env.VITE_SUPABASE_URL
```

## 10. Developer Tips

### Отладка Zustand store
```javascript
// В консоли браузера
import { useStore } from '@/store'
console.log(useStore.getState())
```

### Отладка запросов Supabase
```javascript
const { data, error } = await query('products')
if (error) {
  console.error('Supabase error:', error.message)
}
```

### Быстрая проверка стилей
Используйте классы Tailwind напрямую в JSX:
```jsx
<div className="p-4 bg-gray-100 rounded-lg shadow-md">
  Содержимое
</div>
```
