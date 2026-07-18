# 28. Custom hooks: вынос логики из компонентов

## Введение: «ProductPage на 400 строк — что делать?»

Тикет: «Refactor ProductPage». Компонент смешивает: загрузку `GET /api/v1/items/{id}`, управление количеством в корзине, debounced отзывы, переключение табов и три `useEffect`. Code review: «Extract custom hooks». Вы не уверены, **где** граница между hook и утилитой, и можно ли вызывать hook из `if (isAdmin)`.

Custom hook — **обычная функция**, имя с **`use`**, внутри которой вызываются другие hooks. Она не добавляет magic в React: это **переиспользуемый кусок логики state + effects**, который несколько компонентов shop SPA могут разделить без copy-paste.

Связь с курсом: после [27-ref-memo-callback.md](27-ref-memo-callback.md) вы знаете ref/memo; hooks из [09-useState.md](09-useState.md), [14-useEffect.md](14-useEffect.md), [20-tanstack-query.md](20-tanstack-query.md) — сырьё для extraction. Context ([29-context.md](29-context.md)) — другой уровень «глобальности»; custom hook — **композиция без Provider**.

## Что вы узнаете

- Когда выносить логику в custom hook vs обычную функцию.
- **Naming**: `useCart`, `useDebouncedValue`, `useMediaQuery`.
- **Rules of Hooks** — почему нельзя hook в `if` / цикле.
- Hook поверх `fetch` и TanStack Query к FastAPI `:8090`.
- Тестируемость и структура файлов ([35-project-structure.md](35-project-structure.md)).

---

## Анатомия custom hook

```tsx
// hooks/useDebouncedValue.ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

Использование в каталоге (продолжение [16-lab-effects.md](16-lab-effects.md)):

```tsx
function CatalogSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["items", { q: debouncedQuery }],
    queryFn: () => searchItems(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // ...
}
```

Компонент описывает **UI**; hook — **поведение и синхронизация**.

---

## Hook vs utility function

| | Custom hook | Utility (`formatPrice.ts`) |
|---|-------------|----------------------------|
| Вызывает React hooks | да | нет |
| Имя | `use*` | любое |
| Где вызывать | только в компоненте/hook | везде |
| Пример | `useCart()` | `formatPrice(19.99)` |

```tsx
// НЕ hook — чистая функция
export function buildItemsUrl(base: string, params: Record<string, string>) {
  const url = new URL(`${base}/api/v1/items`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// Hook — state + effect
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
```

---

## Правила hooks (Rules of Hooks)

React полагается на **порядок** вызовов hooks между renders.

### ✅ Можно

```tsx
function useItem(id: number | null) {
  const enabled = id != null;
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id!),
    enabled,
  });
}
```

Условие **внутри** hook или через `enabled` — OK. Hooks на top level функции `useItem`.

### ❌ Нельзя

```tsx
function Bad({ skip }: { skip: boolean }) {
  if (skip) {
    return null;
  }
  const [x, setX] = useState(0); // hooks после early return — нарушение
}
```

```tsx
items.forEach(() => {
  useState(0); // hook в цикле
});
```

```tsx
function notAHook() {
  useState(0); // hook вне компонента/custom hook
}
```

**ESLint `react-hooks/rules-of-hooks`** ловит большинство случаев.

### Почему это важно

React хранит state hooks в **массиве по индексу** вызова. Если один render вызвал 3 hooks, а следующий — 2, state «съедет» — баги уровня «корзина показывает тему».

---

## Паттерны для mock-exams shop

### 1. `useLocalStorage` — черновик фильтров

```tsx
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

Ключ вида `mock-exams-shop-filters` — переживает refresh на `/catalog`.

### 2. `useFetchItem` — обёртка над Query

