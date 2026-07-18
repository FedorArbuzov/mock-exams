# 19. Лаба: список товаров с API

## Сценарий

Ticket **SHOP-142**: «Подключить каталог к FastAPI, показать loading/error/empty». Backend на `:8090` уже отдаёт JSON — ваша задача в React: `fetch` через proxy, типы, UI-состояния из [17-fetch-react.md](17-fetch-react.md). Debounced search из [16-lab-effects.md](16-lab-effects.md) пока **не** обязателен — статический список; фильтр добавите в [26-url-state.md](26-url-state.md).

**Время:** ~50–65 минут.  
**Стенд:** [deploy/fastapi](../../deploy/fastapi/README.md) обязателен.

---

## Подготовка

Терминал 1 — API:

```bash
cd deploy/fastapi
docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Терминал 2 — React:

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Убедитесь, что proxy в [`vite.config.ts`](examples/vite.config.ts) ведёт `/api` → `:8090`.

Структура:

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

## Задание 1. Типы `api/types.ts`

```tsx
export type Item = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
};
```

Сверьте поля с [http://localhost:8090/docs](http://localhost:8090/docs). При расхождении — подстройте тип (опционально Zod в [34-lab-typescript.md](34-lab-typescript.md)).

---

## Задание 2. Клиент `api/client.ts`

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

Путь **только** `/api/...`, не `http://localhost:8090/...` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Задание 3. `ItemRow`

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

## Задание 4. `ItemsList`

Требования:

- state-машина: `loading` | `error` | `success`;
- `useEffect` + `api<Item[]>('/api/v1/items')` + `AbortController`;
- UI: loading текст, error с кнопкой **Повторить** (increment retry state), empty «Каталог пуст», список через `ItemRow`;
- `key={item.id}`.

### Каркас

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
          message: err instanceof Error ? err.message : "Ошибка загрузки",
        });
      });

    return () => controller.abort();
  }, [retry]);

  // TODO: ветки render
}
```

---

## Задание 5. `FetchItemsLab` и `App`

```tsx
export function FetchItemsLab() {
  return (
    <main className="app">
      <h1>Shop — каталог (API)</h1>
      <ItemsList />
    </main>
  );
}
```

Подключите в `App.tsx`.

---

## Проверка

| Шаг | Ожидание |
|-----|----------|
| API up, refresh страницы | список Demo-товаров |
| `docker compose stop` API, retry | error + кнопка работает после start |
| DevTools Network | запрос на `localhost:5173/api/v1/items`, status 200 |
| `npm run typecheck` | без ошибок |

(Опционально) Остановите API **во время** loading — не должно быть uncaught exception после unmount.

---

## Задание 6. (Опционально) Один товар

`GET /api/v1/items/1` в отдельном `ItemDetail` — заготовка для [25-lab-router.md](25-lab-router.md).

---

## Критерии успеха

- [ ] Данные с реального `:8090` через proxy
- [ ] loading / error / empty / list
- [ ] Retry без F5
- [ ] Abort при unmount
- [ ] TypeScript strict OK

---

## Типичные ошибки в лабе

1. **Absolute URL на 8090** — CORS в браузере.

2. **Нет `res.ok` в client** — уже в `api()`, не дублируйте сырой fetch без проверки.

3. **Начальный `items: []` без loading** — flash «пусто».

4. **Забыли поднять docker** — «Failed to fetch» / 502 proxy.

5. **Неверный key** — index вместо `item.id` ([07-lists-keys.md](07-lists-keys.md)).

---

## Связь с курсом

- fetch UI: [17-fetch-react.md](17-fetch-react.md)
- CORS/proxy: [18-cors-fastapi.md](18-cors-fastapi.md)
- Query refactor: [20-tanstack-query.md](20-tanstack-query.md)
- Router detail: [25-lab-router.md](25-lab-router.md)

---

## Резюме лабы

Вы связали Vite SPA shop с FastAPI каталогом: типизированный клиент, effect с abort, четыре UI-состояния. Это эталон до миграции на TanStack Query — тот же контракт `/api/v1/items`, меньше boilerplate.

---

## Чек-лист перед сдачей

- Почему URL начинается с `/api`?
- Что вернёт API при stop контейнера?
- Где abort cleanup?
- Готовы ли описать Item type по OpenAPI?

Следующий урок: [20. TanStack Query](20-tanstack-query.md).
