# Capriccio - Инструкции по развертыванию

## ✅ Что сделано

### Структура проекта
- ✅ Полная структура папок согласно требованиям
- ✅ Все компоненты созданы (Layout, Catalog, Product, Cart, Checkout, Account, Partner, Admin, UI)
- ✅ Все хуки реализованы (useFetch, useSupabase)
- ✅ Zustand store настроен
- ✅ Утилиты и помощники функции

### Конфигурация
- ✅ Vite 8 - быстрый bundler
- ✅ React 19 - свежая версия
- ✅ Tailwind CSS 4 - стилизация
- ✅ React Router DOM 7 - маршрутизация
- ✅ Zustand 5 - state management
- ✅ Supabase JS - backend

### Готовые интеграции
- ✅ Supabase клиент инициализирован
- ✅ VITE переменные окружения настроены
- ✅ Tailwind CSS настроен
- ✅ PostCSS настроен
- ✅ ESLint настроен

## 🚀 Быстрый старт

### 1. Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Открыть http://localhost:5173
```

### 2. Настройка Supabase

1. Создать проект на [supabase.io](https://supabase.io)
2. Получить `Project URL` и `API Key (anon)`
3. Обновить `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Создание таблиц в Supabase

```sql
-- Таблица продуктов
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  category VARCHAR(100),
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров в заказе
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📦 Сборка для продакшена

```bash
# Создать оптимизированную сборку
npm run build

# Тестировать локально
npm run preview

# Отправить на Vercel
npm run build
git add .
git commit -m "Build for production"
git push
```

## 🌐 Развертывание на Vercel

### Способ 1: Через GitHub

1. Создать репозиторий на GitHub
2. Загрузить код
3. Перейти на [vercel.com](https://vercel.com)
4. Создать новый проект из GitHub репозитория
5. Добавить переменные окружения:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Нажать Deploy

### Способ 2: Через CLI

```bash
# Установить Vercel CLI
npm i -g vercel

# Развернуть на Vercel
vercel

# Следовать инструкциям в терминале
```

### Способ 3: Через vercel.json

Файл `vercel.json` уже создан в проекте:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🔐 Переменные окружения для Vercel

В Vercel Settings > Environment Variables добавить:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## ✨ Оптимизация перед продакшеном

### 1. Изображения

Разместить изображения:
- В `/public/Images/` для локального использования
- На CDN (Cloudinary, AWS S3) для продакшена

### 2. SEO

Добавить в `index.html`:

```html
<meta name="description" content="Capriccio - интернет-магазин женской одежды">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:title" content="Capriccio">
<meta property="og:description" content="Качественная женская одежда в Казахстане">
<meta property="og:image" content="/preview.png">
```

### 3. Performance

- Использовать Code Splitting (React.lazy + Suspense)
- Оптимизировать изображения (WebP, AVIF)
- Добавить Service Worker
- Минифицировать CSS/JS (автоматически Vite)

### 4. Analytics

Добавить Google Analytics:

```javascript
// main.jsx
import { useEffect } from 'react'

useEffect(() => {
  // Инициализация GA
  window.gtag('config', 'GA_MEASUREMENT_ID')
}, [])
```

## 📋 Чек-лист перед развертыванием

- [ ] Все переменные окружения установлены
- [ ] Supabase таблицы созданы
- [ ] Тестирование локально (`npm run dev`)
- [ ] Сборка работает (`npm run build`)
- [ ] Нет ошибок в консоли
- [ ] Тестировка на разных браузерах
- [ ] Мобильная верстка проверена
- [ ] Production ссылка на Vercel

## 🐛 Отладка

### Ошибка: "VITE_SUPABASE_URL is not defined"

```javascript
// Проверить .env.local файл
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

// Перезагрузить dev сервер
npm run dev
```

### Ошибка при подключении к Supabase

```javascript
// Проверить JWT токены в Supabase Dashboard
// Settings > API > Project API keys

// Проверить CORS в Supabase
// Database > Extensions > Enable pgvector
```

### Медленная загрузка

```javascript
// Использовать React DevTools Profiler
// Оптимизировать компоненты с useMemo/useCallback
```

## 📞 Поддержка

- Документация Vite: https://vitejs.dev/
- Документация React: https://react.dev/
- Документация Tailwind: https://tailwindcss.com/
- Документация Supabase: https://supabase.com/docs
- Документация Vercel: https://vercel.com/docs

## 🎯 Следующие шаги

1. Добавить React Router для страниц
2. Создать компоненты для Admin панели
3. Внедрить платёжную систему (Stripe/Kaspi)
4. Добавить аутентификацию (Auth0/Supabase Auth)
5. Расширить функции каталога (фильтры, поиск)
6. Добавить отзывы и рейтинги продуктов
7. Внедрить Email рассылку (Sendgrid)
