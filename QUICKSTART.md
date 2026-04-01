# 🚀 Быстрый старт - Capriccio

## Что готово ✅

- [x] Полная структура React проекта с Vite
- [x] Все компоненты созданы (Layout, Catalog, Cart и т.д.)
- [x] Zustand store настроен
- [x] Supabase интеграция
- [x] Tailwind CSS 4 подключён
- [x] React Router готова к использованию
- [x] Документация написана
- [x] Проект проходит ESLint без ошибок
- [x] Production сборка работает (191KB)

## 1️⃣ Локальная разработка

```bash
cd "/Users/islam/Desktop/2026-03-29 16.45.47 Zoom Meeting Евгений Ким/CapRiccio"

# Запустить dev сервер
npm run dev
```

**Откройте**: http://localhost:5173

## 2️⃣ Настройка Supabase

### Получить ключи:
1. Перейти на https://supabase.co
2. Создать новый проект
3. Скопировать `Project URL` и `API Key (anon)`

### Обновить файл `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Создать таблицы в Supabase SQL Query:
```sql
-- Таблица продуктов
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  category VARCHAR(100),
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3️⃣ Основные команды

```bash
# Разработка
npm run dev

# Проверка кода
npm run lint

# Production сборка
npm run build

# Просмотр сборки
npm run preview
```

## 4️⃣ Основные файлы для редактирования

### Страницы
- `src/pages/HomePage.jsx` - главная страница

### Компоненты
- `src/components/layout/Layout.jsx` - шаблон страницы
- `src/components/catalog/ProductCard.jsx` - карточка товара
- `src/components/cart/CartItem.jsx` - товар в корзине

### Store
- `src/store/store.js` - Zustand хранилище

### Утилиты
- `src/utils/helpers.js` - formatPrice, formatDate и т.д.

## 5️⃣ Использование компонентов

### Добавить товар в корзину
```jsx
import { useStore } from '@/store'

const { addToCart } = useStore()
addToCart({ id: 1, name: 'Платье', price: 25000 })
```

### Форматирование цены
```jsx
import { formatPrice } from '@/utils'

const price = formatPrice(15000) // "15,000 ₸"
```

### Загрузка данных из Supabase
```jsx
import { useSupabase } from '@/hooks'

const { query } = useSupabase()
const { data } = await query('products', { limit: 10 })
```

## 6️⃣ Развернуть на Vercel

```bash
# 1. Создать Git репозиторий
git init
git add .
git commit -m "Initial commit"

# 2. Отправить на GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/capriccio.git
git push -u origin main

# 3. На Vercel.com:
# - Импортировать проект из GitHub
# - Установить переменные окружения
# - Нажать "Deploy"
```

## 📚 Документация

| Файл | Содержание |
|------|-----------|
| PROJECT_STRUCTURE.md | Подробная структура проекта |
| EXAMPLES.md | Примеры кода для всех функций |
| DEPLOYMENT.md | Инструкции по развертыванию |
| COMPLETION_REPORT.md | Отчет о завершении |

## 🐛 Решение проблем

### Ошибка "Cannot find module"
```bash
npm install
```

### Tailwind стили не применяются
- Проверить `src/index.css` - должны быть @tailwind директивы
- Перезагрузить dev сервер: `npm run dev`

### Supabase ошибка подключения
- Проверить .env.local
- Убедиться что значения скопированы без пробелов
- Перезагрузить сервер

## 💡 Советы

1. Используйте `formatPrice()` для всех цен
2. Используйте компоненты из `@/components`
3. Используйте хуки из `@/hooks`
4. Для состояния используйте `useStore`
5. Проверяйте код: `npm run lint`

## 🎯 Первые задачи

1. ✅ Стартовать dev сервер
2. Добавить Supabase переменные
3. Создать маршруты продуктов
4. Добавить страницу каталога
5. Реализовать поиск товаров
6. Добавить оформление заказа
7. Развернуть на Vercel

## 📞 Команды проекта

```json
{
  "dev": "vite",
  "build": "vite build", 
  "lint": "eslint .",
  "preview": "vite preview"
}
```

---

**Проект готов к использованию!** Начните с `npm run dev` 🚀
