# 14. `fetch` in Server Components

## Intro: a scenario from work

Friday, 4:47 PM. Ticket **NEXT-214**: "The catalog on the home page is empty in production, works locally." You ported the code from the Vite SPA: `useEffect` + `fetch('/api/v1/items')` — and got a build error: *"You're importing a component that needs useEffect. It only works in a Client Component"*. A colleague suggested adding `"use client"` to the whole page — the tech lead rejected it: "Then we lose SSR and SEO."

In the App Router, **the data for the first screen is loaded on the server** — in a Server Component that can be `async`. `fetch` is called there too, but the rules differ: no CORS (the request comes from the Next.js Node process), the backend URL must be **absolute**, and the component must be an **async function**. This chapter is the bridge between [09-server-components.md](09-server-components.md) and the [15-lab-server-fetch.md](15-lab-server-fetch.md) lab, where you'll connect FastAPI on `:8090`.

## What you'll learn

- Why `fetch` in a Server Component doesn't require `"use client"`
- How to declare an **async Server Component**
- Absolute URLs to FastAPI and the `FASTAPI_URL` variable
- Parsing the response: `response.ok`, `json()`, typing
- The difference between server `fetch` and browser `fetch` (CORS, cookies)
- The "thin page + data-loading function" pattern
- Preparing for caching (chapter 16)

---

## Server Component and data

A Server Component renders **on the server** (build time or request time). It:

- does **not** end up in the client's JS bundle (except the serialized HTML/RSC payload);
- **can** read env secrets and reach internal services;
- **cannot** use hooks (`useState`, `useEffect`).

Data loading happens **right in the component body** or in a called function:

```tsx
// app/catalog/page.tsx — Server Component (no "use client")
type Item = {
  id: number;
  title: string;
  description?: string;
};

type ItemsResponse = {
  items: Item[];
  total: number;
};

async function getItems(): Promise<Item[]> {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  const res = await fetch(`${base}/api/v1/items`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`FastAPI returned ${res.status}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}

