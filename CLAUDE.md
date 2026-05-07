# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test suite exists in this project.

## Stack

- **Frontend**: React 19, React Router DOM v7, Tailwind CSS, Lucide React icons
- **State**: Zustand (`authStore`, `cartStore`, `wishlistStore`)
- **Backend**: Supabase (Postgres + Auth + Storage), Vercel serverless functions in `api/`
- **Build**: Vite
- **Language**: Russian UI, currency KZT (Kazakhstan)
- **Accent color**: `#D4537E` (pink), dark background `#1a1a18`

## Architecture

### Auth flow
`authStore.js` initializes a Supabase auth subscription on app load. `ProtectedRoute` reads from the store. Admin access is gated by `VITE_ADMIN_EMAIL` env var and/or `users.role = 'admin'` in DB. Telegram Mini App users go through `TelegramProvider.jsx` → `api/telegram-auth.js` which creates a temporary account (`tg_{id}@capriccio.app`) and returns a Supabase session.

### Supabase patterns
- Always use `.maybeSingle()` for single-row lookups (not `.single()`) to avoid throwing on missing rows.
- Parallel fetches use `Promise.all([...])`.
- Service-role key (`SUPABASE_SERVICE_KEY`) is only used in serverless functions (`api/`), never in frontend code.
- Supabase client in frontend: `src/lib/supabase.js`, localStorage key `capriccio-auth`.

### Serverless functions (`api/`)
All Vercel serverless functions. Key ones:
- `telegram.js` — webhook for incoming Telegram bot messages; creates `stylist_chats` + `stylist_messages`, links users by phone, syncs avatar
- `telegram-auth.js` — Mini App login; upserts user, returns session
- `telegram-web-auth.js` — Telegram Login Widget auth; verifies HMAC-SHA256 signature (secret = SHA256 of BOT_TOKEN), creates/links user, returns `{ access_token, refresh_token }`
- `telegram-send.js` / `telegram-send-photo.js` — send messages/photos via Bot API

### Admin panel (`/admin/*`)
Protected by `managerOnly` in `ProtectedRoute`. Layout in `AdminLayout.jsx` — sidebar with role-filtered nav (`adminOnly` items hidden for managers). Key sections: CRM kanban (`AdminCRMPage` + `AdminCRMDetailPage`), Chats (`AdminChatsPage`), Orders, Products, Analytics.

### CRM
`AdminCRMPage.jsx` — Kanban board. Stages defined as `STAGES` array with id/label/color. Custom stages stored in local React state (not DB). Tags are client-side only. `load()` runs 3 parallel queries: users, stylist_chats, orders — merged client-side to avoid RLS join issues.

`AdminCRMDetailPage.jsx` — Client detail at `/admin/crm/:id`. Left column: profile card with inline-editable fields writing to `users` and `stylist_profiles` tables. Right column: tabs for Chats, Orders, Wishlist.

### Telegram integration
Two entry points:
1. **Mini App** (mobile): `TelegramProvider.jsx` → `api/telegram-auth.js`
2. **Web widget**: `AccessForm.jsx` → `api/telegram-web-auth.js`
3. **Bot webhook**: `api/telegram.js` (receives messages, links accounts by phone)

### Key DB tables
`users`, `orders`, `order_items`, `products`, `product_variants`, `addresses`, `wishlist`, `referrals`, `referral_transactions`, `stylist_chats`, `stylist_messages`, `stylist_profiles`, `lead_notes`, `crm_custom_fields`, `academy_orders`, `withdrawal_requests`

### Storage buckets
`avatars` (user profile photos), `review-photos` (product review images)

## Environment variables

```
VITE_SUPABASE_URL          # Supabase project URL (frontend + api)
VITE_SUPABASE_ANON_KEY     # Supabase anon key (frontend only)
SUPABASE_SERVICE_KEY       # Supabase service role key (api/ only)
VITE_ADMIN_EMAIL           # Hardcoded admin email fallback
TELEGRAM_BOT_TOKEN         # Bot token for webhook + sending messages
TELEGRAM_VERIFY_TOKEN      # Webhook verify token (GET check)
```

## Lucide React — known missing icons

`Instagram` is **not exported** from `lucide-react`. Use `Camera` as a substitute for Instagram source badges.
