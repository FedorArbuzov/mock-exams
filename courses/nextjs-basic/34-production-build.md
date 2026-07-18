# 34. Production build: `next build`, standalone, анализ bundle

## Сценарий с работы: «На dev всё OK, prod — 502 и 800 MB образ»

DevOps: «`npm run dev` не для production. Образ на 1.2 GB, старт 40 секунд, в логах `node_modules` целиком». Вы запускаете `next build` впервые — warnings про **large client bundles**, **middleware** edge size, missing **`output: 'standalone'`** для Docker ([35-docker-deploy.md](35-docker-deploy.md)).

Shop Next.js на `:8098` должен стартовать быстро, не тащить devDependencies, уметь **SSR** к FastAPI `:8090` в runtime — значит **не** static export ([36-static-export.md](36-static-export.md)).

---

## Что вы узнаете

- Что делает **`next build`** и чем отличается от `dev`.
- **`output: 'standalone'`** для минимального Docker runtime.
- **`next start`** vs custom server.
- Анализ bundle: **@next/bundle-analyzer**, Turbopack insights.
- Env vars: `NEXT_PUBLIC_*` vs server-only at build time.
- Типичные prod-only баги.

---

## Жизненный цикл production

```text
next build   → .next/ (optimized server + static + manifests)
next start   → Node HTTP server, SSR/ISR
```

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 8098",
    "analyze": "ANALYZE=true next build"
  }
}
```

| Команда | Назначение |
|---------|------------|
| `next dev` | HMR, verbose errors, **не** prod perf |
| `next build` | compile, tree-shake, static generation |
| `next start` | serve `.next` production |

**Никогда** `next dev` за nginx в prod.

---

## Что создаёт `next build`

```text
.next/
  standalone/          # при output: 'standalone'
  static/              # hashed JS/CSS assets
  server/              # server bundles
  BUILD_ID
  routes-manifest.json
```

Build лог показывает:

- **Route (app)** — ○ static, λ dynamic, ƒ server action
- **First Load JS** per route — client bundle size
- **Middleware** size — лимит edge

Пример строки:

```text
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          87 kB
├ λ /catalog                             1.2 kB         102 kB
├ λ /items/[id]                          890 B          101 kB
└ ○ /_not-found                          142 B          87 kB
```

- **○ (Static)** — prerender at build
- **λ (Dynamic)** — server render on request
- **ƒ** — server actions / special

Shop catalog с `fetch` без `cache: 'force-cache'` часто **dynamic** — это нормально для SSR к API.

---

## `output: 'standalone'`

Для Docker ([35-docker-deploy.md](35-docker-deploy.md)) включите в `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // rewrites, images — как раньше
};

export default nextConfig;
```

После build:

```text
.next/standalone/
  server.js
  node_modules/     # только traced dependencies
  .next/            # minimal server artifacts
```

**Trace** анализирует imports и копирует **только нужные** файлы из `node_modules`. Образ падает с ~1 GB до ~150–250 MB типично.

Runtime в контейнере:

```dockerfile
CMD ["node", "server.js"]
# слушает PORT env, default 3000
```

Копируйте также `public/` и `.next/static` в образ — standalone **не** включает их автоматически в один folder (см. Dockerfile в главе 35).

---

## Environment variables at build

| Variable | Когда embed |
|----------|-------------|
| `NEXT_PUBLIC_*` | **build time** — в client JS |
| `FASTAPI_URL` (server) | **runtime** — read in Server Components / Route Handlers |
| `NEXT_PUBLIC_SITE_URL` | build — OG URLs если hardcoded in client |

**Ошибка:** CI build с `NEXT_PUBLIC_API=http://localhost:8090` → prod client бьёт localhost.

Паттерн mock-exams:

```env
# runtime in Docker
FASTAPI_URL=http://fastapi:8090
NEXT_PUBLIC_SITE_URL=https://shop.example.com
```

