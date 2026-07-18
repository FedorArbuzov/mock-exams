# 27. useRef, useMemo, useCallback: когда и зачем

## Введение: «Почему input теряет фокус после каждого символа?»

Code review на shop-каталоге. Коллега вынес поле поиска в отдельный компонент `SearchField`, но родитель при каждом `onChange` пересоздаёт inline-функцию и передаёт её вниз. Ревьюер пишет: «Добавь `useCallback`». Вы добавляете — фокус всё равно пропадает. Причина оказывается в другом: родитель при каждом keystroke меняет `key` у `SearchField`, и React **размонтирует** старый input и монтирует новый.

Три hook'а из этой главы — **инструменты**, а не «ускорители по умолчанию». `useRef` — ссылка на DOM и mutable box без re-render. `useMemo` и `useCallback` — **мемоизация** вычислений и функций, когда есть измеримая причина (тяжёлый фильтр 10 000 товаров, `React.memo` на дочернем компоненте, стабильная ссылка для `useEffect`).

После [`useState`](09-useState.md) и [`useEffect`](14-useEffect.md) вы управляете state и side effects. Эта глава закрывает пробел: **императивный DOM**, **производительность без преждевременной оптимизации**, связь с [TanStack Query](20-tanstack-query.md) (кэш уже мемоизирует данные — не дублируйте логику).

## Что вы узнаете

- **`useRef`**: доступ к DOM, focus, scroll, хранение timer id без re-render.
- **`useMemo`**: дорогие вычисления (фильтр каталога, агрегация корзины).
- **`useCallback`**: стабильные ссылки на функции для memo-компонентов и effect deps.
- **Когда НЕ использовать** мемоизацию — правило «measure first».
- Связь с shop UI: поиск по `GET /api/v1/items`, debounce из [16-lab-effects.md](16-lab-effects.md).

---

## useRef: mutable box и DOM

### Сценарий: автофокус на поле поиска каталога

После перехода на `/catalog` пользователь ожидает сразу печатать запрос. Controlled input из [10-events-controlled.md](10-events-controlled.md) не требует ref для значения — но **фокус** нужно выставить императивно:

```tsx
import { useRef, useEffect } from "react";

function CatalogSearch({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Поиск по mock-exams shop…"
      aria-label="Поиск товаров"
    />
  );
}
```

**`ref={inputRef}`** — React после commit записывает DOM-узел в `inputRef.current`. `useEffect` с `[]` — после первого paint, без блокировки render.

### Ref не вызывает re-render

```tsx
const renderCount = useRef(0);
renderCount.current += 1; // изменение .current — React не перерисовывает
```

Используйте для:
- id таймера debounce ([16-lab-effects.md](16-lab-effects.md));
- «предыдущее значение» prop для сравнения;
- флаг «компонент ещё смонтирован» (осторожно — prefer AbortController для fetch).

**Не храните в ref то, что должно отображаться в UI** — для этого `useState`.

### Forwarding ref (обзор)

UI-kit кнопки/инпуты часто оборачивают в `forwardRef`, чтобы родитель мог вызвать `.focus()`. В react-intermediate — подробнее; сейчас достаточно знать: ref на ваш компонент без `forwardRef` не попадёт во внутренний `<input>`.

---

## useMemo: кэш результата вычисления

### Сценарий: фильтр 5000 товаров на клиенте

FastAPI `:8090` отдаёт список; до пагинации на сервере ([api-design](../api-design/README.md)) фильтрация может жить в браузере:

```tsx
import { useMemo, useState } from "react";

type Item = { id: number; title: string; description: string };

function CatalogList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </>
  );
}
```

**Зависимости** — как у `useEffect`: при смене `items` или `query` фильтр пересчитывается; иначе возвращается закэшированный массив.

### Когда useMemo оправдан

| Ситуация | Да / Нет |
|----------|----------|
| Фильтр/сортировка тысяч элементов | Да |
| `items.map(x => x.price).reduce(...)` на каждый render при стабильных deps | Да |
| `const doubled = n * 2` | **Нет** — дешевле без memo |
| «На всякий случай» | **Нет** — усложняет deps и отладку |

**Правило:** сначала работающий код; профилируйте React DevTools Profiler ([36-devtools.md](36-devtools.md)); затем `useMemo`.

### useMemo и referential equality

Дочерний `MemoizedList` с `React.memo` сравнивает props **по ссылке**:

```tsx
const sorted = useMemo(
  () => [...items].sort((a, b) => a.title.localeCompare(b.title)),
  [items]
);
return <MemoizedList items={sorted} />;
```

Без `useMemo` `[...items].sort()` создаёт **новый массив** каждый render → memo бесполезен.

---

## useCallback: стабильная функция

`useCallback(fn, deps)` — это `useMemo(() => fn, deps)`: возвращает **ту же** функцию, пока deps не изменились.

### Сценарий: memo-карточка товара

