# 17. `fetch` in React: loading, error, empty

## A scenario from work

The shop catalog page must, on open, show products from FastAPI `:8090`. The developer calls `fetch` in a `useEffect`, but the UI **flickers**: first "no products", then the list. On a 500 the user sees a blank page — the error is only in the console. QA reproduces it: quickly switch the category — the screen shows products **from the previous** category. A third bug: `response.ok` was forgotten — the list contains `{ "detail": "Not found" }` as a "product".

React doesn't load data itself. The **loading / error / success / empty** pattern is a mandatory part of the UI against a REST API. This chapter is before TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)); understanding manual fetch is needed for debugging and interviews.

## What you'll learn

- The loading state machine in a component
- `useEffect` + `fetch` + `AbortController`
- The difference between a **network error**, an **HTTP error**, and an **empty list**
- An `api()` wrapper and typing the response
- Why Query will replace most of this boilerplate

---

## The four UI states

| State | What we show |
|-----------|----------------|
| **loading** | skeleton / spinner |
| **error** | message + retry |
| **success + empty** | "No products found" |
| **success + data** | the list |

Don't conflate "loading" and "empty": while `loading === true`, don't show empty.

```tsx
type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: Item[] };
```

A discriminated union simplifies branching in JSX ([typescript-basic](../typescript-basic/README.md)).

---

## Basic `ItemsList` component

```tsx
import { useEffect, useState } from "react";

type Item = {
  id: number;
  name: string;
  price: number;
  description?: string;
};

async function fetchItems(signal?: AbortSignal): Promise<Item[]> {
  const res = await fetch("/api/v1/items", { signal });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

export function ItemsList() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetchItems(controller.signal)
      .then((items) => setState({ status: "success", items }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p aria-busy="true">Loading catalog…</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert">
        <p>Failed to load products: {state.message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return <p>The catalog is empty.</p>;
  }

  return (
    <ul>
      {state.items.map((item) => (
        <li key={item.id}>
          {item.name} — {item.price.toFixed(2)} €
        </li>
      ))}
    </ul>
  );
}
```

The URL `/api/v1/items` — via the **Vite proxy** to `http://localhost:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## An `api()` wrapper for the shop

A single point for the base path and errors (as in [29-fetch.md](../javascript-basic/29-fetch.md)):

```tsx
// src/api/client.ts
export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// usage
const items = await api<Item[]>("/api/v1/items");
```

In production the base URL can come from env (`import.meta.env.VITE_API_URL`).

---

## Retry without reloading the page

`window.location.reload()` is crude. Better a **key** or a local `retryCount`:

```tsx
const [retry, setRetry] = useState(0);

useEffect(() => {
  const controller = new AbortController();
  setState({ status: "loading" });

  api<Item[]>("/api/v1/items", { signal: controller.signal })
    .then((items) => setState({ status: "success", items }))
    .catch(/* ... */);

  return () => controller.abort();
}, [retry]);

// in the error UI:
<button type="button" onClick={() => setRetry((n) => n + 1)}>
  Retry
</button>
```

---

## Loading by parameter (category)

```tsx
function ItemsByCategory({ category }: { category: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    const params = new URLSearchParams({ category });
    api<Item[]>(`/api/v1/items?${params}`, { signal: controller.signal })
      .then((items) => setState({ status: "success", items }))
      .catch(/* abort + error */);

    return () => controller.abort();
  }, [category]);

  // render by state...
}
```

When `category` changes, abort cancels the old request — protection against a race ([15-effect-patterns.md](15-effect-patterns.md)).

---

## An `async` function inside an effect

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    try {
      const items = await api<Item[]>("/api/v1/items", {
        signal: controller.signal,
      });
      setState({ status: "success", items });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // ...
    }
  }

  load();
  return () => controller.abort();
}, []);
```

Don't write `useEffect(async () => { ... })` — an effect must return cleanup, not a Promise.

---

## Initial state and flash

If you use `useState([])` and a separate `loading` false — there will be an "empty" flash. Start with `{ status: "loading" }` or `loading: true`.

---

## Relation to the FastAPI stand

| Endpoint | Purpose |
|----------|------------|
| `GET /api/v1/items` | the shop's product list |
| `GET /api/v1/items/{id}` | a product card |
| `GET /health` | stand check |

Startup: [deploy/fastapi/README.md](../../deploy/fastapi/README.md). Swagger: [http://localhost:8090/docs](http://localhost:8090/docs).

Lab with a real API: [19-lab-fetch-items.md](19-lab-fetch-items.md).

---

## The path to TanStack Query

The manual code above repeats in every component. Query gives you:

- a cache by `queryKey`;
- request dedupe;
- `isPending` / `isError` / `refetch`;
- invalidation after a mutation ([21-mutations.md](21-mutations.md)).

But the **semantics** of loading/error/empty stay the same in the UI ([31-ui-states.md](31-ui-states.md)).

---

## Common mistakes

1. **fetch without `ok`** — FastAPI errors treated as data.

2. **No abort** — setState after unmount, wrong order of responses.

3. **Flash empty** — an initial state of "success with []".

4. **`useEffect(async () => ...)`** — incorrect cleanup.

5. **A single `error` string for the whole app** — context is lost (which request failed).

6. **Hardcoding `http://localhost:8090` in a prod build** — CORS breaks; use a proxy or env.

---

## Summary

A component with `fetch` manages an explicit state machine: loading → success or error. An empty list is a separate branch of success. An effect with `[deps]`, `AbortController`, and an `res.ok` check. The `api()` wrapper unifies shop API errors. After mastering the pattern, move to TanStack Query while keeping the same UI states.

---

## Checklist

- How does "empty catalog" differ from "still loading"?
- Why `AbortController` when the filter changes?
- Does `fetch` reject on HTTP 404?
- Why isn't the effect async?
- How do you retry a request without a reload?
- What's the items API URL on the mock-exams stand?

Next lesson: [18. CORS and FastAPI :8090](18-cors-fastapi.md).
