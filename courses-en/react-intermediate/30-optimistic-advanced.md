# 30. Optimistic UI: advanced patterns

## A story from work

The catalog manager complains: "When I turn a product off, the checkbox comes back for a second, then disappears again. Looks broken." You check the Network tab: PATCH takes 200 ms, but the UI is waiting for the response. Product owner: "Make it like Notion — instant, but if the server fails, roll back and show a toast."

In [react-basic/21-mutations.md](../react-basic/21-mutations.md) you saw a basic optimistic toggle. Here we cover **production patterns**: cache snapshots, rollback, conflicts, lists + detail, idempotency, and UX boundaries.

## What you'll learn

- When optimistic updates are worth it, and when they hurt
- `onMutate` → cancel queries → snapshot → setQueryData
- Rollback in `onError`, reconcile in `onSettled`
- Optimistic updates on **paginated lists** and **nested cache**
- UI indicators: pending, error, "syncing…"

---

## When optimistic UI makes sense

| Scenario | Optimistic? | Why |
|----------|-------------|--------|
| Toggling `is_active` | Yes | Low risk, easy rollback |
| Renaming a title inline | Yes | User expects instant feedback |
| Deleting a row | With caution | Undo is harder; confirm + optimistic remove is fine |
| Create with server-generated id | Partially | Temp id / placeholder row |
| Payment / irreversible action | **No** | Wait for server truth |
| Complex validation | **No** | Server is the judge |

**Rule of thumb:** go optimistic where **user intent is obvious** and **rollback is clear**.

---

## Basic TanStack Query v5 pattern

```tsx
const toggleActive = useMutation({
  mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
    patchProduct(id, { is_active }),

  onMutate: async ({ id, is_active }) => {
    await queryClient.cancelQueries({ queryKey: productKeys.lists() });

    const previousLists = queryClient.getQueriesData<Paginated<Product>>({
      queryKey: productKeys.all,
    });

    queryClient.setQueriesData<Paginated<Product>>(
      { queryKey: productKeys.all },
      (old) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((p) =>
            p.id === id ? { ...p, is_active } : p,
          ),
        };
      },
    );

    return { previousLists };
  },

  onError: (_err, _vars, context) => {
    context?.previousLists.forEach(([key, data]) => {
      queryClient.setQueryData(key, data);
    });
    toast.error("Failed to save. Changes reverted.");
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.all });
  },
});
```

**Order matters:**

1. `cancelQueries` — so an in-flight fetch doesn't overwrite the optimistic update.
2. Snapshot **all** affected keys (list params, detail).
3. `setQueryData` — instant UI update.
4. `onError` — restore the snapshot.
5. `onSettled` + invalidate — eventual consistency with the server.

---

## Detail + list — two cache entries

A toggle on the list page **and** an open detail view at `/products/42` need to stay in sync:

```tsx
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: productKeys.all });

  const prevList = queryClient.getQueryData(productKeys.list(tableParams));
  const prevDetail = queryClient.getQueryData(productKeys.detail(vars.id));

  queryClient.setQueryData(productKeys.detail(vars.id), (old: Product | undefined) =>
    old ? { ...old, is_active: vars.is_active } : old,
  );

  // ... patch the list as shown above

  return { prevList, prevDetail, tableParams };
},
```

Without updating the detail cache, a user on the detail page sees a stale toggle after an action taken on the list (or vice versa).

---

## Optimistic delete

```tsx
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: productKeys.lists() });
  const snapshot = queryClient.getQueryData(productKeys.list(params));

  queryClient.setQueryData(productKeys.list(params), (old: Paginated<Product> | undefined) => {
    if (!old) return old;
    return {
      ...old,
      count: old.count - 1,
      results: old.results.filter((p) => p.id !== id),
    };
  });

  return { snapshot, params };
},
```

**UX:** the row disappears immediately; on a 403/500 it comes back + a toast is shown. Optional: a 5-second undo bar (client-only restore before invalidation).

---

## Optimistic create — temporary id

The server assigns the `id`. Pattern:

```tsx
onMutate: async (newProduct) => {
  const tempId = -Date.now();
  const optimistic: Product = {
    ...newProduct,
    id: tempId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  queryClient.setQueryData(productKeys.list(params), (old) =>
    old
      ? { ...old, count: old.count + 1, results: [optimistic, ...old.results] }
      : old,
  );

  return { tempId, params };
},

onSuccess: (serverProduct, _vars, ctx) => {
  queryClient.setQueryData(productKeys.list(ctx!.params), (old) =>
    old
      ? {
          ...old,
          results: old.results.map((p) =>
            p.id === ctx!.tempId ? serverProduct : p,
          ),
        }
      : old,
  );
},
```

The row can show a "Saving…" badge while `id < 0`.

---

## Conflicts and stale optimistic state

Two tabs: tab A toggles off, tab B toggles on. **Last write wins** on the server; the client finds out on invalidate/refetch.

Mitigations:

- Send `updated_at` in the PATCH — the server returns a 409 conflict (requires backend support).
- A short `staleTime` on the detail query after a mutation.
- WebSocket / polling — overkill for an admin catalog.

For an interview, it's enough to say: "Optimistic updates are for UX; invalidation is the source of truth."

---

## UI feedback

```tsx
function ActiveToggle({ product }: { product: Product }) {
  const mutation = useToggleActive();

  return (
    <button
      type="button"
      aria-pressed={product.is_active}
      aria-busy={mutation.isPending}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ id: product.id, is_active: !product.is_active })
      }
    >
      {product.is_active ? "Active" : "Inactive"}
    </button>
  );
}
```

Don't block the whole table — only the row/button. Use `aria-busy` for screen readers.

---

## MSW for testing rollback

In [25-msw-handlers.md](25-msw-handlers.md), add this scenario:

```tsx
http.patch("/api/v1/products/:id/", async () => {
  await delay(800);
  return HttpResponse.json({ detail: "Server error" }, { status: 500 });
}),
```

Verify: toggle → instant UI → after 800ms, rollback + toast.

---

## Lab (short version)

1. Optimistic `is_active` toggle in the table.
2. Sync the detail page cache.
3. Optimistic delete with a confirm dialog.
4. MSW error scenario → rollback.

**Success criterion:** on a 500, the toggle returns to its original state without a manual refresh.

---

## Common mistakes

1. **Optimistic update without a snapshot** — rollback is impossible.

2. **Forgetting cancelQueries** — race condition: a fetch overwrites the optimistic update.

3. **Only invalidate, no setQueryData** — this isn't really "optimistic" UX, just a fast refetch.

4. **Optimistic create without replacing the temp id** — duplicate rows after success.

5. **Calling mutate during render** — only from event handlers.

6. **A global loading overlay** on every toggle — makes the table unusable.

---

## Checklist

- [ ] Decided which actions are optimistic (toggle, delete, not payment)
- [ ] onMutate: cancel + snapshot + setQueryData
- [ ] onError: restore + user message
- [ ] onSettled: invalidate for server truth
- [ ] List and detail caches update consistently
- [ ] MSW error path tested manually

---

[← 29-admin-table](29-admin-table.md) · [31-lab-crud →](31-lab-crud.md)
