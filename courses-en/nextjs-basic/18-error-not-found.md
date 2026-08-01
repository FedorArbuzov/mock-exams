# 18. Error boundaries: `error.tsx`, `notFound()`

## Introduction: a scenario from work

QA opens `/catalog/999` and sees a blank screen with a generic "Application error" in production. In dev, it's a red overlay with a stack trace. The PM says: "We need a real 404, not a panic." Separately, FastAPI goes down on `/catalog` and the user sees raw technical JSON in the overlay, while monitoring stays silent because **a throw in an RSC never reaches a client-side try/catch**.

In the App Router, errors and "not found" states are **file conventions**, not just a React Error Boundary inside `"use client"`. `error.tsx` catches runtime errors in a segment; `not-found.tsx` plus `notFound()` gives you a controlled HTTP 404. Without them, a single `throw` in `getItems()` breaks the entire UX.

## What you'll learn

- `error.tsx` — a client boundary for a segment
- `global-error.tsx` for the root
- `not-found.tsx` and the `notFound()` function
- The difference between 404 and 500 in Next.js
- `error` vs `loading` vs `not-found`
- Logging and `digest`
- Integration with FastAPI 404s

---

## Three files for UI states

| File | When it shows | HTTP (typical) |
|------|-------------------|----------------|
| `loading.tsx` | Suspense / async pending | 200 (streaming) |
| `error.tsx` | uncaught error in a segment | 200/500* |
| `not-found.tsx` | `notFound()` called | **404** |

\* In production, Next may return 500 for an unhandled server error; the exact details depend on your deployment.

All three follow **convention over configuration**, living next to `page.tsx` in a route segment.

---

## `error.tsx`

**Must be a Client Component** — a React Error Boundary only works on the client after hydration (plus Next's special server-side wiring).

```tsx
// app/catalog/error.tsx
"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CatalogError({ error, reset }: Props) {
  return (
    <section role="alert">
      <h2>Failed to load the catalog</h2>
      <p className="muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Try again later or refresh the page."}
      </p>
      {error.digest ? (
        <p className="muted">
          <small>Code: {error.digest}</small>
        </p>
      ) : null}
      <button type="button" onClick={() => reset()}>
        Retry
      </button>
    </section>
  );
}
```

### Behavior

- Catches errors in **child** Server/Client Components within this segment.
- **Does not** catch errors in the `layout.tsx` at the same level (a layout above has its own error boundary, or the error bubbles further up).
- `reset()` re-renders the segment without a full page reload.

### `digest`

In production, Next **hides** the message and stack; only `digest` remains — an id for correlating with server logs. Log it server-side in the loader:

```tsx
if (!res.ok) {
  console.error("getItems failed", res.status);
  throw new Error(`Catalog unavailable: ${res.status}`);
}
```

---

## `notFound()` and `not-found.tsx`

```tsx
// app/catalog/[id]/page.tsx
import { notFound } from "next/navigation";
import { getItem } from "@/lib/api/items";

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const item = await getItem(itemId);
  if (!item) notFound();

  return <article><h1>{item.title}</h1></article>;
}
```

```tsx
// app/catalog/[id]/not-found.tsx
import Link from "next/link";

export default function ItemNotFound() {
  return (
    <section>
      <h1>Product not found</h1>
      <p className="muted">It may have been removed from the catalog.</p>
      <Link href="/catalog">← To the catalog</Link>
    </section>
  );
}
```

`notFound()` is **not a thrown Error** — it's controlled flow that produces a 404 and renders the nearest `not-found.tsx` up the tree.

### FastAPI 404s

```tsx
export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`);
  if (res.status === 404) return null; // → notFound() in the page
  if (!res.ok) throw new Error(`Item fetch ${res.status}`);
  return (await res.json()) as Item;
}
```

| API response | Action in the page |
|-----------|-----------------|
| 404 | `notFound()` |
| 500 | `throw` → `error.tsx` |
| 200 + empty | business logic / empty UI |

---

## The `not-found.tsx` hierarchy

```text
app/
  not-found.tsx              # global 404
  catalog/
    not-found.tsx            # for all of /catalog/*
    [id]/
      not-found.tsx          # item-specific
```

Next picks the **nearest** `not-found.tsx` when `notFound()` is called.

---

## `global-error.tsx`

An error in the **root** `layout.tsx` — a regular `error.tsx` may not fire (there's no parent layout to render it). This is the root fallback:

```tsx
// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <h1>Critical error</h1>
        <button type="button" onClick={() => reset()}>
          Reload
        </button>
      </body>
    </html>
  );
}
```

It must include its own `<html>` and `<body>`.

---

## `error.tsx` vs try/catch in a Server Component

```tsx
export default async function CatalogPage() {
  try {
    const items = await getItems();
    return <List items={items} />;
  } catch {
    return <p>Loading error</p>; // inline fallback — fine for simple cases
  }
}
```

| Approach | Pros | Cons |
|--------|-------|--------|
| try/catch in the page | full control over UI | duplicated on every page |
| `error.tsx` | consistent segment UX, reset | client component, doesn't catch sibling layout errors |

For the shop's catalog: **`error.tsx` on `/catalog`**, plus try/catch only where you need a partial fallback (header stays fine, list fails).

---

## Metadata and 404

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(Number(id));
  if (!item) return { title: "Not found" };
  return { title: item.title };
}
```

`generateMetadata` runs before the page. When `notFound()` fires from inside metadata, watch out for a double fetch — use `cache()` ([17-parallel-fetch.md](17-parallel-fetch.md)).

---

## Relationship with HTTP and SEO

- **404** — search engines drop the URL from the index (expected for "item delisted").
- **500** on `/catalog` — a bad signal; wire up monitoring plus `error.tsx` with retry.
- Never return **200** with "not found" text and skip `notFound()` — a soft 404 hurts SEO.

---

## Logging in production

```tsx
// error.tsx
"use client";

import { useEffect } from "react";

export default function CatalogError({ error, reset }: Props) {
  useEffect(() => {
    // send to Sentry / Datadog — client-side only
    console.error("Catalog segment error", error.digest ?? error.message);
  }, [error]);

  return (/* UI */);
}
```

Log server-side errors **in the loader before the throw** — the client error boundary never sees the user's server console.

---

## Common mistakes

1. **`error.tsx` without `"use client"`** — build error.

2. **Calling `notFound()` for a 500** — the user thinks "the item doesn't exist" when the API is actually down.

3. **An empty `not-found.tsx`** — falls back to the generic root 404 with no way back.

4. **Expecting the error boundary to catch an event handler** — it only covers render/lifecycle children; errors in `onClick` need their own try/catch.

5. **Duplicating a fetch across the page and `generateMetadata`** — without `cache()` that's two requests.

6. **Showing a stack trace in the production error UI** — leaks internals.

7. **Forgetting the `reset` button** — the user is stuck with no way to reload.

8. **Signaling 404 via `throw new Error('Not found')`** — that's an HTTP 500, not a 404.

---

## Checklist

- Why is `error.tsx` a client component?
- How does `notFound()` differ from a `throw`?
- What HTTP status does a controlled 404 return?
- Where is an error caught in the catalog's `layout.tsx`?
- What is `digest` in production?
- FastAPI returns 404 — what should the Next page do?
- When is try/catch better than `error.tsx`?

Next lesson: [19. Route Handlers: REST inside `app/api`](19-route-handlers.md).
