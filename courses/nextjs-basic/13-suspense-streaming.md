# 13. Suspense, streaming HTML и skeleton UI

## Введение: сценарий с работы

Performance review. `/catalog` ждёт **3 секунды** FastAPI `:8090` и отдаёт белый `<main>` — пользователь думает, сайт сломан. После `loading.tsx` появился skeleton sidebar, но **рекомендации** внизу страницы тянут второй API ещё 2s — вся page blocked.

Fix: **granular Suspense** — основной список stream first, блок «Рекомендации» в отдельном `<Suspense fallback={...}>`, HTML **дописывается** по мере готовности chunks. Marketing видит улучшение LCP в отчёте; вы объясняете **streaming**, не «уменьшили timeout».

Next App Router интегрирует Suspense с `loading.tsx`, async RSC и HTTP chunked response. Эта глава — как проектировать skeletons для shop без waterfall UX.

## Что вы узнаете

- **React Suspense** в Next.js App Router.
- **`loading.tsx`** vs inline `<Suspense>`.
- **Streaming HTML** — что видит браузер по времени.
- **Skeleton patterns** для catalog и product detail.
- **Waterfall** и параллель fetch (preview 17).
- `error.tsx` + Suspense interaction (preview).

## Suspense — обещание «подождите здесь»

```tsx
import { Suspense } from "react";

export default function CatalogPage() {
  return (
    <section>
      <h1>Каталог</h1>
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

`ProductList` — async Server Component:

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

Пока `ProductList` pending — показывается **fallback**. Когда resolved — React **заменяет** fallback контентом **без** full page reload.

## loading.tsx = segment Suspense boundary

```tsx
// app/catalog/loading.tsx
export default function Loading() {
  return <CatalogSkeleton />;
}
```

Next **автоматически** оборачивает `page.tsx` этого segment:

```text
app/catalog/loading.tsx  +  app/catalog/page.tsx
         │                           │
         └──── Suspense boundary ────┘
```

Из [06-layouts-templates.md](06-layouts-templates.md): layout рендерится **сразу**, page slot — fallback до готовности page.

## Streaming timeline (упрощённо)

```text
t=0ms    ──► HTTP 200, start chunked body
           RootLayout HTML (header nav)
           CatalogLayout HTML (sidebar)
           loading skeleton for main

t=800ms  ──► chunk: ProductList HTML

t=1200ms ──► chunk: Recommendations HTML

t=done   ──► stream close
```

Browser **progressive render** — пользователь читает header и skeleton, не пустой main.

```text
Traditional SSR (blocked):
  [ wait all data ] ──► full HTML once

Streaming:
  [ shell ] ──► [ part A ] ──► [ part B ]
```

## Skeleton design guidelines

| Принцип | Пример shop |
|---------|-------------|
| Match layout shift | skeleton card ≈ real ProductCard height |
| `aria-busy="true"` | screen readers |
| No fake data prices | серые bars, не «9999 ₽» |
| Shimmer optional | CSS gradient animation |
| Nested skeletons | list rows + image placeholder |

```tsx
function ProductCardSkeleton() {
  return (
    <div className="card" aria-busy="true" aria-label="Загрузка товара">
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

Reuse skeleton в `loading.tsx` и inline Suspense.

## Granular vs single boundary

| Подход | Когда |
|--------|-------|
| `loading.tsx` only | page один async blob — ok |
| Multiple Suspense | independent slow sections |
| `loading.tsx` + inner Suspense | layout fast, sections parallel |

**Waterfall anti-pattern:**

```tsx
async function Page() {
  const a = await fetchA(); // 2s
  const b = await fetchB(); // 2s — starts after A
  return ...;
}
```

**Parallel (preview 17):**

```tsx
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

Or separate Suspense children — **parallel streaming**.

## Suspense и error.tsx

Error in async child **bubbles** to nearest error boundary:

```text
catalog/page.tsx throws
  → catalog/error.tsx (if exists)
  → parent error boundary
  → global error.tsx
```

Suspense fallback **не** показывается после error — показывается error UI. `reset()` in error.tsx — retry render.

## Client Components и Suspense

Client components **can** suspend with lazy `React.lazy` or libraries using Suspense. Server async components — primary Next pattern.

```tsx
"use client";
import { useState } from "react";

// client suspend rare in basic course
```

TanStack Query `useSuspenseQuery` — client Suspense ([24-tanstack-query.md](24-tanstack-query.md)).

## Product detail: two-tier loading

```text
app/catalog/[id]/loading.tsx     → whole page skeleton
app/catalog/[id]/page.tsx
  ├─ ProductHero (fast mock)
  └─ Suspense → ReviewsFromAPI (slow :8090)
```

Hero title from fast cache; reviews stream later.

## DevTools и Network

Network tab: `document` request — **Transfer-Encoding: chunked**. EventStream for RSC in some cases — не копайте глубоко на basic; достаточно видеть progressive paint.

## FastAPI slow endpoints

Если `:8090` list items slow:

1. `loading.tsx` на `/catalog`.
2. Suspense split recommendations.
3. Server `revalidate` + CDN ([16-caching-revalidate.md](16-caching-revalidate.md)).
4. Backend pagination — api-design.

## Связь с лабами

- [07-lab-routing.md](07-lab-routing.md) — добавили `loading.tsx` с artificial delay.
- [11-lab-rsc-boundary.md](11-lab-rsc-boundary.md) — ProductCard; skeleton matches card layout.
- [15-lab-server-fetch.md](15-lab-server-fetch.md) — real fetch triggers loading states.

## Типичные ошибки

**Один giant await в page — блокирует stream.** Split Suspense.

**Skeleton сильно differs from content — CLS.** Match dimensions.

**Забыть fallback для nested Suspense.** Section blank forever on error in sibling only — ok; on hang — need timeout strategy (advanced).

**Думать loading.tsx работает для client-only page.** Sync client page — no suspend; need client loading state.

**Suspense boundary inside client importing async server child.** Compose async server **in server parent**, pass result or use children pattern ([12-composition-patterns.md](12-composition-patterns.md)).

**Искусственный delay в prod.** Только dev demo; remove before merge.

## Резюме

**Suspense** decouples «show shell now» from «data ready later». **`loading.tsx`** — convention для route segment. **Streaming** отправляет HTML chunks — лучший perceived performance для shop catalog на медленном `:8090`. Комбинируйте с parallel fetch и cache в следующих главах.

## Чек-лист

- [ ] Объясняете streaming vs blocked SSR
- [ ] `loading.tsx` vs inline `<Suspense>`
- [ ] Skeleton без layout shift для ProductCard
- [ ] Можете разбить page на два Suspense для list + recommendations
- [ ] Убрали artificial delay из лаб после проверки

Следующий урок: [14. fetch в Server Components](14-server-fetch.md).
