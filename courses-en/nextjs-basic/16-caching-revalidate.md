# 16. Next.js cache: `revalidate`, tags, `no-store`

## Intro: a scenario from work

Monday after a release. Manager: "In the FastAPI admin we changed a product description, but the site shows the old text — for two hours already." You look at the code — `fetch` with no options, deployed to Vercel. A colleague says: "Next cached the page forever." Another: "Put `cache: 'no-store'` everywhere." Tech lead: "Then every visit hits the API — load x10."

In the App Router, **server-side `fetch` participates in the Data Cache** — this is not the browser's HTTP cache and not Redis. Next.js remembers a `fetch` result and can serve it to subsequent requests until `revalidate` expires or you invalidate a tag. Understanding this model is the difference between a "fast SEO catalog" and "forever Demo item in prod."

## What you'll learn

- Data Cache vs Full Route Cache vs Router Cache
- `fetch` options: default, `cache: 'force-cache'`, `cache: 'no-store'`
- `next: { revalidate: N }` — ISR-like behavior
- `next: { tags: ['items'] }` and `revalidateTag`
- `export const dynamic = 'force-dynamic'`
- `export const revalidate` at the segment level
- When to choose which for a shop catalog

---

## Three cache layers (simplified)

| Layer | Where | What it caches |
|------|-----|--------------|
| **Request memoization** | one HTTP request | an identical `fetch` in the RSC tree |
| **Data Cache** | Next server | the `fetch` result between requests |
| **Full Route Cache** | Next server | statically generated HTML/RSC (if the route is static) |

**Router Cache** — on the client: prefetched routes in SPA-style navigation. Don't confuse it with the Data Cache.

For a backend developer, an analogy: the Data Cache ≈ an in-memory cache of HTTP-client responses with a TTL; tags ≈ cache invalidation by key.

---

## Default `fetch` behavior

In a Server Component with no options:

```tsx
await fetch(`${base}/api/v1/items`);
```

Next.js **caches** the GET response in the Data Cache (behavior close to `force-cache`). With static generation, the page may be built **at build time** with the data from that moment.

For **always fresh** data (an account area, a server-side cart):

```tsx
await fetch(url, { cache: "no-store" });
```

This marks the fetch as **dynamic** — the route isn't fully statified from the build cache.

---

## Time-based revalidation (ISR)

```tsx
export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    next: { revalidate: 60 }, // seconds
  });
  // ...
}
```

| Moment | Behavior |
|--------|-----------|
| First request | fetch → API, store in the Data Cache |
| Requests &lt; 60 sec | serve from the cache |
| After 60 sec | the next request **may** show stale and refresh **in the background** (stale-while-revalidate) |

Good for a catalog where a minute of delay is acceptable.

---

## Tag-based revalidation

```tsx
// load
await fetch(`${base}/api/v1/items`, {
  next: { tags: ["catalog-items"] },
});

await fetch(`${base}/api/v1/items/${id}`, {
  next: { tags: ["catalog-items", `item-${id}`] },
});
```

Invalidation from a Route Handler or a Server Action:

```tsx
import { revalidateTag } from "next/cache";

revalidateTag("catalog-items");
```

| Approach | When |
|--------|-------|
| `revalidate: 60` | a predictable TTL, no webhook |
| `tags` + `revalidateTag` | after a mutation in the admin, a webhook from FastAPI |
| `no-store` | personal / realtime data |

In [21-server-actions.md](21-server-actions.md) you'll call `revalidatePath('/catalog')` after a form.

---

## `revalidatePath`

```tsx
import { revalidatePath } from "next/cache";

revalidatePath("/catalog");
revalidatePath("/catalog/[id]", "page");
```

Resets the **route's** cache, not just a single fetch. Handy after a "update product" Server Action.

---

## Segment config

At the level of `page.tsx` or `layout.tsx`:

```tsx
// Always dynamic — every request anew
export const dynamic = "force-dynamic";

// Or a TTL for the whole segment
export const revalidate = 300;
```

