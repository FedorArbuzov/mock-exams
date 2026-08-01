# 17. Parallel requests, `Promise.all`, waterfall

## Intro: a scenario from work

The product page `/catalog/[id]` is slow: 1.2 seconds TTFB. Lighthouse: "Avoid chaining critical requests." You open the code — sequential `await`s:

```tsx
const item = await getItem(id);
const related = await getRelated(id);
const reviews = await getReviews(id);
```

Three independent GETs to FastAPI `:8090`, but they wait on each other: 400 + 400 + 400 ms. Plus the layout also calls `getItems()` — without dedupe you get a **duplicate** request. Tech lead: "Parallelize the independent ones, dedupe via `React.cache()` or a single loader."

Waterfall is the main enemy of server-side data fetching. This chapter teaches how to **parallelize** with `Promise.all`, **avoid unnecessary awaits**, and **deduplicate** requests within one render pass.

## What you'll learn

- Waterfall vs parallel fetch on the server
- `Promise.all`, `Promise.allSettled` for RSC
- Independent vs dependent requests
- Request memoization of the built-in `fetch`
- `React.cache()` for deduplicating functions
- Composition with Suspense (parallel boundaries)
- Anti-patterns in layout + page

---

## Waterfall: the problem

```tsx
export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await getItem(Number(id));       // 400 ms
  const related = await getRelated(item.id);    // +350 ms — depends on item ✓
  const promo = await getPromoBanner();         // +200 ms — does NOT depend ✗
  // ~950 ms sequential total, though promo could have run parallel to item
}
```

A **dependent** request (related needs `item.id`) — after `item`.  
An **independent** one (`getPromoBanner`) — parallel to `getItem`.

---

## `Promise.all` for independent requests

```tsx
export default async function DashboardPage() {
  const [items, promo, stats] = await Promise.all([
    getItems(),
    getPromoBanner(),
    getShopStats(),
  ]);

  return (
    <section>
      <Promo data={promo} />
      <Stats data={stats} />
      <ItemGrid items={items} />
    </section>
  );
}
```

Time ≈ **max**(t1, t2, t3), not the sum.

### Errors

`Promise.all` rejects on the **first** error — the whole page errors. If some data is optional:

```tsx
const [itemsResult, promoResult] = await Promise.allSettled([
  getItems(),
  getPromoBanner(),
]);

const items = itemsResult.status === "fulfilled" ? itemsResult.value : [];
const promo = promoResult.status === "fulfilled" ? promoResult.value : null;
```

---

## Mixed pattern: parallel + sequential

```tsx
export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);

  const [item, promo] = await Promise.all([
    getItem(itemId),
    getPromoBanner(),
  ]);

  if (!item) notFound();

  const related = await getRelated(item.categoryId);

  return (/* JSX */);
}
```

`getRelated` stays after `item` — this is a correct waterfall **where there's a dependency**.

---

## Built-in `fetch` dedupe

Next.js **memoizes** identical `fetch`es within **a single server request** (one render pass):

```tsx
// layout.tsx
const items = await getItems();

// page.tsx (the same request)
const itemsAgain = await getItems(); // same URL + options → one HTTP
```

Memoization conditions:

- the same URL;
- the same `fetch` options (including `next.revalidate`, tags);
- GET.

**Not deduped:** different `cache`/`revalidate`, POST, different query strings.

---

## `React.cache()` — dedupe arbitrary functions

`fetch` memoization doesn't extend to a DB client, gRPC, or a wrapper with logic. **`React.cache()`** caches a function's result **for one request**:

