# 17. `fetch` в React: loading, error, empty

## Сценарий с работы

Страница каталога shop при открытии должна показать товары с FastAPI `:8090`. Разработчик вызывает `fetch` в `useEffect`, но UI **мигает**: сначала «нет товаров», потом список. При 500 пользователь видит пустую страницу — ошибка только в консоли. QA воспроизводит: быстро переключить категорию — на экране товары **от прошлой** категории. Третий баг: забыли `response.ok` — в списке `{ "detail": "Not found" }` как «товар».

React не загружает данные сам. Паттерн **loading / error / success / empty** — обязательная часть UI к REST API. Эта глава — до TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)); понимание ручного fetch нужно для отладки и собеседований.

## Что вы узнаете

- State-машина загрузки в компоненте
- `useEffect` + `fetch` + `AbortController`
- Различие **network error**, **HTTP error**, **empty list**
- Обёртка `api()` и типизация ответа
- Почему Query заменит большую часть этого boilerplate

---

## Четыре состояния UI

| Состояние | Что показываем |
|-----------|----------------|
| **loading** | skeleton / spinner |
| **error** | сообщение + retry |
| **success + empty** | «Товаров не найдено» |
| **success + data** | список |

Не смешивайте «loading» и «empty»: пока `loading === true`, empty не показываем.

```tsx
type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: Item[] };
```

Discriminated union упрощает ветвление в JSX ([typescript-basic](../typescript-basic/README.md)).

---

## Базовый компонент `ItemsList`

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
        const message = err instanceof Error ? err.message : "Неизвестная ошибка";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p aria-busy="true">Загрузка каталога…</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert">
        <p>Не удалось загрузить товары: {state.message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Повторить
        </button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return <p>Каталог пуст.</p>;
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

URL `/api/v1/items` — через **Vite proxy** на `http://localhost:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Обёртка `api()` для shop

Единая точка для base path и ошибок (как в [29-fetch.md](../javascript-basic/29-fetch.md)):

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

// использование
const items = await api<Item[]>("/api/v1/items");
```

В production base URL может быть env (`import.meta.env.VITE_API_URL`).

---

## Retry без перезагрузки страницы

`window.location.reload()` — грубо. Лучше **key** или локальный `retryCount`:

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

// в error UI:
<button type="button" onClick={() => setRetry((n) => n + 1)}>
  Повторить
</button>
```

---

## Загрузка по параметру (категория)

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

  // render по state...
}
```

При смене `category` abort отменяет старый запрос — защита от гонки ([15-effect-patterns.md](15-effect-patterns.md)).

---

## `async` function внутри effect

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

Не делайте `useEffect(async () => { ... })` — effect должен возвращать cleanup, не Promise.

---

## Initial state и flash

Если `useState([])` и отдельный `loading` false — будет flash «пусто». Стартуйте с `{ status: "loading" }` или `loading: true`.

---

## Связь со стендом FastAPI

| Endpoint | Назначение |
|----------|------------|
| `GET /api/v1/items` | список товаров shop |
| `GET /api/v1/items/{id}` | карточка товара |
| `GET /health` | проверка стенда |

Запуск: [deploy/fastapi/README.md](../../deploy/fastapi/README.md). Swagger: [http://localhost:8090/docs](http://localhost:8090/docs).

Лаба с реальным API: [19-lab-fetch-items.md](19-lab-fetch-items.md).

---

## Путь к TanStack Query

Ручной код выше повторяется в каждом компоненте. Query даёт:

- кэш по `queryKey`;
- dedupe запросов;
- `isPending` / `isError` / `refetch`;
- invalidation после mutation ([21-mutations.md](21-mutations.md)).

Но **семантика** loading/error/empty остаётся той же в UI ([31-ui-states.md](31-ui-states.md)).

---

## Типичные ошибки

1. **fetch без `ok`** — ошибки FastAPI как данные.

2. **Нет abort** — setState после unmount, неверный порядок ответов.

3. **Flash empty** — начальный state как «успех с []».

4. **`useEffect(async () => ...)`** — некорректный cleanup.

5. **Один `error` string на всё приложение** — теряется контекст (какой запрос упал).

6. **Hardcode `http://localhost:8090` в prod build** — ломается CORS; используйте proxy или env.

---

## Резюме

Компонент с `fetch` управляет явной state-машиной: loading → success или error. Empty list — отдельная ветка success. Effect с `[deps]`, `AbortController` и проверкой `res.ok`. Обёртка `api()` унифицирует ошибки shop API. После освоения паттерна переходите на TanStack Query, сохраняя те же UI-состояния.

---

## Чек-лист

- Чем «empty catalog» отличается от «still loading»?
- Зачем `AbortController` при смене фильтра?
- Reject ли `fetch` на HTTP 404?
- Почему effect не async?
- Как повторить запрос без reload?
- Какой URL items API на стенде mock-exams?

Следующий урок: [18. CORS и FastAPI :8090](18-cors-fastapi.md).
