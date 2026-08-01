# 19. Lab: product list with the API

## Scenario

Ticket **SHOP-142**: "Connect the catalog to FastAPI, show loading/error/empty." The backend on `:8090` already returns JSON — your job is in React: `fetch` via the proxy, types, and the UI states from [17-fetch-react.md](17-fetch-react.md). The debounced search from [16-lab-effects.md](16-lab-effects.md) is **not** required yet — a static list; you'll add the filter in [26-url-state.md](26-url-state.md).

**Time:** ~50–65 minutes.  
**Stand:** [deploy/fastapi](../../deploy/fastapi/README.md) is required.

---

## Setup

Terminal 1 — API:

```bash
cd deploy/fastapi
docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Terminal 2 — React:

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Make sure the proxy in [`vite.config.ts`](examples/vite.config.ts) routes `/api` → `:8090`.

Structure:

```text
src/
  api/
    client.ts
    types.ts
  components/
    ItemsList.tsx
    ItemRow.tsx
  lab/
    FetchItemsLab.tsx
```

---

## Task 1. Types `api/types.ts`

```tsx
export type Item = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
};
```

Compare the fields against [http://localhost:8090/docs](http://localhost:8090/docs). If they differ — adjust the type (optionally Zod in [34-lab-typescript.md](34-lab-typescript.md)).

---

## Task 2. Client `api/client.ts`

```tsx
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
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
```

The path is **only** `/api/...`, not `http://localhost:8090/...` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Task 3. `ItemRow`

```tsx
import type { Item } from "@/api/types";

type Props = { item: Item };

export function ItemRow({ item }: Props) {
  return (
    <li>
      <strong>{item.name}</strong>
      <span> — {item.price.toFixed(2)} €</span>
      {item.description ? <p>{item.description}</p> : null}
    </li>
  );
}
```

---

## Task 4. `ItemsList`

Requirements:

- a state machine: `loading` | `error` | `success`;
- `useEffect` + `api<Item[]>('/api/v1/items')` + `AbortController`;
- UI: loading text, an error with a **Retry** button (increment a retry state), empty "The catalog is empty", the list via `ItemRow`;
- `key={item.id}`.

### Skeleton

```tsx
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: Item[] };

export function ItemsList() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    api<Item[]>("/api/v1/items", { signal: controller.signal })
      .then((items) => setState({ status: "success", items }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Load error",
        });
      });

    return () => controller.abort();
  }, [retry]);

  // TODO: render branches
}
```

---

## Task 5. `FetchItemsLab` and `App`

```tsx
export function FetchItemsLab() {
  return (
    <main className="app">
      <h1>Shop — catalog (API)</h1>
      <ItemsList />
    </main>
  );
}
```

Wire it into `App.tsx`.

---

## Verification

| Step | Expectation |
|-----|----------|
| API up, refresh the page | a list of Demo products |
| `docker compose stop` the API, retry | error + the button works after start |
| DevTools Network | request to `localhost:5173/api/v1/items`, status 200 |
| `npm run typecheck` | no errors |

(Optional) Stop the API **during** loading — there shouldn't be an uncaught exception after unmount.

---

## Task 6. (Optional) A single product

`GET /api/v1/items/1` in a separate `ItemDetail` — a starting point for [25-lab-router.md](25-lab-router.md).

---

## Success criteria

- [ ] Data from the real `:8090` via the proxy
- [ ] loading / error / empty / list
- [ ] Retry without F5
- [ ] Abort on unmount
- [ ] TypeScript strict OK

---

## Common mistakes in the lab

1. **Absolute URL to 8090** — CORS in the browser.

2. **No `res.ok` in the client** — it's already in `api()`, don't duplicate a raw fetch without a check.

3. **Initial `items: []` without loading** — an "empty" flash.

4. **Forgot to bring up docker** — "Failed to fetch" / 502 proxy.

5. **Wrong key** — index instead of `item.id` ([07-lists-keys.md](07-lists-keys.md)).

---

## Relation to the course

- fetch UI: [17-fetch-react.md](17-fetch-react.md)
- CORS/proxy: [18-cors-fastapi.md](18-cors-fastapi.md)
- Query refactor: [20-tanstack-query.md](20-tanstack-query.md)
- Router detail: [25-lab-router.md](25-lab-router.md)

---

## Lab summary

You connected the Vite shop SPA to the FastAPI catalog: a typed client, an effect with abort, four UI states. This is the reference before migrating to TanStack Query — the same `/api/v1/items` contract, less boilerplate.

---

## Checklist before submitting

- Why does the URL start with `/api`?
- What does the API return when the container is stopped?
- Where is the abort cleanup?
- Are you ready to describe the Item type from OpenAPI?

Next lesson: [20. TanStack Query](20-tanstack-query.md).