```tsx
import { cache } from "react";

export const getItems = cache(async (): Promise<Item[]> => {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    next: { revalidate: 60, tags: ["catalog-items"] },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as ItemsResponse;
  return data.items;
});

export const getItem = cache(async (id: number): Promise<Item | null> => {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`, {
    next: { tags: [`item-${id}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as Item;
});
```

| | `fetch` memo | `React.cache()` |
|---|--------------|-----------------|
| Scope | `fetch` only | any async function |
| Key | URL + options | function arguments (by reference for objects) |
| Between requests | Data Cache (separate) | no — one render only |

**Important:** `cache()` isn't a global Redis; it only dedupes within a single request.

---

## Parallel Server Components + Suspense

An alternative to "one big Promise.all" — **split the UI** and stream:

```tsx
// app/catalog/[id]/page.tsx
import { Suspense } from "react";
import { ItemDetails } from "./ItemDetails";
import { RelatedItems } from "./RelatedItems";
import { Reviews } from "./Reviews";

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  return (
    <article>
      <Suspense fallback={<p>Loading the product…</p>}>
        <ItemDetails id={id} />
      </Suspense>
      <Suspense fallback={<p>Recommendations…</p>}>
        <RelatedItems id={id} />
      </Suspense>
      <Suspense fallback={<p>Reviews…</p>}>
        <Reviews id={id} />
      </Suspense>
    </article>
  );
}
```

```tsx
// ItemDetails.tsx — async Server Component
export async function ItemDetails({ id }: { id: string }) {
  const item = await getItem(Number(id));
  if (!item) notFound();
  return <h1>{item.title}</h1>;
}
```

The three async components **start in parallel**; the HTML streams as it becomes ready ([13-suspense-streaming.md](13-suspense-streaming.md)). Better UX than waiting for the slowest in a single `await`.

---

## Layout + Page: an anti-pattern

```tsx
// app/catalog/layout.tsx — BAD: a heavy fetch in the layout
export default async function CatalogLayout({ children }) {
  const items = await getItems(); // blocks ALL nested pages
  return (
    <div>
      <Sidebar items={items} />
      {children}
    </div>
  );
}
```

A layout fetch **blocks** children. If the sidebar is needed everywhere — fine; if `/catalog/[id]` doesn't need the full list — move the sidebar into a separate Suspense boundary or a client fetch.

---

## Pattern table

| Scenario | Pattern |
|----------|---------|
| 3 independent APIs | `Promise.all` |
| 1 required, 2 optional | `Promise.allSettled` |
| Dependency A → B | sequential await |
| Duplicate getItems in layout+page | `React.cache()` or a single fetch |
| A slow block shouldn't block the whole screen | Suspense + async child |
| Client-side polling | not RSC — TanStack Query (24) |

---

## Measuring

Dev:

```tsx
console.time("item-page");
const [item, promo] = await Promise.all([getItem(id), getPromo()]);
console.timeEnd("item-page");
```

Production: log the duration in the loader, OpenTelemetry, or an APM on Node. Compare sequential vs parallel on staging.

---

## Common mistakes

1. **await in a loop** — `for (const id of ids) await getItem(id)` → N×latency; use `Promise.all(ids.map(getItem))`.

2. **Promise.all with dependent data** — `getRelated` before `getItem` → runtime error or an extra request.

3. **Thinking `cache()` replaces the Data Cache** — dedupe doesn't work between users; you need `revalidate` (chapter 16).

4. **Different fetch options "for speed"** — breaks memo, a double HTTP.

5. **A huge Promise.all** — one failure takes down the whole page; split critical vs optional.

6. **Suspense without a fallback** — poor UX during streaming.

7. **Parallelizing writes** — POST in parallel without idempotency is dangerous; the mutations chapter — Server Actions.

8. **Ignoring the FastAPI limit** — 20 parallel fetches can exhaust the pool; a batch endpoint on the backend is sometimes better.

---

## Checklist

- How does waterfall differ from parallel in terms of response time?
- When `Promise.all`, when `allSettled`?
- Are two identical `fetch`es in layout and page deduped?
- Why `React.cache()` if there's `fetch` memo?
- How does Suspense affect load parallelism?
- Why is `await` in a `for` an anti-pattern for HTTP?
- Where's the boundary: server parallel vs client Query?

Next lesson: [18. Error boundaries: `error.tsx`, `notFound()`](18-error-not-found.md).
