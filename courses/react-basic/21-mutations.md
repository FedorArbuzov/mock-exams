# 21. Mutations: изменение данных на сервере

## Сценарий с работы

Админ shop добавляет товар через форму POST `/api/v1/items`. После успеха список на главной **устарел** — нужен ручной refetch или перезагрузка страницы. Удаление товара: UI ждёт ответ 800 ms без feedback. Product: «После Save список обновляется сам; Delete — строка исчезает сразу, откат если API упал».

**`useMutation`** — запись на сервер (POST/PUT/PATCH/DELETE). **`invalidateQueries`** — сброс stale кэша и refetch списка. **Optimistic update** — UI раньше ответа, rollback при ошибке.

## Что вы узнаете

- `useMutation`, `mutate`, `mutateAsync`
- `onSuccess` → `invalidateQueries`
- Optimistic updates через `onMutate` / rollback
- Связь мутаций shop CRUD с `:8090`

---

## Query vs Mutation

| | Query | Mutation |
|---|-------|----------|
| HTTP | GET (обычно) | POST, PUT, PATCH, DELETE |
| Hook | `useQuery` | `useMutation` |
| Кэш | читает, кэширует | **меняет** server + invalidates |

Не используйте `useQuery` для POST.

---

## Создание товара

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
      {/* поля name, price, description */}
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Сохранение…" : "Добавить"}
      </button>
      {createMutation.isError && (
        <p role="alert">{createMutation.error.message}</p>
      )}
    </form>
  );
}
```

`invalidateQueries({ queryKey: ["items"] })` помечает все queries с префиксом `["items"]` stale и refetch активных ([20-tanstack-query.md](20-tanstack-query.md)).

---

## `mutate` vs `mutateAsync`

```tsx
// fire-and-forget + callbacks на mutation
createMutation.mutate(data);

// await в async handler
try {
  const item = await createMutation.mutateAsync(data);
  navigate(`/items/${item.id}`);
} catch {
  // isError на mutation
}
```

---

## Удаление с invalidation

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
  Удалить
</button>
```

FastAPI может вернуть 204 — ваш `api()` уже обрабатывает ([17-fetch-react.md](17-fetch-react.md)).

---

## Optimistic update

UX: строка исчезает **до** ответа DELETE; при 500 — возвращаем.

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

| Шаг | Действие |
|-----|----------|
| `onMutate` | cancel in-flight, snapshot, optimistic patch |
| `onError` | rollback из context |
| `onSettled` | sync с server через invalidate |

Optimistic — для **понятных** операций; для POST create чаще достаточно invalidation без fake id.

---

## Обновление (PATCH)

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

## Состояния mutation в UI

```tsx
createMutation.isPending   // in flight
createMutation.isError
createMutation.isSuccess   // последний вызов успешен (сброс через reset)
createMutation.failureCount
```

Блокируйте двойной submit через `disabled={isPending}`.

---

## Invalidation: точность

```tsx
// все списки и детали items
queryClient.invalidateQueries({ queryKey: ["items"] });

// только один товар
queryClient.invalidateQueries({ queryKey: ["items", 42] });
```

Слишком широкая invalidation — лишний трафик на `:8090`. Слишком узкая — устаревший sidebar.

---

## Ошибки FastAPI

422 validation → ваш `api()` throw → `mutation.error.message`. Покажите пользователю; не делайте optimistic rollback если optimistic не было.

---

## Связь с лабой

Полный CRUD: [22-lab-query.md](22-lab-query.md). Router для edit page: [25-lab-router.md](25-lab-router.md). Auth на POST — react-intermediate.

Стенд: [deploy/fastapi](../../deploy/fastapi/README.md), `:8090`.

---

## Типичные ошибки

1. **Забыли invalidate** — список не обновляется после POST.

2. **Optimistic без snapshot** — нечем rollback.

3. **Не cancelQueries в onMutate** — refetch перезапишет optimistic.

4. **Дублирование: mutate + ручной setState catalog** — один источник: Query cache.

5. **invalidate в onSuccess без onSettled** — при error optimistic cache рассинхрон.

6. **`mutate` в render** — бесконечный loop; только в handlers.

---

## Резюме

`useMutation` выполняет изменения shop API. После успеха — `invalidateQueries` для синхронизации списка. Optimistic: `onMutate` патчит кэш, `onError` откатывает, `onSettled` сверяет с server. Флаги `isPending`/`isError` питают формы и кнопки. Контракт POST/DELETE — Swagger `:8090/docs`.

---

## Чек-лист

- Чем mutation отличается от query?
- Зачем `invalidateQueries` после POST?
- Какие шаги optimistic delete?
- Когда `mutateAsync` лучше `mutate`?
- Что вернёт DELETE при 204?
- Как откатить UI при failed mutation?

Следующий урок: [22. Лаба: CRUD через Query](22-lab-query.md).
