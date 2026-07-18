# 01. Ландшафт: SPA, SSR, SSG, ISR и когда выбирать Next.js

## Введение: сценарий с работы

Planning, четверг. Product показывает метрики: **Lighthouse SEO — 42**, Google не индексирует страницы товаров, потому что SPA отдаёт пустой `<div id="root">` и контент появляется только после JS. Marketing: «Нужны превью в Slack/Telegram с ценой и картинкой». Tech lead: «Мы на React — переписываем на Vue?» Senior: «Нет, берём **Next.js**: SSR для каталога, client islands для корзины».

Вы из [`react-basic`](../react-basic/01-landscape.md) знаете **SPA**: Vite, React Router, JSON с FastAPI `:8090`. Вопрос не «React или нет», а **как доставить HTML** пользователю и ботам: только клиент, сервер на каждый запрос, статика при билде или гибрид с ревалидацией.

Эта глава — карта терминов без магии. После неё вы сможете на grooming объяснить, **почему** mock-exams shop переезжает с Vite на Next и **когда** SSR избыточен.

## Что вы узнаете

- **CSR, SSR, SSG, ISR** — что рендерится, где и когда.
- Плюсы и минусы каждого подхода для **shop-каталога**.
- Сравнение **react-basic Vite SPA** vs **nextjs-basic App Router**.
- Критерии выбора Next.js vs «оставить SPA».
- Как App Router Next.js 15 вписывает **React Server Components** в эту картину.

## Четыре модели доставки UI

### CSR — Client-Side Rendering (ваш react-basic)

Браузер загружает JS, React монтируется, `fetch('/api/v1/items')` → рисует список.

```text
GET /items  →  HTML (пустой shell) + app.js
Browser     →  execute JS → fetch API :8090 → render list
```

| Плюсы | Минусы |
|-------|--------|
| Простой деплой статики (CDN) | Плохой SEO без доп. слоя |
| Богатая интерактивность | Медленный first contentful paint |
| Один язык на клиенте | Весь data-fetching виден в Network tab |

Это [`react-basic/examples`](../react-basic/examples/): Vite, порт 5173, React Router.

### SSR — Server-Side Rendering

На **каждый запрос** сервер (Node) выполняет React, отдаёт **готовый HTML** + данные для hydration.

```text
GET /catalog/42  →  Next Server  →  fetch :8090  →  HTML с <h1>Товар 42</h1>
Browser          →  hydrate client components (кнопка «В корзину»)
```

| Плюсы | Минусы |
|-------|--------|
| SEO, OG-теги из коробки | Нагрузка на Node при каждом hit |
| Быстрый первый контент | Сложнее кэширование, чем у статики |
| Секреты API на сервере | Cold start в serverless |

### SSG — Static Site Generation

HTML генерируется **на этапе `next build`**, отдаётся с CDN. Подходит для редко меняющихся страниц.

```text
build time  →  generate /about, /legal  →  static files
request     →  CDN отдаёт файл без Node
```

Для **10 000 SKU** с ежечасным обновлением цен чистый SSG без ISR — боль: rebuild на каждое изменение.

### ISR — Incremental Static Regeneration

Гибрид: страница статическая, но **пересобирается** по таймеру или on-demand (`revalidate: 60`). Пользователь часто получает CDN-cache, данные обновляются фоном.

```typescript
// preview — подробно в главе 16
export const revalidate = 60;
```

| Модель | Когда для shop |
|--------|----------------|
| CSR | личный кабинет, админка за login |
| SSR | страница товара с актуальной ценой, персонализация |
| SSG | landing, docs, «О компании» |
| ISR | каталог, списки с умеренной свежестью |

## Сравнение: react-basic vs nextjs-basic

```text
                    react-basic (Vite)          nextjs-basic (App Router)
Первый HTML         минимальный shell           контент в HTML (RSC/SSR)
Маршруты            React Router config         app/catalog/page.tsx
Данные              useEffect + fetch           async Server Component fetch
SEO                 нужен prerender/SSR addon   metadata API, SSR по умолчанию
Деплой              dist/ на CDN                Node или Vercel-like platform
Порт dev            5173                        3000
```

Один и тот же **FastAPI :8090** остаётся источником правды. Меняется **кто** вызывает API первым: только браузер (SPA) или сервер Next (RSC).

## Когда Next.js — правильный выбор

**Берите Next.js (App Router), если:**

