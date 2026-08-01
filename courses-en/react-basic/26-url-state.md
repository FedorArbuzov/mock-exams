# 26. URL as state: search params

## A scenario from work

QA on the shop: "I filtered the catalog by 'keyboard', sent the link to a colleague — for them the filter is **reset**." The filter lives only in `useState` — the URL doesn't reflect the state. Product: "Filters and the pagination page should be in the query string, like a proper shop; refresh and share should work."

**`useSearchParams`** (React Router) syncs the **search** part of the URL (`?q=keyboard&page=2`) with the UI. Together with TanStack Query — the `queryKey` includes the params → the correct cache for `:8090`.

## What you'll learn

- `useSearchParams` read/write
- The URL ↔ filters ↔ `useQuery` connection
- Debounced search in the URL (carefully)
- The `URLSearchParams` API
- A bookmarkable shop catalog

---

## URL anatomy

```text
http://localhost:5173/items/5?q=keyboard&sort=price&page=2
                      │ path  │ └────── search (query string) ──────┘
```

Path — **which screen** ([24-nested-routes.md](24-nested-routes.md)).  
Search — **which variant of the screen** (filters, sort, page).

---

## `useSearchParams`

```tsx
import { useSearchParams } from "react-router-dom";

function CatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  function setQuery(nextQ: string) {
    const next = new URLSearchParams(searchParams);
    if (nextQ) {
      next.set("q", nextQ);
    } else {
      next.delete("q");
    }
    next.set("page", "1"); // reset the page on a new search
    setSearchParams(next);
  }

  return (
    <input
      value={q}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search…"
    />
  );
}
```

`setSearchParams` updates the URL **without** a full reload; components re-render.

---

## Initializing from the URL

On first opening `/catalog?q=mouse`, the search field should show `mouse` — read from `searchParams`, don't duplicate a separate state without sync:

```tsx
const q = searchParams.get("q") ?? "";
// controlled input value={q} — URL is source of truth
```

If you need a debounce **before** writing to the URL ([16-lab-effects.md](16-lab-effects.md)):

```tsx
const [draft, setDraft] = useState(() => searchParams.get("q") ?? "");

useEffect(() => {
  const t = setTimeout(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (draft) next.set("q", draft);
      else next.delete("q");
      next.delete("page");
      return next;
    });
  }, 300);
  return () => clearTimeout(t);
}, [draft, setSearchParams]);
```

Two sources — draft for the input, URL for sharing — synced via an effect.

---

## Query + search params

```tsx
function CatalogPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";

  const { data, isPending, isError } = useQuery({
    queryKey: ["items", { q, page }],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", page);
      const qs = params.toString();
      const path = qs ? `/api/v1/items?${qs}` : "/api/v1/items";
      return api<Item[]>(path, { signal });
    },
  });

  // render list...
}
```

Any change to `q` or `page` → a new `queryKey` → a fetch (or a cache hit if it already happened). The backend `:8090` must understand the query (or filter on the client for the learning API — note it in the lab README).

---

## Pagination in the URL

```tsx
function Pagination({ totalPages }: { totalPages: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  function goTo(p: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  }

  return (
    <div>
      <button type="button" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        Previous
      </button>
      <span>{page} / {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

---

## `setSearchParams` options

```tsx
setSearchParams(next, { replace: true }); // don't pile up history on every character
```

For a debounced URL update — **`replace: true`** reduces the "Back" stack.

---

## Multiple filters

```tsx
const category = searchParams.get("category") ?? "all";

function setCategory(cat: string) {
  const next = new URLSearchParams(searchParams);
  if (cat === "all") next.delete("category");
  else next.set("category", cat);
  next.set("page", "1");
  setSearchParams(next);
}
```

queryKey:

```tsx
queryKey: ["items", { q, page, category }]
```

---

## Sync when navigating programmatically

```tsx
navigate(`/catalog?${new URLSearchParams({ q: "hub" })}`);
// or
navigate({ pathname: "/", search: "?q=hub" });
```

After [23-react-router.md](23-react-router.md), `useNavigate` + a search object.

---

## Difference from path params

| | Path `:itemId` | Search `?q=` |
|---|----------------|--------------|
| Example | `/items/42` | `/?q=keyboard` |
| Required | route match | optional filters |
| REST resource id | yes | no |

Don't put a primary entity id only in search if you need a RESTful share `/items/42`.

---

## FastAPI :8090

Pass the filters as a query string — align it with the OpenAPI `/docs`. If the stand doesn't support `q` — filter `data` on the client, but still **learn the URL state** for the capstone.

Proxy: `/api/v1/items?q=...` → `:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Common mistakes

1. **A filter only in useState** — the link isn't shareable.

2. **queryKey without search params** — the wrong cache when `?q=` changes.

3. **Debounce writes the URL on every key** without replace — history spam.

4. **Forgetting to reset page** on a new q — an "empty" page 5.

5. **Duplicating: state q + searchParams q** — desync; one source of truth.

6. **Not encoding** — `URLSearchParams` vs a manual string with spaces.

---

## Summary

Search params make the shop's filters **bookmarkable**: `useSearchParams` reads and writes `?q=&page=`. TanStack Query includes the params in the `queryKey` and `queryFn`. Debounced search → URL with `replace: true`. Path params for the product id, search for catalog variants. Backend `:8090` or a client filter — but the URL stays the UX contract.

---

## Checklist

- How do you read `q` from the URL?
- Why reset `page` on a new search?
- What ends up in the queryKey for `?q=a&page=2`?
- Why is `setSearchParams` better than `window.location.search =`?
- When to use replace?
- How does a colleague reproduce your filter?

Next lesson: [27. useRef, useMemo, useCallback](27-ref-memo-callback.md).