Server fetch использует `FASTAPI_URL`; client islands — Route Handlers BFF ([20-lab-route-handlers.md](20-lab-route-handlers.md)), не прямой `:8090`.

---

## Анализ bundle size

### @next/bundle-analyzer

```bash
npm install -D @next/bundle-analyzer
```

```ts
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
```

```bash
ANALYZE=true npm run build
# откроет treemap client bundles
```

**Ищите:** entire `lodash`, `moment`, duplicate `@tanstack/query` chunks, accidental **server-only** import в client boundary.

### Что раздувает shop client bundle

| Причина | Fix |
|---------|-----|
| `"use client"` на layout | поднять boundary ниже |
| Import server utils в client | split `lib/server/` |
| Heavy chart library на catalog | dynamic `import()` |
| All icons from `@mui/icons-material` | tree-shake или SVG |

```tsx
// dynamic import client-only
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/features/cart/CartDrawer"), {
  ssr: false,
  loading: () => <p>Загрузка...</p>,
});
```

---

## Compiler options (обзор)

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  experimental: {
    // следите за changelog Next 15
  },
};
```

`reactStrictMode: true` — dev double render; prod unaffected.

---

## Проверка build локально

```bash
cd courses/nextjs-basic/examples
npm run build
npm run start
# http://localhost:8098 если -p 8098
curl -I http://localhost:8098/catalog
```

Checklist после build:

1. Нет TypeScript errors — build fail on TS by default.
2. Dynamic routes работают с runtime env `FASTAPI_URL`.
3. Static assets 200 (`/_next/static/...`).
4. Middleware не exceeds size limit.

---

## Build vs runtime errors

| Симптом | Причина |
|---------|---------|
| Works dev, 500 prod | env missing at runtime |
| Empty catalog prod | `FASTAPI_URL` wrong network in Docker |
| Client calls localhost | `NEXT_PUBLIC_*` baked wrong |
| `Dynamic server usage` error | `cookies()` in static page without `dynamic = 'force-dynamic'` |

```tsx
// force dynamic if needed
export const dynamic = "force-dynamic";
```

Используйте **точечно** — теряете static optimization.

---

## Monorepo и CI

В GitLab CI ([gitlab-basic](../gitlab-basic/README.md)):

```yaml
build-nextjs:
  script:
    - cd courses/nextjs-basic/examples
    - npm ci
    - npm run build
  artifacts:
    paths:
      - courses/nextjs-basic/examples/.next/
```

Docker build часто **multi-stage**: deps → build → runtime ([35-docker-deploy.md](35-docker-deploy.md)).

---

## Типичные ошибки

**Deploy `.next` без `next start`** — нужен Node server для SSR.

**Copy whole repo in Docker** без standalone — огромный образ.

**Build на Mac, run on Linux** — native modules mismatch; build in CI Linux.

**Ignore build warnings First Load JS 500kB+** — UX страдает на mobile.

**`output: 'export'` случайно** — ломает SSR/API routes ([36-static-export.md](36-static-export.md)).

**Analyze только один route** — смотрите shared chunks.

**Forgot `public/` in Docker** — missing favicon/og.

---

## Резюме

**`next build`** готовит оптимизированный `.next/`; **`output: 'standalone'`** — минимальный traced runtime для Docker. **`next start`** на порту **8098** для mock-exams. Анализируйте **First Load JS** и bundle analyzer до того, как DevOps увидит 800 MB образ.

---

## Чек-лист

- [ ] Разница dev / build / start
- [ ] Зачем `output: 'standalone'`
- [ ] Build-time vs runtime env
- [ ] ○ vs λ в build output
- [ ] Как запустить bundle analyzer
- [ ] Что копировать в Docker кроме standalone
- [ ] Когда `dynamic = 'force-dynamic'`

Следующий урок: [35. Docker: multi-stage и deploy/nextjs](35-docker-deploy.md).
