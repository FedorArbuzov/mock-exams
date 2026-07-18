# 36. Static export (`output: 'export'`) vs SSR — tradeoffs

## Сценарий с работы: «Можем хостить на S3 без Node?»

CTO спрашивает: «Netlify бесплатный tier — давайте static export, без сервера». Backend lead: «Каталог каждый час меняется на `:8090`, contact form через Server Actions, Route Handlers BFF — как без Node?». Вы открываете docs: **`output: 'export'`** генерирует **только HTML/CSS/JS** — нет SSR runtime, нет dynamic server routes без pre-render списка.

Shop mock-exams **по умолчанию** — **SSR + Docker :8098** ([35-docker-deploy.md](35-docker-deploy.md)). Static export — **осознанный** tradeoff для landing/docs, не для fullstack catalog без перестройки архитектуры.

---

## Что вы узнаете

- Что делает **`output: 'export'`** и **`next export`** (legacy).
- Что **ломается** при static export.
- **SSG vs SSR vs ISR vs static export** — таблица решений.
- Hybrid: static marketing + API на другом origin.
- Когда mock-exams shop **не** подходит для export.

---

## `output: 'export'` — как работает

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // images: { unoptimized: true }, // обязательно для export
};

export default nextConfig;
```

```bash
npm run build
# создаёт out/ вместо server-centric .next standalone
```

```text
out/
  index.html
  catalog.html          # или catalog/index.html
  _next/static/...
```

Hosting: **S3 + CloudFront**, GitHub Pages, nginx `root /usr/share/nginx/html` — **без** `node server.js`.

---

## Что НЕ работает с static export

| Feature | Static export |
|---------|---------------|
| SSR on demand | ❌ |
| ISR (`revalidate`) | ❌ |
| Route Handlers `app/api/*` | ❌ |
| Server Actions | ❌ |
| Middleware (dynamic) | ❌ limited |
| `cookies()`, `headers()` dynamic | ❌ |
| `next/image` default optimizer | ❌ → `unoptimized: true` |
| Dynamic routes без `generateStaticParams` | ❌ must pre-render all paths |

Любая **server-side** логика shop ([14-server-fetch.md](14-server-fetch.md), [19-route-handlers.md](19-route-handlers.md), [21-server-actions.md](21-server-actions.md)) требует **переноса** на:

- client-side `fetch` к `:8090` (CORS!) или
- external BFF (nodejs :8096) или
- build-time fetch only (данные **заморожены** на момент build)

---

## SSG vs SSR vs ISR vs export

| Режим | Когда render | Node server | Данные |
|-------|--------------|-------------|--------|
| **SSG** | build time | optional (CDN static) | snapshot at build |
| **ISR** | build + periodic revalidate | **да** | обновляются по interval |
| **SSR** | each request | **да** | fresh |
| **static export** | build only | **нет** | frozen until rebuild |

```tsx
// ISR (НЕ export)
fetch(url, { next: { revalidate: 60 } });

// SSR dynamic
fetch(url, { cache: "no-store" });

// SSG
fetch(url, { cache: "force-cache" });
```

Static export ≈ **pure SSG** всех pre-renderable pages.

---

## Dynamic routes при export

Нужен **полный список** params at build:

```tsx
// app/items/[id]/page.tsx
export async function generateStaticParams() {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const items: { id: number }[] = await res.json();
  return items.map((item) => ({ id: String(item.id) }));
}
```

**Новый товар** на API после deploy → **404** на static host пока не пересоберёте. Для catalog с частыми изменениями — **неприемлемо** без CI rebuild on webhook.

---

## Shop catalog: SSR path (рекомендация mock-exams)

```text
Browser → Next.js :8098 (SSR)
              ↓ server fetch
          FastAPI :8090
```

Плюсы:

- Fresh catalog без rebuild
- Route Handlers скрывают API keys
- Server Actions для contact ([22-lab-server-actions.md](22-lab-server-actions.md))
- Metadata `generateMetadata` с live data ([31-metadata-seo.md](31-metadata-seo.md))
- Docker standalone ([35-docker-deploy.md](35-docker-deploy.md))

---

## Static export path (если бы делали landing)

```text
Browser → CDN static HTML/JS
              ↓ client fetch (CORS)
          FastAPI :8090
```

Плюсы:

- Дешёвый hosting, extreme scale static
- Нет Node ops

Минусы для shop:

- CORS на `:8090` ([react-basic/18-cors-fastapi](../react-basic/18-cors-fastapi.md))
- API URL в client bundle
- Нет Server Actions — form → отдельный POST API
- SEO catalog OK если pre-render **всех** items at build
- Корзина — чисто client (OK)

---

## Hybrid architecture

| Часть | Hosting |
|-------|---------|
| Marketing `/`, `/about` | static export / CMS |
| `/catalog`, `/items/*` | SSR Next :8098 |
| Admin | Django :8092 |

Два deploy или monorepo с split — сложность ops.

---

## `images.unoptimized`

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

Или custom loader CDN. Без этого — build error.

---

## Middleware и export

Middleware с redirect/locale **не** работает как на server — проверяйте docs версии Next. i18n `[locale]` ([33-i18n-overview.md](33-i18n-overview.md)) на pure static — client redirect или hosting rules.

---

## Decision matrix для mock-exams

| Требование | SSR Docker | Static export |
|------------|------------|---------------|
| Live catalog from :8090 | ✅ | ❌ без client+CORS |
| Server Actions contact | ✅ | ❌ |
| Route Handlers BFF | ✅ | ❌ |
| Deploy :8098 | ✅ | другой host |
| S3-only infra | ❌ | ✅ |
| Новые товары без rebuild | ✅ | ❌ |

**Capstone [39-capstone.md](39-capstone.md)** — SSR path.

---

## Миграция SSR → export (если forced)

1. Убрать Route Handlers / Server Actions → REST client.
2. Включить CORS на FastAPI.
3. `generateStaticParams` для всех `[id]`.
4. CI webhook rebuild on catalog change.
5. `images.unoptimized: true`.
6. Accept frozen contact form → API POST from client.

Обратная миграция export → SSR проще: убрать `output: 'export'`, deploy Docker.

---

## Типичные ошибки

**Думать export = «бесплатный SSR»** — это **нет** server.

**Забыли `generateStaticParams`** — build fail on dynamic routes.

**ISR на export** — не поддерживается.

**Secret API key в client fetch** после перехода на export — security leak.

**OG dynamic metadata** — только build-time data.

**Preview/staging без rebuild** — stale prices on static site.

**Mixed config** `standalone` + `export` — mutually exclusive output modes.

---

## Резюме

**`output: 'export'`** — чистый static site из build, **без Node runtime**. Tradeoff: простой cheap hosting vs **нет** SSR, API routes, Server Actions, live catalog. Shop mock-exams с FastAPI BFF и Docker **:8098** — **SSR + standalone**, не export.

---

## Чек-лист

- [ ] Что создаётся в `out/` vs `.next/standalone`
- [ ] Список features incompatible с export
- [ ] Роль `generateStaticParams` при export
- [ ] Зачем `images.unoptimized`
- [ ] SSR vs ISR vs export — когда что
- [ ] Почему capstone выбирает SSR
- [ ] CORS implication при client-only fetch

Следующий урок: [37. Лаба: Docker образ локально](37-lab-docker.md).
