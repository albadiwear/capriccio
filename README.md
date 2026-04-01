# Capriccio - Интернет-магазин женской одежды

Полный React + Tailwind CSS + Supabase проект для интернет-магазина женской одежды в Казахстане.

## Стек технологий

- **Frontend**: React 18 + Vite
- **Стили**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Backend**: Supabase (PostgreSQL + Auth)
- **Хостинг**: Vercel

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── layout/         # Header, Footer, Layout
│   ├── catalog/        # Каталог товаров
│   ├── product/        # Детальная страница товара
│   ├── cart/           # Корзина
│   ├── checkout/       # Оформление заказа
│   ├── account/        # Личный кабинет
│   ├── partner/        # Партнёры
│   ├── admin/          # Админ панель
│   └── ui/             # UI компоненты (Button, Card, Input)
├── pages/              # Страницы приложения
├── hooks/              # Custom React hooks
├── lib/                # Утилиты и конфигурация (Supabase)
├── store/              # Zustand stores (cart, auth)
└── utils/              # Вспомогательные функции
```

## Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env.local
```

Заполните в `.env.local`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Запуск dev сервера
```bash
npm run dev
```

### 4. Сборка для production
```bash
npm run build
```

## Основные компоненты

### UI Components
- `Button` - кнопка с вариантами (primary, secondary, danger)
- `Card` - карточка с тенью
- `Badge` - значок статуса
- `Input` - инпут с лейблом и валидацией

### Store (Zustand)
- `useCartStore` - управление корзиной
- `useAuthStore` - управление аутентификацией

### Hooks
- `useFetch` - загрузка данных

### Utils
- `formatPrice` - форматирование цены в KZT
- `formatDate` - форматирование даты
- `validateEmail` - валидация email
- `truncateText` - обрезка текста

## Supabase конфигурация

В `src/lib/supabase.js` инициализирован Supabase клиент с использованием переменных окружения.

## Валюта

Все цены используют валюту Казахстана - ₸ (Теңге). Функция `formatPrice` автоматически форматирует цены.

## Разработка

### Добавление нового компонента
1. Создайте файл в соответствующей папке в `src/components/`
2. Экспортируйте из `index.js` папки
3. Используйте в других компонентах

### Добавление нового хука
1. Создайте файл в `src/hooks/`
2. Экспортируйте из `src/hooks/index.js`

### Добавление нового store
1. Создайте в `src/store/` используя Zustand
2. Экспортируйте из `src/store/index.js`

## Лицензия

MIT

## Контакты

Email: info@capriccio.kz