- публичный каталог, блог, landing с **SEO и social preview**;
- нужен **единый** TypeScript fullstack (UI + Route Handlers BFF);
- команда уже на React — не учить второй фреймворк;
- нужны **streaming**, Suspense, server fetch без exposing API keys.

**Оставьте Vite SPA (или добавьте только prerender), если:**

- приложение **только за авторизацией**, SEO не важен;
- extreme offline/PWA без Node на edge;
- команда деплоит **только статику** и не хочет Node в prod.

mock-exams **nextjs-basic** моделирует публичный shop: каталог индексируется, корзина — client island.

## Next.js 15 App Router в одной схеме

```text
Request /catalog/[id]
        │
        ▼
┌───────────────────────────────────────┐
│  Next.js Server (Node)                │
│  ├─ layout.tsx (Server)               │
│  ├─ page.tsx async fetch → :8090      │
│  └─ stream HTML + RSC Flight          │
└───────────────────────────────────────┘
        │
        ▼
Browser hydrates только "use client" части (кнопки, корзина)
```

**React Server Components (RSC)** — компоненты по умолчанию на сервере; не попадают в client bundle. Подробно — [09-server-components.md](09-server-components.md).

## Термины, которые путают на собесах

| Термин | Смысл |
|--------|-------|
| Hydration | React «оживляет» HTML на клиенте, вешает listeners |
| RSC | Server Components — render на сервере, не `useState` |
| Flight | формат сериализации дерева RSC по сети |
| Streaming | HTML chunks по мере готовности (Suspense) |
| Partial Prerendering (PPR) | experimental гибрид static shell + dynamic holes |

Не обязаны зубрить PPR на basic — достаточно знать, что Next эволюционирует в сторону **меньше JS в браузере**.

## Миграция мысленной модели с react-basic

| react-basic привычка | nextjs-basic аналог |
|---------------------|---------------------|
| `<BrowserRouter>` | файлы в `app/` |
| `useEffect(() => fetch…)` | `async function Page()` + fetch на сервере |
| `useState` везде | `useState` только в `"use client"` |
| `vite.config proxy` | Route Handler / env URL (главы 19–20) |
| loading spinner в компоненте | `loading.tsx` + Suspense (глава 06, 13) |

## FastAPI :8090 в архитектуре

```text
┌─────────────┐     JSON      ┌──────────────┐
│  Next :3000 │ ◄────────────►│ FastAPI :8090│
│  (UI + BFF) │               │  shop API    │
└─────────────┘               └──────────────┘
```

Next может:

1. **Server Component** — `fetch('http://localhost:8090/api/v1/items')` на сервере.
2. **Client Component** — `fetch` из браузера (CORS — настроим позже).
3. **Route Handler** — `app/api/.../route.ts` проксирует к FastAPI.

## Типичные ошибки

**«SSR = всегда медленнее SPA».** SSR добавляет RTT до Node, но пользователь **раньше** видит контент; SPA ждёт JS + fetch. Сравнивайте **LCP**, не только TTFB.

**«Next заменяет FastAPI».** Next — **UI и BFF**; бизнес-логика и БД остаются в API ([`deploy/fastapi`](../../deploy/fastapi/README.md)).

**«SSG и ISR — одно и то же».** SSG — фикс на build; ISR — обновление после deploy без полного rebuild.

**«В Next нет SPA-навигации».** `<Link>` даёт **client-side transition** без full reload — soft navigation ([08-navigation.md](08-navigation.md)).

**«Нужен SSR для админки».** Часто достаточно CSR + auth; SSR — для **публичных** URL.

## Резюме

**CSR (Vite SPA)** — react-basic: просто, интерактивно, слабый SEO из коробки. **Next.js App Router** добавляет **server-first** рендер, file routing и гибрид SSG/ISR/SSR. mock-exams shop выбирает Next для каталога и метаданных, сохраняя FastAPI как API-слой.

## Чек-лист

- [ ] Объясняете CSR, SSR, SSG, ISR на примере страницы товара
- [ ] Назвали 2 причины перехода shop с Vite на Next
- [ ] Понимаете, что RSC — render на сервере, не отдельный «язык»
- [ ] Знаете, что :8090 остаётся backend, Next — :3000
- [ ] Можете сказать, когда SPA всё ещё уместен

Следующий урок: [02. App Router: каталог `app/`, layout и page](02-app-router.md).