```tsx
const API = "http://localhost:8090";

async function fetchItem(id: number) {
  const res = await fetch(`${API}/api/v1/items/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export function useFetchItem(id: number) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id),
  });
}
```

Единая точка для типов Item и обработки 404 — см. [17-fetch-react.md](17-fetch-react.md), [32-typescript-react.md](32-typescript-react.md).

### 3. `useToggle` — мелкий, но показательный

```tsx
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  const set = useCallback((v: boolean) => setOn(v), []);
  return { on, toggle, set };
}
```

Для модалки «Добавить товар» в admin-preview.

### 4. Композиция hooks

```tsx
export function useCatalogSearch() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const queryResult = useQuery({ /* ... */ });
  return { query, setQuery, debounced, ...queryResult };
}
```

**Не** вкладывайте 10 уровней без нужды — один «feature hook» на экран часто достаточен.

---

## Возвращаемое значение: объект vs tuple

```tsx
// Tuple — как useState, порядок фиксирован
return [value, setValue] as const;

// Object — именованные поля, проще расширять
return { items, isLoading, error, refetch };
```

Для публичных hooks проекта prefer **object** — добавление поля не ломает destructuring.

---

## Соглашения именования

| Имя | Смысл |
|-----|-------|
| `useCart` | domain state корзины |
| `useDebouncedValue` | generic, переиспользуемый |
| `useMediaQuery("(min-width: 768px)")` | подписка на matchMedia |
| `useItemsQuery` | явная связь с Query |

**Не** называйте `getItems` если внутри hooks — только `use*`.

Файлы: `src/hooks/useDebouncedValue.ts` — одна функция или связанная группа ([35-project-structure.md](35-project-structure.md)).

---

## Custom hook и Context

| Задача | Решение |
|--------|---------|
| Логика одного экрана | `useCatalogPage()` |
| Данные для половины дерева без prop drilling | Context + `useCart()` читает context ([30-lab-context.md](30-lab-context.md)) |
| Серверные данные | TanStack Query |

Hook **может** использовать `useContext` внутри — тогда `useCart` скрывает детали Provider.

```tsx
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
```

---

## Тестирование (preview)

Custom hook тестируют через **`@testing-library/react`** `renderHook` (курс [javascript-testing](../javascript-path.md)):

```tsx
const { result } = renderHook(() => useDebouncedValue("a", 100));
await waitFor(() => expect(result.current).toBe("a"));
```

Чистые utils — обычные unit-тесты без React.

---

## Рефакторинг ProductPage: пошагово

1. Выделите **блоки** с собственным state/effect: tabs, quantity, fetch.
2. Для каждого блока — функция `useX`, top-level hooks only.
3. Компонент: hooks в начале, затем early returns ([31-ui-states.md](31-ui-states.md)), затем JSX.
4. Перенесите типы Item в `types/item.ts`.
5. API URL — `src/api/client.ts` → `:8090`.

**Цель:** `ProductPage.tsx` < 120 строк, читается как оглавление.

---

## Типичные ошибки

**Hook вызывается условно** — см. Rules of Hooks.

**Hook делает слишком много** — «god hook» как god component; разбейте на `useItemDetails` + `useReviews`.

**Дублирование Query keys** — вынесите factory `itemKeys.detail(id)` рядом с hook.

**Side effect при каждом вызове utility** — `fetch` в `formatItem()` без hook/effect — гонки и двойные запросы.

**Забыли cleanup** в hook с subscribe/timer — утечки при unmount route ([15-effect-patterns.md](15-effect-patterns.md)).

---

## Резюме

Custom hooks — **переиспользуемая логика** React (state, effects, Query, context) с именем `use*`. Выносите повторяющиеся куски из shop-страниц, соблюдайте Rules of Hooks, отделяйте чистые функции от hooks. Следующий шаг для глобального state — [29-context.md](29-context.md).

## Чек-лист

- [ ] Отличие custom hook от utility function
- [ ] Три правила вызова hooks
- [ ] Пример `useDebouncedValue` для поиска по API
- [ ] Когда hook vs Context vs lifting state ([12-lifting-state.md](12-lifting-state.md))
- [ ] Где хранить hooks в структуре проекта

Следующий урок: [29. Context](29-context.md).
