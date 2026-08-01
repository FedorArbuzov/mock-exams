# Next.js Basic — Interview Cheatsheet

Test yourself **without peeking** at the chapters, then check against [38-interview-qa.md](38-interview-qa.md).

---

## Quick answers

### Landscape

| Question | Answer |
|--------|-------|
| Next.js App Router | file-based `app/`, RSC default, SSR/SSG/ISR |
| vs Vite SPA | SSR + less client JS + built-in routing/API |
| RSC | renders on the server, no hooks, async OK |
| Client Component | `"use client"` — hooks, events, browser APIs |
| Pages Router | legacy `pages/`, `getServerSideProps` — not in this course |

### File conventions

| File | Purpose |
|------|------------|
| `page.tsx` | UI route segment |
| `layout.tsx` | shared shell, persist nav |
| `loading.tsx` | Suspense fallback |
| `error.tsx` | error boundary segment |
| `not-found.tsx` | 404 UI |
| `route.ts` | Route Handler (HTTP) |
| `[id]` | dynamic segment |
| `(group)` | org without URL |

### Server vs Client

| Server ✅ | Client only ✅ |
|-----------|----------------|
| async fetch DB/API | `useState`, `useEffect` |
| read filesystem | `onClick`, forms events |
| secrets env | TanStack Query hooks |
| zero client JS | `localStorage`, theme toggle |
| import `.module.css` | framer-motion |

**Rule:** the client boundary **as low as possible** — islands.

### Data fetching

| Pattern | When |
|---------|-------|
| Server Component `fetch` | catalog SSR, SEO reads |
| `{ cache: 'no-store' }` | fresh every request |
| `{ next: { revalidate: 60 } }` | ISR |
| `tags` + `revalidateTag` | on-demand invalidation |
| Route Handler BFF | hide API key, CORS bypass |
| Server Action | form POST mutations |
| TanStack Query | client cart, polling |

**Dedupe:** the same fetch URL in page + `generateMetadata` — one request.

### Route Handlers vs Actions

| | Route Handler | Server Action |
|---|---------------|---------------|
| File | `app/api/.../route.ts` | `"use server"` function |
| Protocol | REST HTTP | form / RPC-like |
| Use case | webhooks, BFF GET | contact form submit |

### Navigation

| API | Purpose |
|-----|------------|
| `Link` | client nav + prefetch |
| `useRouter().push` | programmatic |
| `redirect()` | server redirect |
| `notFound()` | trigger 404 |

Next 15: **`await params`** in page/layout.

### Middleware

| Can | Can't |
|-------|----------|
| redirect/rewrite | full Node APIs |
| set cookies/headers | replace Server auth alone |
| auth gate matcher | heavy DB logic |

### Metadata / SEO

| API | Purpose |
|-----|------------|
| `export const metadata` | static SEO |
| `generateMetadata` | dynamic `/items/[id]` |
| `metadataBase` | absolute OG URLs |
| `openGraph`, `twitter` | social preview |
| `robots.ts`, `sitemap.ts` | crawlers |
| `robots: { index: false }` | cart, admin |

### Assets

| API | Purpose |
|-----|------------|
| `public/` | fixed URL `/favicon.ico` |
| `next/image` | lazy, WebP, sizes, CLS |
| `remotePatterns` | CDN / `:8090` images |
| `next/font` | self-host, no layout shift |

### Styling

| Approach | Scope |
|--------|-------|
| `globals.css` | only from the root layout |
| `*.module.css` | local component |
| Tailwind | utilities + `@import tailwindcss` |

### i18n (overview)

| Pattern | Detail |
|---------|--------|
| `app/[locale]/...` | URL prefix |
| middleware | default locale redirect |
| dictionaries | JSON per locale |
| `alternates.languages` | hreflang |

No built-in `i18n` config like the Pages Router.

### Production

| Command / config | Purpose |
|------------------|------------|
| `next build` | prod compile |
| `next start -p 8098` | prod server |
| `output: 'standalone'` | Docker traced deps |
| `NEXT_PUBLIC_*` | build-time client env |
| `FASTAPI_URL` | runtime server env |
| `@next/bundle-analyzer` | client JS treemap |

**Never** run `next dev` in production.

### Static export vs SSR

| `output: 'export'` | SSR + standalone |
|--------------------|------------------|
| `out/` static HTML | Node `server.js` |
| no Route Handlers | BFF OK |
| no Server Actions | contact form OK |
| no ISR/SSR runtime | live catalog OK |
| S3/CDN hosting | Docker :8098 |

mock-exams shop → **SSR**, not export.

### Docker mock-exams

| Service | Port |
|--------|------|
| Next.js shop | **8098** |
| FastAPI API | **8090** |
| Health | `GET /api/health` |
| Internal URL | `http://fastapi:8090` |

COPY: `standalone` + `.next/static` + `public/`.

---

## Mini-snippets

```tsx
// Server page fetch
export default async function CatalogPage() {
  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/items`, {
    next: { revalidate: 60 },
  });
  const items = await res.json();
  return <ul>{items.map(/* ... */)}</ul>;
}

// Client island
"use client";
export function AddToCartButton({ item }: { item: Item }) {
  const { add } = useCart();
  return <button onClick={() => add(item)}>Add to cart</button>;
}

// generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item?.title ?? "Not found" };
}

// Route Handler BFF
export async function GET() {
  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/items`);
  return Response.json(await res.json());
}

// Server Action
"use server";
export async function submitContact(formData: FormData) {
  // validate + persist
}

// notFound
if (!item) notFound();
```

---

## mock-exams stack

| Layer | Port / tech |
|------|-------------|
| Next.js App Router | **8098** Docker |
| FastAPI shop API | **8090** `/api/v1/items` |
| SSR catalog + metadata | Server Components |
| BFF | `app/api/*` Route Handlers |
| Contact | Server Actions |
| Cart | Client Context / state |
| Deploy | multi-stage Dockerfile standalone |

---

## Common pitfalls

1. Hooks in Server Component — build error
2. Import Server into Client — illegal; use children slot
3. `FASTAPI_URL=localhost` in Docker container — wrong host
4. Forgot `.next/static` in Docker — CSS 404
5. Metadata export from `"use client"` file — use layout.tsx
6. `NEXT_PUBLIC_*` for secrets — leaked to browser
7. Static export + Server Actions — incompatible
8. Entire app `"use client"` — SPA with extra steps
9. No `metadataBase` — broken OG images
10. CORS when could use server fetch / BFF
11. `await params` forgotten in Next 15
12. Healthcheck on SSR catalog — slow/flaky probe
13. Tailwind `content` missing paths — prod empty styles
14. Duplicate page/metadata fetch — no shared `getItem`
15. `next dev` behind nginx as prod

---

## Capstone checklist (brief)

- [ ] SSR `/catalog` + `/items/[id]`
- [ ] `generateMetadata` + sitemap + robots
- [ ] Route Handler `/api/health`
- [ ] Server Action contact
- [ ] Client cart + noindex `/cart`
- [ ] `standalone` Docker :8098 + fastapi :8090
- [ ] README + `npm run build`

Full scope: [39-capstone.md](39-capstone.md).

---

## What to learn next

| Topic | Course |
|------|------|
| Auth, error boundaries deep | react-intermediate |
| Node BFF alternative | nodejs-basic |
| Vitest, Playwright | javascript-testing |
| REST contracts | api-design |
| Containers deep | containers-basic |

---

[← README](README.md) · [38-interview-qa](38-interview-qa.md) · [39-capstone](39-capstone.md)
