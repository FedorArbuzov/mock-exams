# 30. Optimistic UI: продвинутые паттерны

## Сценарий с работы

Менеджер каталога жалуется: «Когда я выключаю товар — галочка возвращается на секунду, потом снова гаснет. Выглядит сломанным». Вы смотрите Network: PATCH 200 ms, но UI ждёт ответа. Product owner: «Сделайте как в Notion — мгновенно, но если сервер отказал — откат и toast».

В [react-basic/21-mutations.md](../react-basic/21-mutations.md) вы видели базовый optimistic toggle. Здесь — **production patterns**: snapshot cache, rollback, конфликты, списки + detail, idempotency и UX границы.

## Что вы узнаете

- Когда optimistic оправдан, а когда вреден
- `onMutate` → cancel queries → snapshot → setQueryData
- Rollback в `onError`, reconcile в `onSettled`
- Optimistic на **paginated list** и **nested cache**
- UI indicators: pending, error, «syncing…»

---

## Когда optimistic UI уместен

| Сценарий | Optimistic? | Почему |
|----------|-------------|--------|
| Toggle `is_active` | Да | Низкий risk, легко rollback |
| Rename title в inline edit | Да | User expects instant |
| Delete row | Осторожно | Undo сложнее; confirm + optimistic remove OK |
| Create with server-generated id | Частично | Temp id / placeholder row |
| Payment / irreversible | **Нет** | Ждём server truth |
| Complex validation | **Нет** | Server — judge |

**Правило:** optimistic там, где **user intent очевidен** и **rollback понятен**.

---

## Базовый паттерн TanStack Query v5

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
    toast.error("Не удалось сохранить. Изменения отменены.");
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.all });
  },
});
```

**Порядок важен:**

1. `cancelQueries` — не перезаписать optimistic свежим in-flight fetch.
2. Snapshot **всех** затронутых keys (list params, detail).
3. `setQueryData` — мгновенный UI.
4. `onError` — restore snapshot.
5. `onSettled` + invalidate — eventual consistency с server.

---

## Detail + list — два cache entry

Toggle на list page **и** открытый detail `/products/42` должны совпасть:

```tsx
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: productKeys.all });

  const prevList = queryClient.getQueryData(productKeys.list(tableParams));
  const prevDetail = queryClient.getQueryData(productKeys.detail(vars.id));

  queryClient.setQueryData(productKeys.detail(vars.id), (old: Product | undefined) =>
    old ? { ...old, is_active: vars.is_active } : old,
  );

  // ... patch list как выше

  return { prevList, prevDetail, tableParams };
},
```

Без update detail — пользователь на detail видит stale toggle после action на list (или наоборот).

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

**UX:** row исчезает сразу; при 403/500 — row возвращается + toast. Optional: 5s undo bar (client-only restore до invalidate).

---

## Optimistic create — temporary id

Server assigns `id`. Pattern:

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

Row может показать «Сохранение…» badge пока `id < 0`.

---

## Конфликты и stale optimistic

Два таба: tab A toggle off, tab B toggle on. **Last write wins** на server; client learns on invalidate/refetch.

Mitigations:

- `updated_at` в PATCH — server returns 409 conflict (extension backend).
- Короткий `staleTime` на detail после mutation.
- WebSocket / polling — overkill для admin catalog.

На собесе достаточно: «Optimistic — UX; invalidate — source of truth».

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
      {product.is_active ? "Активен" : "Неактивен"}
    </button>
  );
}
```

Не блокируйте всю table — только row/button. `aria-busy` для screen readers.

---

## MSW для тестирования rollback

В [25-msw-handlers.md](25-msw-handlers.md) добавьте scenario:

```tsx
http.patch("/api/v1/products/:id/", async () => {
  await delay(800);
  return HttpResponse.json({ detail: "Server error" }, { status: 500 });
}),
```

Проверьте: toggle → instant UI → через 800ms rollback + toast.

---

## Лаба (кратко)

1. Optimistic `is_active` toggle в table.
2. Sync detail page cache.
3. Optimistic delete с confirm dialog.
4. MSW error scenario → rollback.

**Критерий:** при 500 toggle возвращается в исходное состояние без manual refresh.

---

## Типичные ошибки

1. **Optimistic без snapshot** — rollback невозможен.

2. **Забыли cancelQueries** — race: fetch перезаписывает optimistic.

3. **Только invalidate, без setQueryData** — UX не «optimistic», а просто fast refetch.

4. **Optimistic на create без replace temp id** — duplicate rows после success.

5. **Mutate в render** — только event handlers.

6. **Global loading overlay** на каждый toggle — table unusable.

---

## Чек-лист

- [ ] Решили, какие actions optimistic (toggle, delete, not payment)
- [ ] onMutate: cancel + snapshot + setQueryData
- [ ] onError: restore + user message
- [ ] onSettled: invalidate для server truth
- [ ] List + detail caches обновляются согласованно
- [ ] MSW error path протестирован вручную

---

[← 29-admin-table](29-admin-table.md) · [31-lab-crud →](31-lab-crud.md)
