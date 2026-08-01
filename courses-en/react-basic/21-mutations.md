# 21. Mutations: changing data on the server

## A scenario from work

An admin in the shop adds a product through a POST `/api/v1/items` form. After success, the list on the home page is **stale** — you need a manual refetch or a page reload. Deleting an item: the UI waits 800 ms for the response with no feedback. Product says: "After Save, the list should update itself; Delete should make the row disappear immediately, with rollback if the API fails."

**`useMutation`** — writing to the server (POST/PUT/PATCH/DELETE). **`invalidateQueries`** — clears the stale cache and refetches the list. **Optimistic update** — the UI updates before the response arrives, with rollback on error.

## What you'll learn

- `useMutation`, `mutate`, `mutateAsync`
- `onSuccess` → `invalidateQueries`
- Optimistic updates via `onMutate` / rollback
- How shop CRUD mutations connect to `:8090`

---

## Query vs Mutation

| | Query | Mutation |
|---|-------|----------|
| HTTP | GET (usually) | POST, PUT, PATCH, DELETE |
| Hook | `useQuery` | `useMutation` |
| Cache | reads, caches | **changes** server state + invalidates |

Don't use `useQuery` for POST.

---

## Creating an item

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

type CreateItemInput = {
  name: string;
  price: number;
  description?: string;
};

function CreateItemForm() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      name: String(form.get("name")),
      price: Number(form.get("price")),
      description: String(form.get("description") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* name, price, description fields */}
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Saving…" : "Add"}
      </button>
      {createMutation.isError && (
        <p role="alert">{createMutation.error.message}</p>
      )}
    </form>
  );
}
```

`invalidateQueries({ queryKey: ["items"] })` marks every query with the `["items"]` prefix stale and refetches the active ones ([20-tanstack-query.md](20-tanstack-query.md)).

---

## `mutate` vs `mutateAsync`

```tsx
// fire-and-forget + callbacks on the mutation
createMutation.mutate(data);

// await in an async handler
try {
  const item = await createMutation.mutateAsync(data);
  navigate(`/items/${item.id}`);
} catch {
  // isError on the mutation
}
```

---

## Deleting with invalidation

```tsx
const deleteMutation = useMutation({
  mutationFn: (id: number) =>
    api<null>(`/api/v1/items/${id}`, { method: "DELETE" }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});

<button
  type="button"
  onClick={() => deleteMutation.mutate(item.id)}
  disabled={deleteMutation.isPending}
>
  Delete
</button>
```

FastAPI can return 204 — your `api()` already handles that ([17-fetch-react.md](17-fetch-react.md)).

---

## Optimistic update

UX goal: the row disappears **before** the DELETE response; on a 500 we put it back.

```tsx
const deleteMutation = useMutation({
  mutationFn: (id: number) =>
    api<null>(`/api/v1/items/${id}`, { method: "DELETE" }),

  onMutate: async (deletedId) => {
    await queryClient.cancelQueries({ queryKey: ["items"] });

    const previous = queryClient.getQueryData<Item[]>(["items"]);

    queryClient.setQueryData<Item[]>(["items"], (old) =>
      old?.filter((item) => item.id !== deletedId) ?? [],
    );

    return { previous };
  },

  onError: (_err, _id, context) => {
    if (context?.previous) {
      queryClient.setQueryData(["items"], context.previous);
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});
```

| Step | Action |
|-----|----------|
| `onMutate` | cancel in-flight requests, snapshot, apply the optimistic patch |
| `onError` | roll back from context |
| `onSettled` | sync with the server via invalidate |

Optimistic updates are for **predictable** operations; for a POST create, invalidation alone (without a fake id) is usually enough.

---

## Updating (PATCH)

```tsx
const updateMutation = useMutation({
  mutationFn: ({ id, patch }: { id: number; patch: Partial<Item> }) =>
    api<Item>(`/api/v1/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  onSuccess: (updated) => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
    queryClient.setQueryData(["items", updated.id], updated);
  },
});
```

---

## Mutation states in the UI

```tsx
createMutation.isPending   // in flight
createMutation.isError
createMutation.isSuccess   // last call succeeded (reset via reset)
createMutation.failureCount
```

Block double submits with `disabled={isPending}`.

---

## Invalidation: precision matters

```tsx
// all item lists and details
queryClient.invalidateQueries({ queryKey: ["items"] });

// just one item
queryClient.invalidateQueries({ queryKey: ["items", 42] });
```

Too broad an invalidation — extra traffic to `:8090`. Too narrow — a stale sidebar.

---

## FastAPI errors

A 422 validation error → your `api()` throws → `mutation.error.message`. Show it to the user; don't do an optimistic rollback if there was no optimistic update to begin with.

---

## Connection to the lab

Full CRUD: [22-lab-query.md](22-lab-query.md). Router for the edit page: [25-lab-router.md](25-lab-router.md). Auth on POST — react-intermediate.

Stand: [deploy/fastapi](../../deploy/fastapi/README.md), `:8090`.

---

## Common mistakes

1. **Forgetting to invalidate** — the list doesn't update after a POST.

2. **Optimistic update without a snapshot** — nothing to roll back to.

3. **Not calling cancelQueries in onMutate** — a refetch overwrites the optimistic update.

4. **Duplication: mutate + manually setState-ing the catalog** — keep one source of truth: the Query cache.

5. **Invalidating in onSuccess without onSettled** — on error, the optimistic cache stays out of sync.

6. **Calling `mutate` during render** — infinite loop; only call it in handlers.

---

## Summary

`useMutation` performs writes to the shop API. After success, `invalidateQueries` keeps the list in sync. Optimistic flow: `onMutate` patches the cache, `onError` rolls it back, `onSettled` reconciles with the server. The `isPending`/`isError` flags drive forms and buttons. The POST/DELETE contract lives in the Swagger docs at `:8090/docs`.

---

## Checklist

- How does a mutation differ from a query?
- Why call `invalidateQueries` after a POST?
- What are the steps of an optimistic delete?
- When is `mutateAsync` better than `mutate`?
- What does DELETE return on a 204?
- How do you roll back the UI on a failed mutation?

Next lesson: [22. Lab: CRUD with Query](22-lab-query.md).