| Export | Effect |
|---------|--------|
| `dynamic = 'force-dynamic'` | opt out of static, a no-store mindset |
| `dynamic = 'force-static'` | forced static (careful with cookies) |
| `revalidate = N` | default TTL for fetches without their own `next.revalidate` |
| `fetchCache = 'default-no-store'` | all fetches in the segment without store |

**Order:** a more specific `fetch` overrides the segment defaults.

---

## Decision table for the shop

| Data | Recommendation | Example |
|--------|--------------|--------|
| Public catalog | `revalidate: 60–300` or tags | `/catalog` |
| Product card | tag `item-${id}` | `/catalog/[id]` |
| User profile | `no-store` + cookies | `/account` |
| Health / metrics | `no-store` or `revalidate: 10` | internal |
| Cart (client) | not a server fetch | Context, chapter 25 |

---

## Example: evolution of the loader from lab 15

```tsx
// lib/api/items.ts
type FetchItemsOptions = {
  fresh?: boolean;
};

export async function getItems(options?: FetchItemsOptions): Promise<Item[]> {
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } =
    {
      headers: { Accept: "application/json" },
    };

  if (options?.fresh) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: 120, tags: ["catalog-items"] };
  }

  const res = await fetch(`${baseUrl()}/api/v1/items`, init);
  // ...
}
```

A CMS preview mode often passes `?fresh=1` → `fresh: true`.

---

## Static vs Dynamic routes

Next marks a route **static** or **dynamic** by signals:

- `cookies()`, `headers()`, `searchParams` (dynamic usage)
- `cache: 'no-store'`
- `export const dynamic = 'force-dynamic'`

Check after `next build`:

```bash
cd courses/nextjs-basic/examples
npm run build
```

The output shows a route table: ○ static, ƒ dynamic. If `/catalog` is static but the data should update — add `revalidate` or tags.

---

## Difference from a CDN and the browser

| | Next Data Cache | CDN Cache-Control |
|---|-----------------|-------------------|
| Where | the Next.js process | edge CDN |
| Invalidation | `revalidateTag`, `revalidatePath` | CDN purge API |
| Visibility | server-only | HTTP headers |

The `fetch` cache does **not** automatically set `Cache-Control` for the browser on the API response — that's a separate Route Handler or FastAPI setting.

---

## Connection to FastAPI

FastAPI `:8090` **doesn't know** about the Next cache. If Next cached `{ items: [...] }`, FastAPI isn't called again until revalidation. For an "instant" update after an admin edit:

1. A webhook POST → Route Handler → `revalidateTag('catalog-items')`, or
2. A Server Action after an admin form (if the admin is in Next), or
3. A short `revalidate: 30` as a compromise.

---

## Common pitfalls

1. **`no-store` everywhere "just in case"** — extra load on FastAPI, slower TTFB.

2. **Expecting an instant update with `revalidate: 3600`** — users see stale for an hour.

3. **Forgetting the tag on the detail page** — the list updated, `/catalog/1` didn't.

4. **Confusing Router Cache with Data Cache** — "updated the API, but client navigation shows the old thing" → hard refresh or `router.refresh()`.

5. **POST/PUT via fetch with cache** — mutating methods aren't cached like GET; but you need `revalidatePath` afterward.

6. **A static build with a live API on CI** — a build-time fetch failed → build failed; mock it or use `dynamic`.

7. **Two fetches with different options for one URL** — unpredictable memo/cache behavior; unify the loader.

8. **Not checking the `next build` route table** — a prod surprise: "the page is static with yesterday's prices."

---

## Checklist

- How does the Data Cache differ from the browser cache?
- What does `cache: 'no-store'` do to a route's static/dynamic status?
- When is `revalidate: 60` better than `no-store`?
- How do you invalidate all products with a single command?
- Why `revalidatePath` if there's `revalidateTag`?
- How do you see static vs dynamic after a build?
- Why did the catalog "freeze" after deploy without revalidate?

Next lesson: [17. Parallel requests and `Promise.all`](17-parallel-fetch.md).