```tsx
import { memo, useCallback, useState } from "react";

const ProductCard = memo(function ProductCard({
  item,
  onAdd,
}: {
  item: { id: number; title: string };
  onAdd: (id: number) => void;
}) {
  console.log("render", item.id);
  return (
    <article>
      <h3>{item.title}</h3>
      <button type="button" onClick={() => onAdd(item.id)}>
        В корзину
      </button>
    </article>
  );
});

function CatalogPage({ items }: { items: { id: number; title: string }[] }) {
  const [cartIds, setCartIds] = useState<number[]>([]);

  const handleAdd = useCallback((id: number) => {
    setCartIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  return items.map((item) => (
    <ProductCard key={item.id} item={item} onAdd={handleAdd} />
  ));
}
```

Без `useCallback` `handleAdd` — новая функция каждый render → `ProductCard` перерисовывается всегда, `memo` не помогает.

### useCallback для useEffect

```tsx
const loadItems = useCallback(async () => {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const data = await res.json();
  setItems(data.items);
}, []);

useEffect(() => {
  loadItems();
}, [loadItems]);
```

Если `loadItems` объявлена в теле без `useCallback`, effect будет срабатывать каждый render. **Альтернатива проще:** объявить async-логику **внутри** effect без выноса — см. [15-effect-patterns.md](15-effect-patterns.md).

### TanStack Query уже мемоизирует

Для данных с `:8090` prefer Query ([20-tanstack-query.md](20-tanstack-query.md)): `useQuery` даёт стабильные `data`, `refetch`, dedupe. Не оборачивайте `fetch` в `useMemo` поверх Query — дублирование.

---

## Сравнение трёх hooks

| Hook | Re-render при изменении | Типичное применение |
|------|-------------------------|---------------------|
| `useState` | да | UI state |
| `useRef` | нет (`.current`) | DOM, timers, mutable flags |
| `useMemo` | нет (до смены deps) | дорогой derived data |
| `useCallback` | нет (до смены deps) | stable fn для memo / effect |

```text
Пользователь печатает в поиске
       │
       ▼
  setQuery → re-render CatalogList
       │
       ├── useMemo пересчитывает filtered (если query/items изменились)
       ├── useCallback: handleAdd та же ссылка → ProductCard skip
       └── inputRef.current — тот же DOM-узел (фокус сохранён)
```

---

## Антипаттерны из code review

### 1. useCallback на каждый handler «для производительности»

```tsx
// Избыточно, если дети не memo и список < 100
const onClick = useCallback(() => setOpen(true), []);
```

### 2. useMemo с неполными deps

ESLint `react-hooks/exhaustive-deps` — ваш друг. Пропущенная dep → **устаревшие** данные в фильтре.

### 3. ref вместо state для UI

```tsx
// Плохо: изменили ref — счётчик на экране не обновится
countRef.current += 1;
```

### 4. Чтение ref.current во время render для логики UI

Ref может быть `null` до commit. Для условного рендера — state.

### 5. Менять key ради «сброса» формы

```tsx
<SearchField key={categoryId} /> // OK — смена категории, новый input
<SearchField key={query} />      // BAD — фокус теряется каждый символ
```

---

## Практический чеклист для shop-каталога

1. **Focus на search** — `useRef` + `useEffect` один раз при mount route.
2. **Debounce запроса к :8090** — timer id в `useRef`, логика в [16-lab-effects.md](16-lab-effects.md); Query — `enabled: debouncedQuery.length > 0`.
3. **Тяжёлый client-filter** — `useMemo` по `[items, filters]`.
4. **Список memo-карточек** — `useCallback` для `onAdd` / `onSelect`.
5. **Измерить** — Profiler до и после; если разницы нет — уберите memo.

---

## Типичные ошибки

**«useMemo/useCallback ускоряют React».** Они добавляют память и сравнение deps; ускоряют только при **узком** bottleneck.

**«ref.current синхронен с render».** После изменения state ref ещё старый до commit; effect — безопасное место для DOM.

**«Зависимости пустые [] для loadItems с props».** Stale closure — загрузите устаревший `shopId`. Укажите deps или Query key.

**«React.memo на всём дереве».** Сложнее отладка; memo на листьях списка — типичный компромисс.

---

## Резюме

- **`useRef`** — DOM, focus, mutable значения без re-render.
- **`useMemo`** — дорогие derived данные; стабильные ссылки на массивы/объекты для memo-детей.
- **`useCallback`** — стабильные колбэки для `React.memo` и аккуратных effect deps.
- **Не оптимизируйте заранее**; Query и keys в списках ([07-lists-keys.md](07-lists-keys.md)) часто важнее.
- Потеря фокуса — чаще **key/remount**, не отсутствие `useCallback`.

## Чек-лист

- [ ] Объясните разницу `useState` и `useRef` для timer id
- [ ] Когда `useMemo` для фильтра каталога оправдан
- [ ] Зачем `useCallback` при `React.memo` на `ProductCard`
- [ ] Почему Query заменяет ручной `useMemo` для fetch
- [ ] Назовите причину потери фокуса кроме «нет useCallback»

Следующий урок: [28. Custom hooks](28-custom-hooks.md).
