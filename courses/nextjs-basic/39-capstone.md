# 39. Capstone: Shop Catalog fullstack (8–10 часов)

## Введение: зачем capstone

До этой главы вы учили **фрагменты** Next.js App Router: RSC ([09-server-components.md](09-server-components.md)), server fetch ([14-server-fetch.md](14-server-fetch.md)), Route Handlers ([19-route-handlers.md](19-route-handlers.md)), Server Actions ([21-server-actions.md](21-server-actions.md)), metadata ([31-metadata-seo.md](31-metadata-seo.md)), Docker ([35-docker-deploy.md](35-docker-deploy.md)). Capstone собирает **production-like shop** — SSR каталог к FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) на **:8090**, Next.js в Docker на **:8098**.

Аналог в JS-треке — [react-basic/38-capstone](../react-basic/38-capstone.md) (SPA shop); здесь — **fullstack SSR + BFF**. Backend capstone — [fastapi/42-capstone](../fastapi/42-capstone.md).

**Оценка времени:** **8–10 часов** (4–5 сессий по ~2 часа).

Если застряли — возвращайтесь к урокам из таблицы «Когда смотреть», не копируйте готовый boilerplate без понимания.

---

## Задача

**Shop Catalog Next.js** — fullstack приложение каталога товаров:

- **SSR** список и детали с FastAPI
- **Route Handlers** как BFF-слой
- **Server Action** форма контактов
- **Client island** корзина
- **Metadata / SEO** per product
- **Docker deploy** `:8098` + FastAPI `:8090`

Домен тот же, что в Python/React курсах: **items** (`id`, `title`, `description`, опционально `price`).

---

## Функциональные требования

### Маршруты (App Router)

| Path | Тип | Описание |
|------|-----|----------|
| `/` | redirect | → `/catalog` |
| `/catalog` | Server SSR | Список товаров с FastAPI |
| `/items/[id]` | Server SSR dynamic | Деталь + add to cart (client) |
| `/cart` | Client island | Корзина, noindex metadata |
| `/contact` | Server Action form | Обратная связь |
| `not-found` | `not-found.tsx` | 404 UI |

Layout: общий **Header** (nav, cart badge client), **Footer**, `<main>{children}</main>`.

### API (FastAPI :8090)

| Метод | Endpoint | Использование |
|-------|----------|---------------|
| GET | `/health` | smoke / optional footer |
| GET | `/api/v1/items` | Catalog SSR + sitemap |
| GET | `/api/v1/items/{id}` | Item SSR + metadata |

```bash
cd deploy/fastapi
docker compose up -d --build
curl http://localhost:8090/api/v1/items
```

### BFF Route Handlers (Next.js)

| Method | Route | Назначение |
|--------|-------|------------|
| GET | `/api/items` | Proxy list (optional if direct server fetch) |
| GET | `/api/items/[id]` | Proxy detail |
| GET | `/api/health` | Docker healthcheck |
| POST | `/api/contact` | Optional proxy; или только Server Action |

Server Components могут fetch **напрямую** `FASTAPI_URL` или через internal Route Handler — **один стиль** на проект, документируйте в README.

**Env:**

```env
FASTAPI_URL=http://localhost:8090          # dev host
# Docker: http://fastapi:8090
NEXT_PUBLIC_SITE_URL=http://localhost:8098
PORT=8098
```

### CatalogPage (`/catalog`)

- Server Component: `fetch` items с `{ next: { revalidate: 60 } }` или `no-store` (обоснуйте в README)
- **loading.tsx** — skeleton
- **error.tsx** — message + retry (`reset`)
- Empty state если `items.length === 0`
- Grid **ProductCard** (Server или Client wrapper с client AddButton)
- Поиск: server searchParams `?q=` **или** client filter island — минимум один вариант

### ItemDetailPage (`/items/[id]`)

- Shared **`getItem(id)`** для page + **`generateMetadata`**
- `notFound()` если API 404
- OG title/description ([32-lab-metadata.md](32-lab-metadata.md))
- Add to cart — client button

### CartPage (`/cart`)

- **`"use client"`** page **или** client children в server page
- Context / `useState` + localStorage (extension)
- qty +/-, remove, clear, empty state
- Badge count в Header
- **`cart/layout.tsx`** → `robots: { index: false }`

### ContactPage (`/contact`)

- **Server Action** `"use server"` ([22-lab-server-actions.md](22-lab-server-actions.md))
- Поля: name, email, message — validation server-side
- `useFormStatus` / pending UI на client form wrapper
- Success/error messages (можно log + mock save без real email)

### Metadata / SEO

