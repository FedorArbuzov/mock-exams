# 02. App Router: каталог `app/`, layout, page, colocation

## Введение: сценарий с работы

Code review, вторник. Junior добавил header в `app/page.tsx` — работает на главной. На `/catalog` header пропал: «Я скопировал только page, layout не трогал». Senior: «В React Router мы оборачивали `<Routes>` в `<Layout>` в `App.tsx`. В Next **layout — файл**, не компонент в каждой странице».

Вы открываете [`examples/app/layout.tsx`](examples/app/layout.tsx): `<html>`, `<body>`, `<header>`, `{children}`. Любая страница под `app/` автоматически рендерится **внутри** этого shell. Product просит «вынести навигацию в одно место» — это уже сделано в стартовом коде; ваша задача в лабе — добавить новые **route segments** без дублирования header.

App Router Next.js 15 — **конвенция над конфигурацией**: URL читается из дерева папок. После этой главы вы перестанете искать «где объявлены routes», как в `routes.tsx` из react-basic.

## Что вы узнаете

- Структура каталога **`app/`** и special files: `layout.tsx`, `page.tsx`.
- Как **route segments** (папки) соотносятся с URL.
- **Colocation** — компоненты рядом с маршрутом, не только в `components/`.
- Корневой layout vs вложенные layouts (preview).
- Отличие **Server Component по умолчанию** в файлах `app/`.
- Связь с [`examples/app/page.tsx`](examples/app/page.tsx) и home route `/`.

## Каталог `app/` — сердце App Router

В **Pages Router** (legacy) маршруты жили в `pages/`. В курсе — только **App Router** (`app/`):

```text
app/
├── layout.tsx       → обёртка для всех маршрутов (root layout)
├── page.tsx         → URL /
├── globals.css
└── catalog/
    └── page.tsx     → URL /catalog   (добавите в лабе)
```

**Правило:** папка = **segment** URL (если нет special file, скрывающего segment). Файл `page.tsx` делает segment **доступным** как страницу.

| Файл | Обязателен | Роль |
|------|------------|------|
| `layout.tsx` | root — да | общий UI, `{children}` |
| `page.tsx` | для URL — да | уникальный контент маршрута |
| `loading.tsx` | нет | skeleton при загрузке (глава 06) |
| `error.tsx` | нет | error boundary (глава 18) |
| `not-found.tsx` | нет | кастомный 404 segment |

## Root layout: HTML-документ один раз

```tsx
// app/layout.tsx — упрощённо из examples
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shop — nextjs-basic", template: "%s | Shop" },
  description: "Next.js App Router курс mock-exams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <nav>
            <Link href="/">Shop</Link>
            <Link href="/catalog">Каталог</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

**Важно:**

- Только **root** layout содержит `<html>` и `<body>`.
- `{children}` — slot для active page (+ nested layouts).
- `metadata` export — SEO ([31-metadata-seo.md](31-metadata-seo.md)).
- Без `"use client"` — **Server Component**.

## page.tsx — контент маршрута

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <section>
      <h1>Shop — nextjs-basic</h1>
      <p className="muted">
        Fullstack-каталог на Next.js App Router. API — FastAPI на порту 8090.
      </p>
    </section>
  );
}
```

Default export **обязан** быть компонентом (sync или async). Имя функции — для DevTools, на URL не влияет.

Сравнение с react-basic:

```tsx
// react-basic — маршрут в JSX
<Route path="/" element={<HomePage />} />
```

```text
// nextjs-basic — маршрут в FS
app/page.tsx  →  /
```

## Route segments и URL

```text
app/
├── page.tsx                 → /
├── catalog/
│   ├── page.tsx             → /catalog
│   └── [id]/
│       └── page.tsx         → /catalog/42
└── contact/
    └── page.tsx             → /contact
```

Segment **`catalog`** — папка. Без `page.tsx` внутри папка **не** даёт URL (может быть layout-only — реже на basic).

**Private folders:** префикс `_components` или папки вне `app/` — не создают URL. Colocation:

```text
app/catalog/
├── page.tsx
├── _components/
│   └── CatalogGrid.tsx    ← не в URL, рядом с route
└── [id]/
    └── page.tsx
```

Подчёркивание `_` — convention «не route segment» (Next не публикует `_folder` как URL).

## Colocation vs глобальный `components/`

| Подход | Когда |
|--------|-------|
| `app/catalog/_components/` | UI только для каталога |
| `components/ui/Button.tsx` | переиспользуется везде |

mock-exams: header в root layout — глобальный; `ProductCard` позже — рядом с catalog или в `components/`.

## Server by default

Файлы в `app/` без `"use client"` — **Server Components**:

- можно `async` + `await fetch` (глава 14);
- **нельзя** `useState`, `useEffect`, browser APIs;
- не увеличивают client JS bundle.

Client islands — [10-client-components.md](10-client-components.md).

## Дерево рендера для `/`

```text
RootLayout
  ├── <header> nav </header>
  └── <main>
        └── HomePage (page.tsx)
```

Для `/catalog` тот же layout, `{children}` = `CatalogPage`.

## Metadata и template

```typescript
title: {
  default: "Shop — nextjs-basic",
  template: "%s | Shop",
}
```

Страница товара экспортирует `title: "Кроссовки"` → `<title>Кроссовки | Shop</title>`.

## Связь с FastAPI :8090

Пока `page.tsx` — статический текст. В главе 14:

```tsx
export default async function CatalogPage() {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const items = await res.json();
  // ...
}
```

Fetch выполнится **на сервере** при запросе `/catalog` (SSR).

## Типичные ошибки

**Дублировать `<html>` во вложенном layout.** Только root. Вложенный layout — `<section>{children}</section>`.

**Искать `App.tsx` или `main.tsx`.** Точка сборки — `app/layout.tsx` + `page.tsx`.

**Папка без `page.tsx` — ожидать URL.** Нужен `page.tsx` (или `route.ts` для API).

**Положить `"use client"` в root layout «на всякий случай».** Весь subtree станет client — теряете RSC. Client — точечно ([10-client-components.md](10-client-components.md)).

**Неправильный регистр:** `Page.tsx` на Linux CI не сработает — только `page.tsx`.

**Импорт CSS не из layout/page.** Глобальные стили — в root layout (`globals.css`); CSS Modules — рядом с компонентом ([29-styling.md](29-styling.md)).

## Чек-лист

- [ ] Объясняете роль `layout.tsx` vs `page.tsx`
- [ ] Можете нарисовать дерево `app/` → URL для `/` и `/catalog`
- [ ] Знаете, что файлы в `app/` по умолчанию Server Components
- [ ] Понимаете colocation `_components` рядом с маршрутом
- [ ] Видели стартовый код в `examples/app/`

Следующий урок: [03. Лаба: первое Next.js-приложение](03-lab-first-app.md).
