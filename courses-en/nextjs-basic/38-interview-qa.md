# 38. Interview Q&A: top 35 questions on the Next.js App Router

## Intro: why this chapter

In a fullstack/frontend interview, Next.js tests the **App Router mental model**: Server vs Client Components, where fetch runs, caching, Route Handlers vs Server Actions, metadata, production deploy. This chapter provides **detailed answers** to [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through it:**

1. Read the question, **cover** the answer, and answer out loud for 1–2 minutes.
2. Compare with the breakdown: the **why** matters, not just the **what**.
3. If you fail — go back to the lesson from "Where in the course."

---

## Block 1. Landscape and the App Router

### 1. How does the Next.js App Router differ from Vite + React SPA?

**Answer.** A Vite SPA is a **client-only** bundle: the browser downloads JS, data comes via `fetch` to an API, and SEO and first paint are weaker without SSR. The **App Router** is file-based routing in `app/`, with **React Server Components** by default: HTML with data from the server, less client JS, built-in layouts, streaming, Route Handlers and Server Actions on the same Node runtime. Next adds a **build pipeline**, caching semantics for `fetch`, a metadata API, and image/font optimization.

**Where in the course:** [01-landscape.md](01-landscape.md), [02-app-router.md](02-app-router.md).

---

### 2. What is the `app/` directory and its file conventions?

**Answer.** `app/` is the root of routes. **`page.tsx`** — a UI segment, **`layout.tsx`** — a shared shell (persists across navigation), **`loading.tsx`**, **`error.tsx`**, **`not-found.tsx`**, **`route.ts`** — HTTP handlers. Folders = URL segments; `[id]` — dynamic; `(group)` — route groups without a URL. The **root `layout.tsx`** is required with `<html>` and `<body>`.

**Where in the course:** [02-app-router.md](02-app-router.md), [04-routing.md](04-routing.md).

---

### 3. SSR vs SSG vs ISR in Next.js 15?

**Answer.** **SSG** — HTML at build (`force-cache`). **SSR** — render on each request (`no-store` or dynamic). **ISR** — static + a **`revalidate`** interval/tags — updates without a full rebuild. The App Router chooses the mode via **cache options** on `fetch` and static analysis of the route. Static **`output: 'export'`** — build-time HTML only, no Node ([36-static-export.md](36-static-export.md)).

**Where in the course:** [01-landscape.md](01-landscape.md), [16-caching-revalidate.md](16-caching-revalidate.md).

---

### 4. Pages Router vs App Router — should you migrate?

**Answer.** The **Pages Router** (`pages/`, `getServerSideProps`, `getStaticProps`) is legacy but supported. The **App Router** is recommended for greenfield: RSC, nested layouts, Server Actions. Coexistence is possible in one project. New features (metadata API, the `use` hook on the server) are App-first. The mock-exams course is App Router only.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 5. What are React Server Components (RSC)?

**Answer.** Components that run **on the server** and don't end up in the client bundle (except for serialized output). They can async/await, read the DB, the filesystem. They **can't** use `useState`, `useEffect`, browser APIs. The default in `app/` is a Server Component. Client — the **`"use client"`** directive at the module boundary.

**Where in the course:** [09-server-components.md](09-server-components.md), [10-client-components.md](10-client-components.md).

---

## Block 2. The Server vs Client boundary

### 6. When do you need `"use client"`?

**Answer.** When a component needs **hooks**, event handlers (`onClick`), browser APIs (`localStorage`, `window`), or stateful libs (TanStack Query client, framer-motion). Strategy: the **smallest** client subtree — "islands" ([25-lab-client-state.md](25-lab-client-state.md)). A server page imports a client button — the boundary is on the client file.

**Where in the course:** [10-client-components.md](10-client-components.md).

---

### 7. Can you import a Server Component into a Client one?

**Answer.** **No** directly — the client bundle can't import server-only code. **Yes** via **composition**: a Server parent passes `<ServerChild />` as **`children`** or a prop to a Client wrapper. The server renders the client + slots.

**Where in the course:** [12-composition-patterns.md](12-composition-patterns.md).

---

### 8. Can you fetch in a Server Component?

**Answer.** **Yes** — the preferred pattern. An async Server Component:

```tsx
export default async function Page() {
  const data = await fetch(url);
  return <List items={await data.json()} />;
}
```

Next **dedupes** and **caches** fetch by default. Client fetch — for interactivity, polling, and user-specific data after hydration.

**Where in the course:** [14-server-fetch.md](14-server-fetch.md).

---

### 9. Why can't you use hooks in a Server Component?

**Answer.** Hooks require the **client React runtime** and persistent state between user interactions. A Server Component renders **once** per request/stream — there's no lifecycle like the client's. `useState` on the server is an architectural mismatch → compile error.

**Where in the course:** [09-server-components.md](09-server-components.md).

---

### 10. Suspense and streaming — why?

**Answer.** **Suspense** boundaries allow a **partial HTML stream**: the shell layout right away, the slow catalog later. UX: a skeleton from `loading.tsx`. The server sends chunks — TTFB is better than waiting for all data. RSC + Suspense — the core App Router pattern.

**Where in the course:** [13-suspense-streaming.md](13-suspense-streaming.md).

---

## Block 3. Routing and navigation

### 11. Dynamic routes `[id]` — how do you get params?

**Answer.** In **Next 15** `params` is often a **`Promise`**:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

`generateStaticParams` for SSG paths. `notFound()` for 404 ([18-error-not-found.md](18-error-not-found.md)).

**Where in the course:** [05-dynamic-routes.md](05-dynamic-routes.md).

---

### 12. `Link` vs `useRouter` vs `<a>`?

**Answer.** **`Link`** — client navigation without a full reload, prefetch of visible routes. **`useRouter().push`** — programmatic (after a mutation). **`<a>`** — external URLs or full navigation. App Router: `next/link`, `next/navigation` (not the `next/router` Pages API).

**Where in the course:** [08-navigation.md](08-navigation.md).

---

### 13. Layout vs template?

**Answer.** A **Layout** **persists** state across navigation between sibling pages (header, cart provider server shell). A **Template** **remounts** on navigate (animation key). Most shop UI — layouts; templates are rarer.

**Where in the course:** [06-layouts-templates.md](06-layouts-templates.md).

---

### 14. `loading.tsx` vs Suspense?

**Answer.** **`loading.tsx`** — a file convention, auto-wraps the page in a Suspense boundary. A manual `<Suspense fallback={...}>` — finer control inside the page. Both — streaming UX.

**Where in the course:** [06-layouts-templates.md](06-layouts-templates.md), [13-suspense-streaming.md](13-suspense-streaming.md).

---

## Block 4. Data, cache, BFF

### 15. How does `fetch` caching work in Next.js?

**Answer.** Default **`force-cache`** (static) in Server Components. Opt-out: `{ cache: 'no-store' }` — dynamic SSR. **`next: { revalidate: 60 }`** — ISR. **`tags` + `revalidateTag`** — on-demand invalidation ([16-caching-revalidate.md](16-caching-revalidate.md)). Don't confuse it with the TanStack Query client cache.

**Where in the course:** [16-caching-revalidate.md](16-caching-revalidate.md).

---

### 16. Route Handlers vs Server Actions vs a direct fetch to the API?

**Answer.** **Server Component fetch** — reading data for SSR, the simplest. **Route Handlers** (`app/api/.../route.ts`) — REST endpoints, webhooks, a BFF proxy to `:8090`, hiding secrets ([19-route-handlers.md](19-route-handlers.md)). **Server Actions** — mutations from forms (`"use server"`), without a separate API route ([21-server-actions.md](21-server-actions.md)). Client browser → Route Handler → FastAPI avoids CORS and exposing tokens.

**Where in the course:** [19-route-handlers.md](19-route-handlers.md), [20-lab-route-handlers.md](20-lab-route-handlers.md), [21-server-actions.md](21-server-actions.md).

---

### 17. Waterfall fetch — how do you avoid it?

**Answer.** Sequential awaits in one component — a waterfall. Fix: **`Promise.all`** parallel requests ([17-parallel-fetch.md](17-parallel-fetch.md)), split Suspense boundaries (fast shell + slow section), or colocate data needs in a single server function. Measure with dev logging timing.

**Where in the course:** [17-parallel-fetch.md](17-parallel-fetch.md).

---

### 18. Middleware — what can and can't it do?

**Answer.** **`middleware.ts`** on the Edge: redirect, rewrite, set headers/cookies, an auth gate **before** the route. Matcher config limits paths. **Not** a full Node (limited APIs). It doesn't replace Server Component auth on its own — defense in depth ([23-middleware.md](23-middleware.md)).

**Where in the course:** [23-middleware.md](23-middleware.md).

---

### 19. TanStack Query in Next.js — where?

**Answer.** **Client islands** only — Query needs hooks. Pattern: SSR initial data via Server Component props or prefetch + dehydrate (advanced); mock-exams basic — server list SSR + client cart/mutations with Query ([24-tanstack-query.md](24-tanstack-query.md)). Don't duplicate the server list cache and Query without a strategy.

**Where in the course:** [24-tanstack-query.md](24-tanstack-query.md), [25-lab-client-state.md](25-lab-client-state.md).

---

## Block 5. Metadata, assets, i18n

### 20. Metadata API vs `next/head`?

**Answer.** App Router: **`export const metadata`** or **`generateMetadata`** in server files. A type-safe `Metadata` object — title, description, openGraph, robots. **`next/head`** — Pages Router. Nested layouts merge metadata; **`metadataBase`** for absolute OG URLs ([31-metadata-seo.md](31-metadata-seo.md)).

**Where in the course:** [31-metadata-seo.md](31-metadata-seo.md).

---

### 21. `generateMetadata` and duplicate fetch?

**Answer.** The same `fetch` URL in page + metadata — Next **dedupes** per request. Best practice: a shared **`getItem(id)`** function. Async metadata for `/items/[id]` from FastAPI `:8090`.

**Where in the course:** [31-metadata-seo.md](31-metadata-seo.md), [32-lab-metadata.md](32-lab-metadata.md).

---

### 22. `next/image` — why not `<img>`?

**Answer.** Lazy load, responsive sizes, modern formats (WebP/AVIF), CLS prevention via width/height, optional blur placeholder. Remote domains need **`images.remotePatterns`**. Static export requires **`unoptimized: true`** ([30-images-fonts.md](30-images-fonts.md)).

**Where in the course:** [30-images-fonts.md](30-images-fonts.md).

---

### 23. i18n in the App Router without a built-in config?

**Answer.** An **`app/[locale]/...`** segment + middleware for the default locale + JSON dictionaries. **`next-intl`** for client translations. hreflang via **`metadata.alternates.languages`**. Unlike Pages `i18n` in config ([33-i18n-overview.md](33-i18n-overview.md)).

**Where in the course:** [33-i18n-overview.md](33-i18n-overview.md).

---

## Block 6. Production, Docker, export

### 24. `next build` vs `next dev`?

**Answer.** **dev** — HMR, slow, verbose errors, no production optimizations. **build** — compile, tree-shake, route static analysis, output `.next`. **start** serves production. Never dev in prod ([34-production-build.md](34-production-build.md)).

**Where in the course:** [34-production-build.md](34-production-build.md).

---

### 25. `output: 'standalone'` — why?

**Answer.** Traced minimal **`node_modules`** + `server.js` for Docker — a small image, a fast deploy. Also copy **`.next/static`** and **`public/`** to the runner stage ([35-docker-deploy.md](35-docker-deploy.md)).

**Where in the course:** [34-production-build.md](34-production-build.md), [35-docker-deploy.md](35-docker-deploy.md).

---

### 26. Static export — when yes, when no?

**Answer.** **`output: 'export'`** — pure static hosting (S3, CDN), **no** SSR, Route Handlers, Server Actions, ISR. A shop with a live FastAPI catalog — **SSR Docker :8098**, not export ([36-static-export.md](36-static-export.md)). Export is OK for marketing/docs with build-time data.

**Where in the course:** [36-static-export.md](36-static-export.md).

---

### 27. Env vars: `NEXT_PUBLIC_*` vs server?

**Answer.** **`NEXT_PUBLIC_*`** inlined at **build** into the client bundle — never secrets. **`FASTAPI_URL`** server-only — runtime in Docker for Server fetch. A wrong build-time API URL breaks the prod client ([28-env-config.md](28-env-config.md)).

**Where in the course:** [28-env-config.md](28-env-config.md).

---

### 28. Healthcheck in Docker for Next.js?

**Answer.** A lightweight **`GET /api/health`** Route Handler. Compose **`healthcheck`** wget/curl on **8098**. **`start_period`** for a slow cold start. Avoid a heavy SSR path as the probe ([35-docker-deploy.md](35-docker-deploy.md), [37-lab-docker.md](37-lab-docker.md)).

**Where in the course:** [35-docker-deploy.md](35-docker-deploy.md), [37-lab-docker.md](37-lab-docker.md).

---

## Block 7. Auth, errors, senior topics

### 29. Cookies and headers in Server Components?

**Answer.** **`cookies()`**, **`headers()`** from `next/headers` — dynamic APIs, opt the route into dynamic rendering. Read the session JWT server-side; set it in a Route Handler or Server Action response ([26-cookies-headers.md](26-cookies-headers.md)).

**Where in the course:** [26-cookies-headers.md](26-cookies-headers.md).

---

### 30. Auth patterns in the App Router (overview)?

**Answer.** Session cookie + middleware redirect; JWT in an httpOnly cookie; OAuth callback Route Handler; a Server Component checks the session before render. No single built-in auth — NextAuth/Auth.js or custom. Never trust a client-only guard ([27-auth-patterns.md](27-auth-patterns.md)).

**Where in the course:** [27-auth-patterns.md](27-auth-patterns.md).

---

### 31. `error.tsx` vs try/catch in a Server Component?

**Answer.** **`error.tsx`** — a client boundary for **uncaught** errors in a segment, shows a fallback + reset. **`notFound()`** — a dedicated 404. try/catch on the server — expected errors (API 404), graceful UI. Different UX paths ([18-error-not-found.md](18-error-not-found.md)).

**Where in the course:** [18-error-not-found.md](18-error-not-found.md).

---

### 32. CORS in a Next.js fullstack app?

**Answer.** If the browser talks **same origin** to Next (a Route Handler BFF), there's **no CORS** for shop API calls. A direct client → `:8090` needs FastAPI CORS — an anti-pattern when you have a Next server. Prefer server fetch or `/api/proxy` ([20-lab-route-handlers.md](20-lab-route-handlers.md)).

**Where in the course:** [20-lab-route-handlers.md](20-lab-route-handlers.md).

---

### 33. First Load JS — how do you reduce it?

**Answer.** Push **`"use client"`** down; dynamic import heavy client components; avoid barrel imports of large libs; analyze with **@next/bundle-analyzer**; server-fetch data instead of client Query for a read-only catalog ([34-production-build.md](34-production-build.md)).

**Where in the course:** [34-production-build.md](34-production-build.md).

---

### 34. Server Actions security?

**Answer.** Treat them as **public endpoints**: validate input server-side, auth check, rate limit, CSRF protections (Next built-in for actions from forms). Never expose admin mutations without a session. Revalidate paths after a mutation.

**Where in the course:** [21-server-actions.md](21-server-actions.md), [22-lab-server-actions.md](22-lab-server-actions.md).

---

### 35. How do you design a Shop Catalog on Next.js + FastAPI?

**Answer (outline).** App Router: `/catalog` SSR fetch `:8090`, `/items/[id]` dynamic + **`generateMetadata`**, Route Handler BFF `/api/items`, Server Action contact form, client cart island + TanStack Query optional mutations, **`loading/error` UI**, metadata + sitemap, **`output: standalone`**, Docker **:8098** + fastapi **:8090**, env runtime `FASTAPI_URL`. Not static export. Acceptance — [39-capstone.md](39-capstone.md).

**Where in the course:** the entire nextjs-basic track.

---

## After the chapter

1. Go through [interview-cheatsheet.md](interview-cheatsheet.md) **without peeking**.
2. [39-capstone.md](39-capstone.md) — the final fullstack project.
3. Next: [react-intermediate](../react-intermediate/README.md), [javascript-testing](../javascript-path.md), [nodejs-basic](../javascript-path.md).

---

[← README](README.md) · [interview-cheatsheet](interview-cheatsheet.md) · [39-capstone](39-capstone.md)
