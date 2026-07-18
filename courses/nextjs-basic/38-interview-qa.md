# 38. Interview Q&A: топ-35 вопросов по Next.js App Router

## Введение: зачем эта глава

На fullstack/frontend собеседовании Next.js проверяют **App Router mental model**: Server vs Client Components, где выполняется fetch, caching, Route Handlers vs Server Actions, metadata, production deploy. Эта глава — **развёрнутые ответы** к [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать:**

1. Прочитайте вопрос, **закройте** ответ, ответьте вслух 1–2 минуты.
2. Сравните с разбором: важно **почему**, не только **что**.
3. Провал — вернитесь к уроку из «Где в курсе».

---

## Блок 1. Ландшафт и App Router

### 1. Чем Next.js App Router отличается от Vite + React SPA?

**Ответ.** Vite SPA — **client-only** bundle: браузер загружает JS, данные через `fetch` к API, SEO и first paint слабее без SSR. **App Router** — file-based routing в `app/`, **React Server Components** по умолчанию: HTML с данными с сервера, меньше client JS, встроенные layouts, streaming, Route Handlers и Server Actions на том же Node runtime. Next добавляет **build pipeline**, caching semantics для `fetch`, metadata API, оптимизацию images/fonts.

**Где в курсе:** [01-landscape.md](01-landscape.md), [02-app-router.md](02-app-router.md).

---

### 2. Что такое `app/` directory и file conventions?

**Ответ.** `app/` — корень маршрутов. **`page.tsx`** — UI segment, **`layout.tsx`** — shared shell (persist при navigation), **`loading.tsx`**, **`error.tsx`**, **`not-found.tsx`**, **`route.ts`** — HTTP handlers. Папки = URL segments; `[id]` — dynamic; `(group)` — route groups без URL. **`layout.tsx` root** обязателен с `<html>` и `<body>`.

**Где в курсе:** [02-app-router.md](02-app-router.md), [04-routing.md](04-routing.md).

---

### 3. SSR vs SSG vs ISR в Next.js 15?

**Ответ.** **SSG** — HTML на build (`force-cache`). **SSR** — render on each request (`no-store` или dynamic). **ISR** — static + **`revalidate`** interval/tags — обновление без full rebuild. App Router выбирает режим через **cache options** `fetch` и static analysis route. Static **`output: 'export'`** — только build-time HTML, без Node ([36-static-export.md](36-static-export.md)).

**Где в курсе:** [01-landscape.md](01-landscape.md), [16-caching-revalidate.md](16-caching-revalidate.md).

---

### 4. Pages Router vs App Router — мигрировать ли?

**Ответ.** **Pages Router** (`pages/`, `getServerSideProps`, `getStaticProps`) — legacy но supported. **App Router** — recommended greenfield: RSC, layouts nesting, Server Actions. Coexistence возможна в одном проекте. Новые фичи (metadata API, `use` hook server) — App-first. mock-exams курс — только App Router.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 5. Что такое React Server Components (RSC)?

**Ответ.** Компоненты, выполняющиеся **на сервере**, не попадают в client bundle (кроме serialized output). Могут async/await, читать БД, filesystem. **Не** могут `useState`, `useEffect`, browser APIs. Default в `app/` — Server Component. Client — директива **`"use client"`** на границе модуля.

**Где в курсе:** [09-server-components.md](09-server-components.md), [10-client-components.md](10-client-components.md).

---

## Блок 2. Server vs Client boundary

### 6. Когда нужен `"use client"`?

**Ответ.** Когда компоненту нужны **hooks**, event handlers (`onClick`), browser APIs (`localStorage`, `window`), или stateful libs (TanStack Query client, framer-motion). Стратегия: **минимальный** client subtree — «острова» ([25-lab-client-state.md](25-lab-client-state.md)). Server page импортирует client button — boundary на client file.

**Где в курсе:** [10-client-components.md](10-client-components.md).

---

### 7. Можно ли импортировать Server Component в Client?

**Ответ.** **Нет** напрямую — client bundle не может import server-only code. **Да** через **composition**: Server parent передаёт `<ServerChild />` как **`children`** или prop в Client wrapper. Server рендерит client + slots.

**Где в курсе:** [12-composition-patterns.md](12-composition-patterns.md).

---

### 8. Можно ли fetch в Server Component?

**Ответ.** **Да** — preferred pattern. Async Server Component:

```tsx
export default async function Page() {
  const data = await fetch(url);
  return <List items={await data.json()} />;
}
```

Next **dedupe** и **cache** fetch по умолчанию. Client fetch — для интерактива, polling, user-specific после hydration.

**Где в курсе:** [14-server-fetch.md](14-server-fetch.md).

---

### 9. Почему нельзя hooks в Server Component?

**Ответ.** Hooks требуют **client React runtime** и persistent state между user interactions. Server Component render **один раз** на request/stream — нет lifecycle как у client. `useState` на server — architectural mismatch → compile error.

**Где в курсе:** [09-server-components.md](09-server-components.md).

---

### 10. Suspense и streaming — зачем?

**Ответ.** **Suspense** boundaries позволяют **partial HTML stream**: shell layout сразу, медленный catalog позже. UX: skeleton из `loading.tsx`. Server отправляет chunks — TTFB лучше чем wait-all-data. RSC + Suspense — core pattern App Router.

**Где в курсе:** [13-suspense-streaming.md](13-suspense-streaming.md).

---

## Блок 3. Routing и navigation

### 11. Dynamic routes `[id]` — как получить params?

**Ответ.** В **Next 15** `params` часто **`Promise`**:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

`generateStaticParams` для SSG paths. `notFound()` для 404 ([18-error-not-found.md](18-error-not-found.md)).

**Где в курсе:** [05-dynamic-routes.md](05-dynamic-routes.md).

---

### 12. `Link` vs `useRouter` vs `<a>`?

**Ответ.** **`Link`** — client navigation без full reload, prefetch visible routes. **`useRouter().push`** — programmatic (после mutation). **`<a>`** — external URLs или full navigation. App Router: `next/link`, `next/navigation` (не `next/router` Pages API).

**Где в курсе:** [08-navigation.md](08-navigation.md).

---

### 13. Layout vs template?

**Ответ.** **Layout** — **persist** state при navigation между sibling pages (header, cart provider server shell). **Template** — **remount** on navigate (animation key). Большинство shop UI — layouts; templates реже.

**Где в курсе:** [06-layouts-templates.md](06-layouts-templates.md).

---

### 14. `loading.tsx` vs Suspense?

**Ответ.** **`loading.tsx`** — file convention, auto-wraps page in Suspense boundary. Manual `<Suspense fallback={...}>` — finer control внутри page. Оба — streaming UX.

**Где в курсе:** [06-layouts-templates.md](06-layouts-templates.md), [13-suspense-streaming.md](13-suspense-streaming.md).

---

## Блок 4. Data, cache, BFF

### 15. Как работает caching `fetch` в Next.js?

**Ответ.** Default **`force-cache`** (static) в Server Components. Opt-out: `{ cache: 'no-store' }` — dynamic SSR. **`next: { revalidate: 60 }`** — ISR. **`tags` + `revalidateTag`** — on-demand invalidation ([16-caching-revalidate.md](16-caching-revalidate.md)). Не путать с TanStack Query client cache.

**Где в курсе:** [16-caching-revalidate.md](16-caching-revalidate.md).

---

### 16. Route Handlers vs Server Actions vs прямой fetch к API?

**Ответ.** **Server Component fetch** — read data SSR, simplest. **Route Handlers** (`app/api/.../route.ts`) — REST endpoints, webhooks, BFF proxy к `:8090`, hide secrets ([19-route-handlers.md](19-route-handlers.md)). **Server Actions** — mutations из forms (`"use server"`), без отдельного API route ([21-server-actions.md](21-server-actions.md)). Client browser → Route Handler → FastAPI избегает CORS и exposes tokens.

**Где в курсе:** [19-route-handlers.md](19-route-handlers.md), [20-lab-route-handlers.md](20-lab-route-handlers.md), [21-server-actions.md](21-server-actions.md).

---

### 17. Waterfall fetch — как избежать?

**Ответ.** Sequential awaits в одном component — waterfall. Fix: **`Promise.all`** parallel requests ([17-parallel-fetch.md](17-parallel-fetch.md)), split Suspense boundaries (fast shell + slow section), или colocate data needs in single server function. Measure in dev logging timing.

**Где в курсе:** [17-parallel-fetch.md](17-parallel-fetch.md).

---

### 18. Middleware — что может и не может?

**Ответ.** **`middleware.ts`** на Edge: redirect, rewrite, set headers/cookies, auth gate **before** route. Matcher config limits paths. **Не** полноценный Node (ограниченные APIs). Не заменяет Server Component auth alone — defense in depth ([23-middleware.md](23-middleware.md)).

**Где в курсе:** [23-middleware.md](23-middleware.md).

---

### 19. TanStack Query в Next.js — где?

**Ответ.** **Client islands** only — Query needs hooks. Pattern: SSR initial data via Server Component props or prefetch + dehydrate (advanced); mock-exams basic — server list SSR + client cart/mutations Query ([24-tanstack-query.md](24-tanstack-query.md)). Не дублировать server list cache и Query без стратегии.

**Где в курсе:** [24-tanstack-query.md](24-tanstack-query.md), [25-lab-client-state.md](25-lab-client-state.md).

---

## Блок 5. Metadata, assets, i18n

### 20. Metadata API vs `next/head`?

**Ответ.** App Router: **`export const metadata`** или **`generateMetadata`** in server files. Type-safe `Metadata` object — title, description, openGraph, robots. **`next/head`** — Pages Router. Nested layouts merge metadata; **`metadataBase`** for absolute OG URLs ([31-metadata-seo.md](31-metadata-seo.md)).

**Где в курсе:** [31-metadata-seo.md](31-metadata-seo.md).

---

### 21. `generateMetadata` и duplicate fetch?

**Ответ.** Same `fetch` URL in page + metadata — Next **dedupes** per request. Best practice: shared **`getItem(id)`** function. Async metadata for `/items/[id]` from FastAPI `:8090`.

**Где в курсе:** [31-metadata-seo.md](31-metadata-seo.md), [32-lab-metadata.md](32-lab-metadata.md).

---

### 22. `next/image` — зачем не `<img>`?

**Ответ.** Lazy load, responsive sizes, modern formats (WebP/AVIF), CLS prevention via width/height, optional blur placeholder. Remote domains need **`images.remotePatterns`**. Static export requires **`unoptimized: true`** ([30-images-fonts.md](30-images-fonts.md)).

**Где в курсе:** [30-images-fonts.md](30-images-fonts.md).

---

### 23. i18n в App Router без built-in config?

**Ответ.** **`app/[locale]/...`** segment + middleware default locale + JSON dictionaries. **`next-intl`** for client translations. hreflang via **`metadata.alternates.languages`**. Unlike Pages `i18n` in config ([33-i18n-overview.md](33-i18n-overview.md)).

**Где в курсе:** [33-i18n-overview.md](33-i18n-overview.md).

---

## Блок 6. Production, Docker, export

### 24. `next build` vs `next dev`?

**Ответ.** **dev** — HMR, slow, verbose errors, no production optimizations. **build** — compile, tree-shake, route static analysis, output `.next`. **start** serves production. Never dev in prod ([34-production-build.md](34-production-build.md)).

**Где в курсе:** [34-production-build.md](34-production-build.md).

---

### 25. `output: 'standalone'` — зачем?

**Ответ.** Traced minimal **`node_modules`** + `server.js` for Docker — small image, fast deploy. Copy also **`.next/static`** and **`public/`** to runner stage ([35-docker-deploy.md](35-docker-deploy.md)).

**Где в курсе:** [34-production-build.md](34-production-build.md), [35-docker-deploy.md](35-docker-deploy.md).

---

### 26. Static export — когда да, когда нет?

**Ответ.** **`output: 'export'`** — pure static hosting (S3, CDN), **no** SSR, Route Handlers, Server Actions, ISR. Shop with live FastAPI catalog — **SSR Docker :8098**, not export ([36-static-export.md](36-static-export.md)). Export OK for marketing/docs with build-time data.

**Где в курсе:** [36-static-export.md](36-static-export.md).

---

### 27. Env vars: `NEXT_PUBLIC_*` vs server?

**Ответ.** **`NEXT_PUBLIC_*`** inlined at **build** into client bundle — never secrets. **`FASTAPI_URL`** server-only — runtime in Docker for Server fetch. Wrong build-time API URL breaks prod client ([28-env-config.md](28-env-config.md)).

**Где в курсе:** [28-env-config.md](28-env-config.md).

---

### 28. Healthcheck в Docker для Next.js?

**Ответ.** Lightweight **`GET /api/health`** Route Handler. Compose **`healthcheck`** wget/curl on **8098**. **`start_period`** for slow cold start. Avoid heavy SSR path as probe ([35-docker-deploy.md](35-docker-deploy.md), [37-lab-docker.md](37-lab-docker.md)).

**Где в курсе:** [35-docker-deploy.md](35-docker-deploy.md), [37-lab-docker.md](37-lab-docker.md).

---

## Блок 7. Auth, errors, senior topics

### 29. Cookies и headers в Server Components?

**Ответ.** **`cookies()`**, **`headers()`** from `next/headers` — dynamic APIs, opt route into dynamic rendering. Read session JWT server-side; set in Route Handler or Server Action response ([26-cookies-headers.md](26-cookies-headers.md)).

**Где в курсе:** [26-cookies-headers.md](26-cookies-headers.md).

---

### 30. Auth patterns в App Router (обзор)?

**Ответ.** Session cookie + middleware redirect; JWT in httpOnly cookie; OAuth callback Route Handler; Server Component checks session before render. No single built-in auth — NextAuth/Auth.js or custom. Never trust client-only guard ([27-auth-patterns.md](27-auth-patterns.md)).

**Где в курсе:** [27-auth-patterns.md](27-auth-patterns.md).

---

### 31. `error.tsx` vs try/catch в Server Component?

**Ответ.** **`error.tsx`** — client boundary for **uncaught** errors in segment, shows fallback + reset. **`notFound()`** — dedicated 404. try/catch in server — expected errors (API 404) graceful UI. Different UX paths ([18-error-not-found.md](18-error-not-found.md)).

**Где в курсе:** [18-error-not-found.md](18-error-not-found.md).

---

### 32. CORS в Next.js fullstack?

**Ответ.** If browser talks **same origin** to Next (Route Handler BFF), **no CORS** for shop API calls. Direct client → `:8090` needs FastAPI CORS — anti-pattern when you have Next server. Prefer server fetch or `/api/proxy` ([20-lab-route-handlers.md](20-lab-route-handlers.md)).

**Где в курсе:** [20-lab-route-handlers.md](20-lab-route-handlers.md).

---

### 33. First Load JS — как уменьшить?

**Ответ.** Push **`"use client"`** down; dynamic import heavy client components; avoid barrel imports of large libs; analyze with **@next/bundle-analyzer**; server-fetch data instead of client Query for read-only catalog ([34-production-build.md](34-production-build.md)).

**Где в курсе:** [34-production-build.md](34-production-build.md).

---

### 34. Server Actions security?

**Ответ.** Treat as **public endpoints**: validate input server-side, auth check, rate limit, CSRF protections (Next built-in for actions from forms). Never expose admin mutations without session. Revalidate paths after mutation.

**Где в курсе:** [21-server-actions.md](21-server-actions.md), [22-lab-server-actions.md](22-lab-server-actions.md).

---

### 35. Как спроектировать Shop Catalog на Next.js + FastAPI?

**Ответ (outline).** App Router: `/catalog` SSR fetch `:8090`, `/items/[id]` dynamic + **`generateMetadata`**, Route Handler BFF `/api/items`, Server Action contact form, client cart island + TanStack Query optional mutations, **`loading/error` UI**, metadata + sitemap, **`output: standalone`**, Docker **:8098** + fastapi **:8090**, env runtime `FASTAPI_URL`. Not static export. Acceptance — [39-capstone.md](39-capstone.md).

**Где в курсе:** весь трек nextjs-basic.

---

## После главы

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) **без подглядывания**.
2. [39-capstone.md](39-capstone.md) — финальный fullstack проект.
3. Дальше: [react-intermediate](../react-intermediate/README.md), [javascript-testing](../javascript-path.md), [nodejs-basic](../javascript-path.md).

---

[← README](README.md) · [interview-cheatsheet](interview-cheatsheet.md) · [39-capstone](39-capstone.md)
