# 22. Lab: CRUD via TanStack Query

## Scenario

Ticket **SHOP-201**: "A minimal admin in the SPA — list, add, delete with optimistic UI." The FastAPI backend on `:8090` already supports CRUD via `/api/v1/items`. You replace the manual fetch from [19-lab-fetch-items.md](19-lab-fetch-items.md) with **Query + mutations** ([20-tanstack-query.md](20-tanstack-query.md), [21-mutations.md](21-mutations.md)).

**Time:** ~55–70 minutes.

---

## Setup

```bash
# API
cd deploy/fastapi && docker compose up -d --build

# React
cd courses/react-basic/examples
npm install
```

In `main.tsx` — `QueryClientProvider` ([20-tanstack-query.md](20-tanstack-query.md)).

Structure:

```text
src/
  lab/
    QueryCrudLab.tsx
  components/
    ItemsQueryList.tsx
    CreateItemForm.tsx
    ItemRowActions.tsx
  hooks/
    useItems.ts
    useItemMutations.ts
```

---

## Task 1. `useItems`

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: ({ signal }) => api<Item[]>("/api/v1/items", { signal }),
    staleTime: 30_000,
  });
}
```

---

## Task 2. `ItemsQueryList`

- `useItems()`;
- `isPending` → loading;
- `isError` → error + `refetch()`;
- `data.length === 0` → empty;
- each row: name, price, `ItemRowActions`.

Show `isFetching && !isPending` as "Updating…".

---

## Task 3. `CreateItemForm`

Fields: `name` (required), `price` (number > 0), `description` (optional).

Hook `useCreateItem`:

```tsx
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateItemInput) =>
      api<Item>("/api/v1/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

After success — clear the form (`e.currentTarget.reset()`). Button disabled while `isPending`.

---

## Task 4. Optimistic delete — `useDeleteItem`

Implement it following the template from [21-mutations.md](21-mutations.md):

- `onMutate`: cancel, snapshot `["items"]`, filter by id;
- `onError`: restore the snapshot;
- `onSettled`: invalidate.

`ItemRowActions`:

```tsx
<button type="button" onClick={() => deleteItem.mutate(item.id)}>
  Delete
</button>
```

---

## Task 5. `QueryCrudLab`

```tsx
export function QueryCrudLab() {
  return (
    <main>
      <h1>Shop CRUD (Query)</h1>
      <CreateItemForm />
      <ItemsQueryList />
    </main>
  );
}
```

Wire it into `App.tsx`.

---

## Verification

| Action | Expectation |
|----------|----------|
| Open the lab | one items request (Network) |
| Open a second tab with the same lab | staleTime — possibly no refetch for 30s |
| POST a new product | the list updated without F5 |
| DELETE | the row disappears immediately; on stop API + delete — rollback + error |
| DevTools Query | key `["items"]`, stale/fresh |

Two `useItems()` components on the page — **one** network request (dedupe).

---

## Task 6. (Optional) PATCH the price

Inline edit of the price → `useMutation` PATCH `/api/v1/items/{id}` + invalidate.

---

## Success criteria

- [ ] QueryClientProvider in the tree
- [ ] List via `useQuery`, not useEffect
- [ ] POST + invalidate
- [ ] DELETE optimistic + rollback
- [ ] UI: pending/error on the form and buttons
- [ ] `npm run typecheck` OK

---

## Common mistakes in the lab

1. **Provider forgotten** — runtime error QueryClient.

2. **Optimistic without cancelQueries** — the list "flickers" after delete.

3. **POST without Content-Type** — 422 from FastAPI.

4. **invalidate with the wrong key** — `['item']` vs `['items']`.

5. **Two fetches: the old ItemsList + Query** — remove the legacy effect.

---

## Related courses

- Queries: [20-tanstack-query.md](20-tanstack-query.md)
- Mutations: [21-mutations.md](21-mutations.md)
- Router for the edit route: [25-lab-router.md](25-lab-router.md)
- URL filters: [26-url-state.md](26-url-state.md)

---

## Lab summary

The shop SPA manages the catalog through Query server state: reads with a cache, writes with invalidation, deletes with optimistic UX. The pattern scales up to the capstone [38-capstone.md](38-capstone.md).

---

## Checklist before submitting

- How many GET items requests with two `useItems()`?
- What does onSettled do after a failed delete?
- How does Swagger tell you the POST body?
- Are you ready to remove the manual fetch from [19-lab-fetch-items.md](19-lab-fetch-items.md)?

Next lesson: [23. React Router](23-react-router.md).
