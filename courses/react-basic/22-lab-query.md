# 22. Лаба: CRUD через TanStack Query

## Сценарий

Ticket **SHOP-201**: «Админ-минимум в SPA — список, добавление, удаление с optimistic UI». Backend FastAPI `:8090` уже поддерживает CRUD по `/api/v1/items`. Вы заменяете ручной fetch из [19-lab-fetch-items.md](19-lab-fetch-items.md) на **Query + mutations** ([20-tanstack-query.md](20-tanstack-query.md), [21-mutations.md](21-mutations.md)).

**Время:** ~55–70 минут.

---

## Подготовка

```bash
# API
cd deploy/fastapi && docker compose up -d --build

# React
cd courses/react-basic/examples
npm install
```

В `main.tsx` — `QueryClientProvider` ([20-tanstack-query.md](20-tanstack-query.md)).

Структура:

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

## Задание 1. `useItems`

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

## Задание 2. `ItemsQueryList`

- `useItems()`;
- `isPending` → loading;
- `isError` → error + `refetch()`;
- `data.length === 0` → empty;
- каждая строка: name, price, `ItemRowActions`.

Покажите `isFetching && !isPending` как «Обновление…».

---

## Задание 3. `CreateItemForm`

Поля: `name` (required), `price` (number > 0), `description` (optional).

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

После успеха — очистить форму (`e.currentTarget.reset()`). Кнопка disabled при `isPending`.

---

## Задание 4. Optimistic delete — `useDeleteItem`

Реализуйте по шаблону из [21-mutations.md](21-mutations.md):

- `onMutate`: cancel, snapshot `["items"]`, filter by id;
- `onError`: restore snapshot;
- `onSettled`: invalidate.

`ItemRowActions`:

```tsx
<button type="button" onClick={() => deleteItem.mutate(item.id)}>
  Удалить
</button>
```

---

## Задание 5. `QueryCrudLab`

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

Подключите в `App.tsx`.

---

## Проверка

| Действие | Ожидание |
|----------|----------|
| Открыть lab | один запрос items (Network) |
| Открыть вторую вкладку с тем же lab | staleTime — возможно без refetch 30s |
| POST новый товар | список обновился без F5 |
| DELETE | строка исчезла сразу; при stop API + delete — rollback + error |
| DevTools Query | ключ `["items"]`, stale/fresh |

Два компонента `useItems()` на странице — **один** network request (dedupe).

---

## Задание 6. (Опционально) PATCH цены

Inline edit цены → `useMutation` PATCH `/api/v1/items/{id}` + invalidate.

---

## Критерии успеха

- [ ] QueryClientProvider в дереве
- [ ] List через `useQuery`, не useEffect
- [ ] POST + invalidate
- [ ] DELETE optimistic + rollback
- [ ] UI: pending/error на форме и кнопках
- [ ] `npm run typecheck` OK

---

## Типичные ошибки в лабе

1. **Provider забыт** — runtime error QueryClient.

2. **Optimistic без cancelQueries** — список «мигает» после delete.

3. **POST без Content-Type** — 422 от FastAPI.

4. **invalidate с неверным key** — `['item']` vs `['items']`.

5. **Два fetch: старый ItemsList + Query** — удалите legacy effect.

---

## Связь с курсом

- Queries: [20-tanstack-query.md](20-tanstack-query.md)
- Mutations: [21-mutations.md](21-mutations.md)
- Router для edit route: [25-lab-router.md](25-lab-router.md)
- URL filters: [26-url-state.md](26-url-state.md)

---

## Резюме лабы

Shop SPA управляет каталогом через server state Query: чтение с кэшем, запись с invalidation, удаление с optimistic UX. Паттерн масштабируется на capstone [38-capstone.md](38-capstone.md).

---

## Чек-лист перед сдачей

- Сколько запросов GET items при двух `useItems()`?
- Что делает onSettled после failed delete?
- Как Swagger подскажет body POST?
- Готовы ли убрать ручной fetch из [19-lab-fetch-items.md](19-lab-fetch-items.md)?

Следующий урок: [23. React Router](23-react-router.md).
