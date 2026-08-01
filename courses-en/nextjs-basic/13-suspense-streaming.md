# 13. Suspense, streaming HTML, and skeleton UI

## Introduction: a scenario from work

Performance review. `/catalog` waits **3 seconds** on FastAPI `:8090` and serves a blank `<main>` — the user thinks the site is broken. After adding `loading.tsx`, a skeleton sidebar appeared, but the **recommendations** block at the bottom pulls a second API for another 2s — blocking the whole page.

Fix: **granular Suspense** — the main list streams first, the "Recommendations" block gets its own `<Suspense fallback={...}>`, and the HTML **fills in** as chunks become ready. Marketing sees an LCP improvement in the report; you get to explain **streaming**, not "we lowered the timeout."

Next's App Router integrates Suspense with `loading.tsx`, async RSCs, and chunked HTTP responses. This chapter covers how to design skeletons for a shop without a waterfall UX.

## What you'll learn

- **React Suspense** in the Next.js App Router.
- **`loading.tsx`** vs inline `<Suspense>`.
- **Streaming HTML** — what the browser sees over time.
- **Skeleton patterns** for catalog and product detail pages.
- **Waterfalls** and parallel fetching (preview of 17).
- `error.tsx` + Suspense interaction (preview).

## Suspense — a promise of "wait here"

```tsx
import { Suspense } from "react";

export default function CatalogPage() {
  return (
    <section>
      <h1>Catalog</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <ProductList />
      </Suspense>
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </section>
  );
}
```

`ProductList` is an async Server Component:

```tsx
async function ProductList() {
  const items = await fetch("http://localhost:8090/api/v1/items").then(r => r.json());
  return (
    <ul>
      {items.map((i: { id: string; title: string }) => (
        <li key={i.id}>{i.title}</li>
      ))}
    </ul>
  );
}
```

While `ProductList` is pending, the **fallback** shows. Once it resolves, React **swaps** the fallback for the content **without** a full page reload.

## loading.tsx = segment Suspense boundary

```tsx
// app/catalog/loading.tsx
export default function Loading() {
  return <CatalogSkeleton />;
}
```

Next **automatically** wraps this segment's `page.tsx`:

```text
app/catalog/loading.tsx  +  app/catalog/page.tsx
         │                           │
         └──── Suspense boundary ────┘
```

From [06-layouts-templates.md](06-layouts-templates.md): the layout renders **immediately**, while the page slot shows the fallback until the page is ready.

## Streaming timeline (simplified)

```text
t=0ms    ──► HTTP 200, start chunked body
           RootLayout HTML (header nav)
           CatalogLayout HTML (sidebar)
           loading skeleton for main

t=800ms  ──► chunk: ProductList HTML

t=1200ms ──► chunk: Recommendations HTML

t=done   ──► stream close
```

The browser **progressively renders** — the user reads the header and skeleton instead of staring at an empty main.

```text
Traditional SSR (blocked):
  [ wait all data ] ──► full HTML once

Streaming:
  [ shell ] ──► [ part A ] ──► [ part B ]
```

## Skeleton design guidelines

| Principle | Shop example |
|---------|-------------|
| Match layout shift | skeleton card ≈ real ProductCard height |
| `aria-busy="true"` | for screen readers |
| No fake data prices | gray bars, not "$9999" |
| Shimmer optional | CSS gradient animation |
| Nested skeletons | list rows + image placeholder |

```tsx
function ProductCardSkeleton() {
  return (
    <div className="card" aria-busy="true" aria-label="Loading product">
      <div style={{ height: 20, width: "70%", background: "#eee" }} />
      <div style={{ height: 16, width: "40%", background: "#eee", marginTop: 8 }} />
      <div style={{ height: 36, width: 120, background: "#eee", marginTop: 16 }} />
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

Reuse the skeleton in both `loading.tsx` and inline Suspense.

## Granular vs single boundary

| Approach | When |
|--------|-------|
| `loading.tsx` only | page is one async blob — fine |
| Multiple Suspense | independent slow sections |
| `loading.tsx` + inner Suspense | layout is fast, sections load in parallel |

**Waterfall anti-pattern:**

```tsx
async function Page() {
  const a = await fetchA(); // 2s
  const b = await fetchB(); // 2s — starts after A
  return ...;
}
```

**Parallel (preview of 17):**

```tsx
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

Or separate Suspense children — **parallel streaming**.

## Suspense and error.tsx

An error in an async child **bubbles** to the nearest error boundary:

```text
catalog/page.tsx throws
  → catalog/error.tsx (if it exists)
  → parent error boundary
  → global error.tsx
```

The Suspense fallback is **not** shown after an error — the error UI shows instead. `reset()` in error.tsx retries the render.

## Client Components and Suspense

Client components **can** suspend with lazy `React.lazy` or libraries that use Suspense. Async server components are the primary Next.js pattern.

```tsx
"use client";
import { useState } from "react";

// client suspend is rare in this basic course
```

TanStack Query's `useSuspenseQuery` is client-side Suspense ([24-tanstack-query.md](24-tanstack-query.md)).

## Product detail: two-tier loading

```text
app/catalog/[id]/loading.tsx     → whole page skeleton
app/catalog/[id]/page.tsx
  ├─ ProductHero (fast mock)
  └─ Suspense → ReviewsFromAPI (slow :8090)
```

Hero title comes from fast cache; reviews stream in later.

## DevTools and Network

Network tab: the `document` request uses **Transfer-Encoding: chunked**. In some cases you'll see an EventStream for RSC — no need to dig deep at the basic level; it's enough to see the progressive paint.

## Slow FastAPI endpoints

If the `:8090` items list is slow:

1. `loading.tsx` on `/catalog`.
2. Split recommendations into their own Suspense.
3. Server `revalidate` + CDN ([16-caching-revalidate.md](16-caching-revalidate.md)).
4. Backend pagination — api-design.

## Connection to the labs

- [07-lab-routing.md](07-lab-routing.md) — added `loading.tsx` with an artificial delay.
- [11-lab-rsc-boundary.md](11-lab-rsc-boundary.md) — ProductCard; skeleton matches the card layout.
- [15-lab-server-fetch.md](15-lab-server-fetch.md) — real fetches trigger loading states.

## Common mistakes

**One giant await in the page — blocks the stream.** Split into Suspense boundaries.

**Skeleton differs significantly from the content — CLS.** Match the dimensions.

**Forgetting a fallback for nested Suspense.** A section stays blank forever on an error in a sibling only — that's fine; hanging needs a timeout strategy (advanced).

**Assuming loading.tsx works for a client-only page.** A sync client page doesn't suspend; you need a client-side loading state instead.

**A Suspense boundary inside a client component importing an async server child.** Compose the async server component **in the server parent**, pass the result down, or use the children pattern ([12-composition-patterns.md](12-composition-patterns.md)).

**Artificial delay in prod.** Only for dev demos; remove it before merging.

## Summary

**Suspense** decouples "show the shell now" from "data ready later." **`loading.tsx`** is the convention for a route segment. **Streaming** sends HTML in chunks — the best way to improve perceived performance for a shop catalog on a slow `:8090`. Combine it with parallel fetching and caching in the next chapters.

## Checklist

- [ ] You can explain streaming vs blocked SSR
- [ ] `loading.tsx` vs inline `<Suspense>`
- [ ] Skeleton without layout shift for ProductCard
- [ ] You can split a page into two Suspense boundaries for list + recommendations
- [ ] Removed the artificial delay from the lab after testing

Next lesson: [14. fetch in Server Components](14-server-fetch.md).