export default async function CatalogPage() {
  const items = await getItems();

  return (
    <section>
      <h1>Catalog</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            {item.description ? <p>{item.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Note: `export default async function` — an **async component** is allowed only in Server Components.

---

## Async Server Components

| Aspect | Client Component | Async Server Component |
|--------|------------------|------------------------|
| Directive | `"use client"` | not needed (server by default) |
| `async`/`await` | not allowed at the component level | **allowed** |
| `fetch` on mount | via `useEffect` | **await in the body** |
| First HTML | empty / skeleton | **data already in the HTML** |
| Secrets | only `NEXT_PUBLIC_*` | any env on the server |

React "suspends" the render of an async component until the Promise resolves. The user may see the `loading.tsx` from [06-layouts-templates.md](06-layouts-templates.md) or streaming via Suspense ([13-suspense-streaming.md](13-suspense-streaming.md)).

---

## Absolute URLs

In the browser, `fetch('/api/v1/items')` resolves relative to the **page's origin** (`http://localhost:3000`). On the Next.js server there is **no** such origin for the backend — a relative path `/api/v1/items` would go to **Next itself**, not to FastAPI `:8090`.

**Rule:** a server-side `fetch` to an external API — a **full URL**:

```tsx
const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
await fetch(`${base}/api/v1/items`);
```

Copy [`.env.example`](examples/.env.example) to `examples/.env.local`:

```env
FASTAPI_URL=http://localhost:8090
```

More on env — [28-env-config.md](28-env-config.md). Do **not** use `NEXT_PUBLIC_FASTAPI_URL` for server-only calls — the backend URL shouldn't be exposed to the client unnecessarily.

---

## FastAPI response format

The [deploy/fastapi](../../deploy/fastapi/README.md) instance returns:

```json
{
  "items": [
    { "id": 1, "title": "Demo item", "description": "From course stack" }
  ],
  "total": 1
}
```

Check the current schema: [http://localhost:8090/docs](http://localhost:8090/docs).

```bash
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

---

## Handling HTTP errors

As in the browser, `fetch` does **not reject** on 404/500 — only on network failures:

```tsx
async function getItems(): Promise<Item[]> {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  let res: Response;

  try {
    res = await fetch(`${base}/api/v1/items`, {
      next: { revalidate: 60 }, // cache — chapter 16
    });
  } catch (err) {
    // FastAPI not running, DNS, timeout
    throw new Error("Failed to reach the API", { cause: err });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}
```

An unhandled `throw` in a Server Component leads to `error.tsx` ([18-error-not-found.md](18-error-not-found.md)).

---

## Server fetch vs Client fetch

| | Server `fetch` | Client `fetch` |
|---|----------------|------------------|
| Where it runs | Node.js (Next server) | The browser |
| CORS | **no** | yes, if a different origin |
| The user's cookies | need an explicit `headers: { cookie }` | sent automatically |
| Backend URL visibility | hidden from the user | visible in DevTools |
| When to use | first screen, SEO, secrets | interactivity, polling, cart |

For a shop catalog, the **first list** is a Server Component; an "on the fly" filter without a reload is a Client island + Query ([24-tanstack-query.md](24-tanstack-query.md)).

---

## Pattern: a loader function

Keep the page "thin," logic in `lib/`:

```text
examples/
  app/
    catalog/
      page.tsx          # async, only JSX + await
  lib/
    api/
      items.ts          # getItems(), getItem(id)
      types.ts          # Item, ItemsResponse
```

```tsx
// lib/api/items.ts
import type { Item, ItemsResponse } from "./types";

function apiBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${apiBase()}/api/v1/items`);
  if (!res.ok) throw new Error(`Items list failed: ${res.status}`);
  const data = (await res.json()) as ItemsResponse;
  return data.items;
}

export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${apiBase()}/api/v1/items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Item ${id} failed: ${res.status}`);
  return (await res.json()) as Item;
}
```

A single source of truth for pages, Route Handlers (chapter 19), and Server Actions (chapter 21).

---

## Connection to React from react-basic

In [react-basic/17-fetch-react.md](../react-basic/17-fetch-react.md) you loaded data in `useEffect`. In Next.js the **equivalent of the first render** is `await` in a Server Component:

```text
SPA (Vite)                    Next.js App Router
─────────────────────────────────────────────────
mount → useEffect → fetch     request → async page → fetch
loading spinner in the browser  HTML with data from the server
```

A client `useEffect`+`fetch` in Next.js is **not forbidden**, but for a static catalog it's a step back in UX and SEO.

---

## Dynamic segment `[id]`

```tsx
// app/catalog/[id]/page.tsx
import { getItem } from "@/lib/api/items";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const item = await getItem(itemId);
  if (!item) notFound();

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
    </article>
  );
}
```

In Next.js 15, `params` is a **Promise**; in earlier versions it's a synchronous object. Check the version in [`examples/package.json`](examples/package.json).

---

## Common pitfalls

1. **`"use client"` + async component** — syntactically impossible; hooks and async can't coexist on one component.

2. **A relative URL on the server** — `fetch('/api/v1/items')` hits Next `:3000`, not FastAPI `:8090`.

3. **Forgetting `await res.json()`** — you render the `Response` object, not the data.

4. **No `res.ok` check** — empty or broken JSON on a 500 masquerades as an "empty catalog."

5. **Expecting an array at the JSON root** — FastAPI returns `{ items, total }`, not `Item[]`.

6. **FastAPI not running** — `ECONNREFUSED`; in dev read the stack trace, in prod — `error.tsx`.

7. **Duplicating a fetch in the layout and the page** — without dedupe (chapter 17) that's two requests to one URL.

8. **`NEXT_PUBLIC_*` for a server-only URL** — an unnecessary leak of infrastructure into the bundle.

---

## Checklist

- Why can a Server Component be `async` but a Client one can't?
- Why an absolute URL for a server-side `fetch`?
- Does `fetch` reject on HTTP 404?
- What's the JSON structure of `GET /api/v1/items` on the instance?
- Where to store `FASTAPI_URL` — `.env.local` or hardcode?
- How does server fetch differ from client with respect to CORS?
- What will the user see if `getItems()` throws an error without an `error.tsx`?

Next lesson: [15. Lab: product list with FastAPI :8090](15-lab-server-fetch.md).
