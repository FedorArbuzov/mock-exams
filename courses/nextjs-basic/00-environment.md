# 00. Окружение: create-next-app, dev-сервер, Next.js vs Vite

## Введение: сценарий с работы

Понедельник, 10:00. Tech lead пишет в Slack: «Мы переносим shop-каталог с Vite SPA на Next.js — нужен SSR для SEO и быстрый first paint». Вы клонировали репозиторий, зашли в `courses/nextjs-basic/examples/`, выполнили `npm install`, `npm run dev` — в терминале зелёная строка `Ready on http://localhost:3000`, но в браузере **404** на `/catalog`, потому что страницы ещё нет. Коллега из react-basic спрашивает: «Почему не `5173`, как у Vite? И где `main.tsx`?» DevOps в CI: `next build` падает на `Module not found: Can't resolve '@/components/Header'`. Три симптома — три слоя: **Node runtime**, **Next dev-сервер**, **структура App Router**.

На курсе [`react-basic`](../react-basic/00-environment.md) вы поднимали Vite на порту **5173**: точка входа `main.tsx`, `createRoot`, React Router. Next.js — **не замена React**, а **фреймворк поверх React** с file-based routing, серверным рендером и встроенным bundler (Turbopack в dev, Webpack/Turbopack в prod). Без карты окружения каждый урок превращается в «магия Next».

В mock-exams Next.js-клиент будет ходить к shop API на FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) **:8090**. Сейчас достаточно поднять **только** frontend в `examples/` на **:3000**; backend подключим в главе 15.

## Что вы узнаете

- Как создать и запустить проект **Next.js 15 App Router** через `create-next-app` и каталог `examples/`.
- Цикл **edit → Fast Refresh → браузер** и отличие от HMR в Vite.
- Почему dev-сервер слушает **порт 3000**, а не 5173.
- Сравнение **Next.js vs Vite + React** для shop-каталога mock-exams.
- Скрипты `npm run dev` / `build` / `start` / `typecheck`.
- Типичные ошибки версий Node и «белый экран» при первом запуске.

## Next.js vs Vite + React: зачем второй стек

В [`react-basic`](../react-basic/README.md) вы строили **SPA**: один HTML, JS-бандл, React Router меняет URL на клиенте. Для админки и внутренних инструментов — отлично. Для **публичного каталога** с SEO, Open Graph и быстрым first contentful paint product часто выбирает **Next.js**:

| Аспект | Vite + React (react-basic) | Next.js App Router (nextjs-basic) |
|--------|---------------------------|-----------------------------------|
| Точка входа | `src/main.tsx` + `index.html` | `app/layout.tsx` + `app/page.tsx` |
| Маршруты | React Router (`<Routes>`) | **File-based**: папка `app/catalog/page.tsx` → `/catalog` |
| Рендер по умолчанию | Только клиент (CSR) | **Server Components** + опциональный client |
| Dev-порт | 5173 | **3000** |
| Dev-сервер | Vite (esbuild) | Next (Turbopack / Webpack) |
| Production | статика в `dist/` | `next build` → Node server или static export |
| Proxy на API | `vite.config.ts` proxy | Route Handlers, rewrite (глава 19–20) |

Next.js **включает** React 19 — компоненты, hooks, JSX те же. Меняется **где** выполняется код (сервер vs браузер) и **как** устроена навигация.

```text
react-basic (Vite SPA):
  Browser ──GET /──► static JS ──► React монтирует #root ──► fetch /api → :8090

nextjs-basic (App Router):
  Browser ──GET /catalog──► Next Server ──► HTML + RSC payload ──► hydration client islands
                                    └──► fetch к :8090 на сервере (глава 14)
```

## Установка и первый запуск

### Требования

- **Node.js LTS 20+** (или 22). Проверка: `node --version`.
- npm идёт с Node; в курсе используем npm.
- Пройдены [`javascript-basic`](../javascript-basic/README.md), [`typescript-basic`](../typescript-basic/README.md), [`react-basic`](../react-basic/README.md).

### Каталог examples (уже подготовлен в репозитории)

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
```

Откройте **http://localhost:3000**. Должны увидеть заголовок «Shop — nextjs-basic» и навигацию Shop / Каталог / Контакты в header.

| Команда | Назначение |
|---------|------------|
| `npm run dev` | dev-сервер + Fast Refresh (порт **3000**) |
| `npm run build` | production-сборка в `.next/` |
| `npm run start` | запуск production-сервера после `build` |
| `npm run typecheck` | `tsc --noEmit` без сборки |
| `npm run lint` | ESLint через `next lint` |

### Создание нового проекта с нуля (справка)

Если бы вы создавали проект вне mock-exams:

```bash
npx create-next-app@latest my-shop \
  --typescript \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Флаги `--app` включают **App Router** (не Pages Router legacy). В курсе alias `@/*` → корень проекта; эталон — [`examples/tsconfig.json`](examples/tsconfig.json).