- Root `metadataBase`, `title.template`
- **`app/sitemap.ts`** — URLs items
- **`app/robots.ts`** — disallow `/cart`, `/api/`
- Per-item **`generateMetadata`**

---

## Нефункциональные требования

| Требование | Зачем |
|------------|-------|
| TypeScript strict | production habit |
| Server/client boundaries чёткие | perf, interview topic |
| `output: 'standalone'` | Docker |
| Multi-stage Dockerfile | [35-docker-deploy.md](35-docker-deploy.md) |
| Compose :8098 + :8090 | mock-exams stack |
| Healthcheck `/api/health` | [37-lab-docker.md](37-lab-docker.md) |
| CSS Modules или Tailwind ([29-styling.md](29-styling.md)) | consistent UI |
| `next/image` для placeholder ([30-images-fonts.md](30-images-fonts.md)) | optional |
| README с командами dev + docker | reviewer onboarding |
| `npm run build` без ошибок | CI gate |

---

## Целевая структура

```text
courses/nextjs-basic/examples/   # или examples/capstone/
├── README.md
├── .env.example
├── Dockerfile                   # или deploy/nextjs/
├── next.config.ts               # standalone + rewrites
├── package.json
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                 # redirect catalog
│   ├── not-found.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── catalog/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── items/[id]/
│   │   └── page.tsx             # + generateMetadata
│   ├── cart/
│   │   ├── layout.tsx           # noindex metadata
│   │   └── page.tsx
│   ├── contact/
│   │   ├── page.tsx
│   │   └── actions.ts           # Server Actions
│   └── api/
│       ├── health/route.ts
│       └── items/               # optional BFF
├── components/
│   ├── layout/Header.tsx
│   ├── layout/Footer.tsx
│   └── catalog/ProductCard.tsx
├── features/
│   └── cart/
│       ├── CartProvider.tsx     # "use client"
│       └── AddToCartButton.tsx
├── lib/
│   ├── api/items.ts             # getItems, getItem
│   └── validations/contact.ts
└── types/
    └── item.ts
```

```mermaid
flowchart TB
  subgraph docker [Docker Compose]
    Next[nextjs :8098 SSR]
    API[fastapi :8090]
  end
  Browser[Browser] --> Next
  Next -->|server fetch / BFF| API
  Next --> CartClient[Client Cart Island]
  CartClient --> Browser
```

---

## Пошаговый план (рекомендуемый)

### Сессия 1 (~2 ч): каркас + SSR catalog

1. Scaffold или evolve [`examples/`](examples/package.json).
2. `lib/api/items.ts` — `getItems()`, typed `Item`.
3. `/catalog` Server Component + loading/error.
4. Header/Footer layout, redirect `/` → `/catalog`.
5. **Критерий:** catalog SSR HTML содержит titles с `:8090`.

**Уроки:** [14-server-fetch.md](14-server-fetch.md), [15-lab-server-fetch.md](15-lab-server-fetch.md), [18-error-not-found.md](18-error-not-found.md).

### Сессия 2 (~2 ч): dynamic item + metadata + cart

1. `/items/[id]` + shared `getItem`.
2. **`generateMetadata`** + canonical.
3. Client **CartProvider** + AddToCartButton.
4. `/cart` page + badge.
5. **Критерий:** add on detail → visible on `/cart`; View Source title = item name.

**Уроки:** [05-dynamic-routes.md](05-dynamic-routes.md), [32-lab-metadata.md](32-lab-metadata.md), [25-lab-client-state.md](25-lab-client-state.md).

### Сессия 3 (~2 ч): BFF + contact + SEO files

1. Route Handler `/api/health` + optional items proxy ([20-lab-route-handlers.md](20-lab-route-handlers.md)).
2. Contact **Server Action** + validation ([22-lab-server-actions.md](22-lab-server-actions.md)).
3. `robots.ts`, `sitemap.ts`, cart noindex.
4. **Критерий:** form invalid blocked server-side; sitemap lists items.

**Уроки:** [19-route-handlers.md](19-route-handlers.md), [21-server-actions.md](21-server-actions.md), [31-metadata-seo.md](31-metadata-seo.md).

### Сессия 4 (~2 ч): styling + polish

1. CSS Modules или Tailwind для catalog grid ([29-styling.md](29-styling.md)).
2. `next/image` placeholder ([30-images-fonts.md](30-images-fonts.md)).
3. Search `?q=` или filter.
4. `npm run build`, fix TS/errors.
5. **Критерий:** production build OK.

### Сессия 5 (~1–2 ч): Docker + README

