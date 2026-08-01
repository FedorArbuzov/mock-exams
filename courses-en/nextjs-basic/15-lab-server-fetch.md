# 15. Lab: product list with FastAPI :8090

## Scenario

Ticket **NEXT-215**: "Connect the catalog to FastAPI, SSR list on `/catalog`." The backend on `:8090` serves JSON — your job in Next.js: a server `fetch` from [14-server-fetch.md](14-server-fetch.md), types, loading/error UI via Suspense or explicit handling. Without `"use client"` on the whole page.

**Time:** ~50–65 minutes.  
**Instance:** [deploy/fastapi](../../deploy/fastapi/README.md) is required.  
**Code:** [`examples/`](examples/package.json).

---

## Setup

Terminal 1 — the API:

```bash
cd deploy/fastapi
docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Terminal 2 — Next.js:

```bash
cd courses/nextjs-basic/examples
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The nav already has a "Catalog" link — the page is empty for now.

Target structure:

```text
examples/
  .env.local
  lib/
    api/
      types.ts
      items.ts
  app/
    catalog/
      page.tsx
      loading.tsx      # optional
    catalog/[id]/
      page.tsx         # bonus, if you have time
  components/
    catalog/
      ItemCard.tsx     # Server Component
```

---

## Task 1. Types `lib/api/types.ts`

```tsx
export type Item = {
  id: number;
  title: string;
  description?: string;
};

export type ItemsResponse = {
  items: Item[];
  total: number;
};
```

Check against [http://localhost:8090/docs](http://localhost:8090/docs). The fields must match the real response.

---

## Task 2. Loader `lib/api/items.ts`

```tsx
import type { Item, ItemsResponse } from "./types";

function baseUrl(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    headers: { Accept: "application/json" },
    cache: "no-store", // no cache for now — chapter 16
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load the catalog (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}
```

**Criterion:** when FastAPI is stopped, the page fails with a clear error (you'll build an `error.tsx` later).

---

## Task 3. `ItemCard` (Server Component)

```tsx
// components/catalog/ItemCard.tsx
import Link from "next/link";
import type { Item } from "@/lib/api/types";

type Props = { item: Item };

export function ItemCard({ item }: Props) {
  return (
    <li className="card">
      <Link href={`/catalog/${item.id}`}>
        <strong>{item.title}</strong>
      </Link>
      {item.description ? (
        <p className="muted">{item.description}</p>
      ) : null}
    </li>
  );
}
```

No `"use client"` — just markup and a `Link`.

---

## Task 4. Page `app/catalog/page.tsx`

```tsx
import { getItems } from "@/lib/api/items";
import { ItemCard } from "@/components/catalog/ItemCard";

export const metadata = {
  title: "Catalog",
};

export default async function CatalogPage() {
  const items = await getItems();

  if (items.length === 0) {
    return (
      <section>
        <h1>Catalog</h1>
        <p className="muted">No products yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Catalog</h1>
      <p className="muted">Loaded from FastAPI :8090 (SSR)</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
```

---

## Task 5. `loading.tsx` (optional)

```tsx
// app/catalog/loading.tsx
export default function CatalogLoading() {
  return (
    <section aria-busy="true">
      <h1>Catalog</h1>
      <p className="muted">Loading products…</p>
    </section>
  );
}
```

Artificially slow down `getItems` (`await new Promise(r => setTimeout(r, 800))`) and confirm the skeleton shows.

---

## Task 6. SSR check

1. Disable JavaScript in DevTools → **Reload**.
2. The catalog **must** render — the data is in the HTML, not only after hydration.
3. **View Page Source** — find `Demo item` in the source.

| Check | Expectation |
|----------|----------|
| `/catalog` with FastAPI running | a product list |
| FastAPI stopped | an error (dev overlay or error boundary) |
| Empty `_ITEMS` in FastAPI | the text "No products yet" |
| SSR without JS | content is visible |

---

## Bonus: product page

```tsx
// lib/api/items.ts — add
export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Item ${id}: ${res.status}`);
  return (await res.json()) as Item;
}
```

```tsx
// app/catalog/[id]/page.tsx
import { getItem } from "@/lib/api/items";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) notFound();

  const item = await getItem(numId);
  if (!item) notFound();

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
    </article>
  );
}
```

---

## Common problems

| Symptom | Cause | Fix |
|---------|---------|---------|
| `ECONNREFUSED` | FastAPI not running | `docker compose up` in deploy/fastapi |
| Empty array, curl OK | wrong JSON parsing | read `data.items`, not the root |
| 404 on `/catalog` | no `page.tsx` | create `app/catalog/page.tsx` |
| CORS in the console | client fetch to :8090 | use a server fetch (this lab) |

---

## Success criteria

- [ ] `GET` goes to `FASTAPI_URL/api/v1/items` from the server
- [ ] The types match the OpenAPI
- [ ] The list renders without `"use client"` on the page
- [ ] Empty state when `items.length === 0`
- [ ] Content is visible with JS disabled (SSR)
- [ ] (Bonus) `/catalog/1` opens the product card

---

## What's next

In [16-caching-revalidate.md](16-caching-revalidate.md) you'll replace `cache: 'no-store'` with `revalidate` and figure out why prod "stuck" on old prices.

Next lesson: [16. Cache, revalidate, tags, no-store](16-caching-revalidate.md).