### Что происходит при `npm run dev`

```text
next dev
    │
    ▼
Компиляция app/layout.tsx, app/page.tsx
    │
    ▼
HTTP :3000 — маршрут / → app/page.tsx
    │
    ▼
Fast Refresh при сохранении .tsx (сохраняет state client-компонентов где возможно)
```

В отличие от Vite, **нет** отдельного `index.html` с `<div id="root">`. Next сам генерирует HTML-оболочку из [`app/layout.tsx`](examples/app/layout.tsx).

## Структура examples/

```text
examples/
├── app/
│   ├── layout.tsx      ← корневой layout (html, body, header)
│   ├── page.tsx        ← маршрут /
│   └── globals.css
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.example        ← NEXT_PUBLIC_API_URL (глава 28)
```

Сравните с react-basic:

```text
react-basic/examples/src/
├── main.tsx            ← createRoot
├── App.tsx
└── components/
```

В Next **маршрут = файловая система** под `app/`. Подробно — [02-app-router.md](02-app-router.md).

## Порт 3000 и FastAPI :8090

| Сервис | Порт | Когда нужен |
|--------|------|-------------|
| Next.js dev | **3000** | всегда в этом курсе |
| FastAPI shop API | **8090** | с главы 15 (server fetch) |
| Vite (react-basic) | 5173 | параллельный курс, не смешивайте |

Два терминала на одной машине:

```bash
# Терминал 1 — Next
cd courses/nextjs-basic/examples && npm run dev

# Терминал 2 — FastAPI (позже)
cd deploy/fastapi && ...  # см. README fastapi
```

Пока API не подключён — страницы показывают placeholder-текст; это нормально.

## Fast Refresh vs Vite HMR

Оба дают обновление без полной перезагрузки. Различия на практике:

- **Vite HMR** — hot replace ES-модулей; overlay при синтаксической ошибке в `.tsx`.
- **Next Fast Refresh** — пересборка затронутого route segment; Server Components перезапрашиваются с сервера при изменении server-файла.

Если после ошибки UI «застрял» — **F5** или перезапуск `npm run dev`.

## TypeScript и Next.js 15

[`examples/package.json`](examples/package.json) фиксирует Next **15.1+** и React **19**. App Router **нативно** понимает `.tsx`, async Server Components, typed `metadata`. Паттерны TypeScript из [`typescript-basic`](../typescript-basic/README.md) (props types, `Readonly<{ children }>`) — в каждом layout и page.

## Связь с предыдущими курсами

| Курс | Что переносится в Next |
|------|------------------------|
| javascript-basic | модули, async/await, fetch |
| typescript-basic | типы props, strict mode |
| react-basic | JSX, компоненты, hooks → **Client Components** |
| react-basic/23 | React Router → **file-based routing** в Next |

## Типичные ошибки

**«Cannot find module 'next'».** Не выполнен `npm install` в `examples/` или вы в корне monorepo, а не в каталоге курса.

**«Port 3000 is already in use».** Другой Next или процесс занял порт. Освободите порт или: `npm run dev -- -p 3001` (в курсе договоримся о 3000).

**«Ищу main.tsx — его нет».** App Router не использует `createRoot` вручную. Корень — `app/layout.tsx`.

**«На /catalog 404».** Страница появится после [03-lab-first-app.md](03-lab-first-app.md) или [07-lab-routing.md](07-lab-routing.md).

**«У коллеги работает, у меня белый экран».** Сравните `node --version` (≥20), удалите `node_modules` и `.next`, снова `npm install && npm run dev`.

**«Путаю с Vite: правлю файл, порт 5173».** Убедитесь, что терминал в `nextjs-basic/examples`, не в `react-basic/examples`.

## Чек-лист

- [ ] `npm run dev` поднимает приложение на **http://localhost:3000**
- [ ] Знаете, где корневой layout (`app/layout.tsx`) и home page (`app/page.tsx`)
- [ ] Можете объяснить отличие Next от Vite SPA в одном абзаце
- [ ] Понимаете, что FastAPI :8090 подключим позже, а не на уроке 00
- [ ] `npm run typecheck` проходит без ошибок на стартовом коде

Следующий урок: [01. Ландшафт: SPA, SSR, SSG, ISR и когда Next.js](01-landscape.md).