1. `output: 'standalone'`, Dockerfile, compose :8098/:8090 ([37-lab-docker.md](37-lab-docker.md)).
2. Smoke: health, catalog, docker logs.
3. README: architecture diagram, env table, screenshots.
4. Self-check acceptance below.

---

## Подсказки по реализации

### Shared getItem (dedupe)

```tsx
// lib/api/items.ts
const base = () => process.env.FASTAPI_URL ?? "http://localhost:8090";

export async function getItem(id: string): Promise<Item | null> {
  const res = await fetch(`${base()}/api/v1/items/${id}`, {
    next: { revalidate: 60, tags: [`item-${id}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Item ${id} fetch failed`);
  return res.json();
}
```

### generateMetadata

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Товар не найден" };
  return {
    title: item.title,
    description: item.description.slice(0, 160),
    openGraph: { title: item.title, url: `/items/${id}` },
  };
}
```

### Server Action sketch

```tsx
// app/contact/actions.ts
"use server";

import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export type ContactState = { ok: boolean; errors?: Record<string, string[]> };

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  // log / mock persist
  console.info("contact", parsed.data);
  return { ok: true };
}
```

### Cart functional update

```tsx
setLines((prev) => {
  const i = prev.findIndex((l) => l.id === item.id);
  if (i >= 0) {
    return prev.map((l, idx) =>
      idx === i ? { ...l, qty: l.qty + 1 } : l
    );
  }
  return [...prev, { id: item.id, title: item.title, qty: 1 }];
});
```

---

## Расширения (опционально)

| Уровень | Задача | Часы |
|---------|--------|------|
| A | TanStack Query client + dehydrate SSR | +1.5 |
| B | Middleware auth stub `/admin` | +1 |
| C | `[locale]` ru/en ([33-i18n-overview.md](33-i18n-overview.md)) | +2 |
| D | OG image `opengraph-image.tsx` per item | +1 |
| E | Playwright e2e smoke catalog | +2 |
| F | nginx reverse proxy front :8098 | +1 |

---

## Критерии приёмки (самопроверка)

- [ ] `docker compose up` → `:8098/catalog` SSR items from `:8090`
- [ ] `/items/1` title + OG; `/items/99999` → not-found
- [ ] Cart: add, qty, remove, empty, badge
- [ ] Contact: server validation, pending state, success UI
- [ ] `sitemap.xml` + `robots.txt` correct
- [ ] `/cart` noindex
- [ ] `curl :8098/api/health` OK; compose healthy
- [ ] `npm run build` + Docker build success
- [ ] README complete
- [ ] Server/client split explainable in interview
- [ ] [interview-cheatsheet.md](interview-cheatsheet.md) пройден без подглядывания
- [ ] [38-interview-qa.md](38-interview-qa.md) — ≥ 30/35 уверенно

---

## Типичные ошибки

1. **`FASTAPI_URL=localhost` inside Docker** — use service name `fastapi`.

2. **Metadata in client cart page** — use `cart/layout.tsx`.

3. **Forgot COPY `.next/static` in Docker** — broken CSS.

4. **Entire app `"use client"`** — defeats Next.js value.

5. **Duplicate fetch** page vs metadata — share `getItem`.

6. **Static export enabled** — breaks SSR/API ([36-static-export.md](36-static-export.md)).

7. **Client direct `:8090` without CORS** — use server fetch or BFF.

8. **No loading/error** — poor UX, interview red flag.

9. **Hardcoded URLs** — env for staging/prod.

10. **Healthcheck on heavy SSR route** — use `/api/health`.

---

## Когда смотреть уроки

| Проблема | Урок |
|---------|------|
| Server fetch / cache | 14, 16, 17 |
| Dynamic route / 404 | 05, 18 |
| Client cart | 10, 25 |
| Route Handlers BFF | 19, 20 |
| Server Actions form | 21, 22 |
| Metadata / sitemap | 31, 32 |
| Docker / standalone | 34, 35, 37 |
| Styling | 29, 30 |
| Export vs SSR confusion | 36 |

---

## После capstone

1. Ещё раз [interview-cheatsheet.md](interview-cheatsheet.md) и [38-interview-qa.md](38-interview-qa.md).
2. Отметьте в [javascript-path.md](../javascript-path.md): **react-intermediate**, **javascript-testing**, **nodejs-basic**.
3. Portfolio: скриншоты + Docker compose commands + ссылка на ветку `capstone-nextjs-shop`.
4. Optional: интеграция Django admin `:8092` для контента items.

Поздравляем — **nextjs-basic** завершён.

---

[← 38-interview-qa](38-interview-qa.md) · [interview-cheatsheet](interview-cheatsheet.md) · [README](README.md)
