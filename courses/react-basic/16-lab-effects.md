# 16. Лаба: поиск с debounce

## Сценарий

Product owner: «Поиск по каталогу не должен бить API на каждую букву — как у крупных shop, задержка 300 ms». Вы уже знаете [15-effect-patterns.md](15-effect-patterns.md): debounce через `useEffect` + `clearTimeout`. В этой лабе соберёте **SearchBar** и **CatalogPreview**: локальный ввод мгновенный, «официальный» поисковый запрос — с задержкой. Пока без FastAPI — фильтруем мок-массив; паттерн переносится на `:8090` в [19-lab-fetch-items.md](19-lab-fetch-items.md).

**Время:** ~45–60 минут.  
**Где код:** [`examples/src/`](examples/src/).

---

## Подготовка

```bash
cd courses/react-basic/examples
npm install
npm run dev   # http://localhost:5173
```

Создайте файлы:

```text
src/
  components/
    SearchBar.tsx
    CatalogPreview.tsx
  data/
    mockItems.ts
  lab/
    DebouncedSearchLab.tsx
```

Подключите лабу в `App.tsx` (временно):

```tsx
import { DebouncedSearchLab } from "./lab/DebouncedSearchLab";

export function App() {
  return <DebouncedSearchLab />;
}
```

---

## Задание 1. Мок-данные `mockItems.ts`

```tsx
export type ShopItem = {
  id: number;
  name: string;
  category: string;
  price: number;
};

export const MOCK_ITEMS: ShopItem[] = [
  { id: 1, name: "Mechanical Keyboard", category: "peripherals", price: 79.99 },
  { id: 2, name: "USB-C Hub", category: "accessories", price: 49.0 },
  { id: 3, name: "27\" Monitor", category: "displays", price: 299.0 },
  { id: 4, name: "Wireless Mouse", category: "peripherals", price: 39.5 },
  { id: 5, name: "Laptop Stand", category: "accessories", price: 59.0 },
];
```

---

## Задание 2. `SearchBar` — controlled input + debounce

Props:

```tsx
type SearchBarProps = {
  onDebouncedChange: (query: string) => void;
  delayMs?: number;
};
```

Требования:

- локальный `query` обновляется **сразу** при вводе;
- `onDebouncedChange` вызывается через `delayMs` (по умолчанию **300**) после последнего изменения;
- при размонтировании или новом символе — **отмена** предыдущего таймера (`clearTimeout` в cleanup);
- placeholder: «Поиск по каталогу…».

### Шаблон

```tsx
import { useEffect, useState } from "react";

export function SearchBar({ onDebouncedChange, delayMs = 300 }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDebouncedChange(query.trim());
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs, onDebouncedChange]);

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Поиск по каталогу…"
      aria-label="Поиск"
    />
  );
}
```

Оберните `onDebouncedChange` в `useCallback` в родителе, если видите лишние срабатывания effect.

---

## Задание 3. `CatalogPreview`

Показывает:

- строку «Debounced query: …» (актуальное значение **после** debounce);
- счётчик «Запросов фильтрации: N» — инкремент при каждом debounced изменении;
- список товаров, где `name` содержит query **без учёта регистра** (пустой query — все товары).

```tsx
function filterItems(items: ShopItem[], q: string) {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lower));
}
```

---

## Задание 4. `DebouncedSearchLab`

Соберите страницу:

```tsx
export function DebouncedSearchLab() {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchCount, setSearchCount] = useState(0);

  const handleDebounced = useCallback((q: string) => {
    setDebouncedQuery(q);
    setSearchCount((n) => n + 1);
  }, []);

  const visible = useMemo(
    () => filterItems(MOCK_ITEMS, debouncedQuery),
    [debouncedQuery],
  );

  return (
    <main>
      <h1>Debounced search</h1>
      <SearchBar onDebouncedChange={handleDebounced} />
      <p>Debounced query: «{debouncedQuery}»</p>
      <p>Запросов фильтрации: {searchCount}</p>
      <ul>
        {visible.map((item) => (
          <li key={item.id}>{item.name} — {item.price} €</li>
        ))}
      </ul>
    </main>
  );
}
```

---

## Проверка

1. Быстро введите `keyboard` — **searchCount** должен вырасти на **1** (не 8).
2. Стереть поле — debounced query `""`, снова все 5 товаров.
3. React Strict Mode: searchCount не должен «удваиваться» из-за отсутствия cleanup (если удваивается только в dev при remount — обсудите [14-useEffect.md](14-useEffect.md)).
4. (Опционально) `console.log` внутри debounced callback — одна строка на паузу ввода.

---

## Задание 5. (Опционально) Custom hook `useDebouncedValue`

Вынесите debounce в `src/hooks/useDebouncedValue.ts`:

```tsx
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
```

`SearchBar` упрощается до `const debounced = useDebouncedValue(query)` + effect на `debounced`. Полная версия — [28-custom-hooks.md](28-custom-hooks.md).

---

## Критерии успеха

- [ ] Ввод в поле отзывчивый, фильтрация — с задержкой
- [ ] Cleanup таймера в `SearchBar`
- [ ] Быстрый набор не inflates `searchCount`
- [ ] Пустой query показывает полный список
- [ ] TypeScript без ошибок: `npm run typecheck`

---

## Типичные ошибки в лабе

1. **Debounce в `onChange` без effect** — вызываете API/фильтр сразу.

2. **Забыли `clearTimeout`** — несколько pending callback.

3. **Debounce и локальный query в одном state** — input «лагает».

4. **`onDebouncedChange` inline в JSX** — effect перезапускается каждый render.

5. **Фильтрация по `query` вместо debounced** — смысл лабы теряется.

---

## Связь с курсом

- Effect basics: [14-useEffect.md](14-useEffect.md)
- Patterns: [15-effect-patterns.md](15-effect-patterns.md)
- API search: [19-lab-fetch-items.md](19-lab-fetch-items.md), `:8090`
- Query + URL: [26-url-state.md](26-url-state.md)

---

## Резюме лабы

Вы разделили **мгновенный UI** (controlled input) и **отложенный side effect** (debounced query). Cleanup гарантирует один «финальный» запрос на серию нажатий клавиш — фундамент live-search shop без DDoS собственного FastAPI.

---

## Чек-лист перед сдачей

- Где в коде cleanup?
- Что будет без debounce при 10 символах?
- Как перенести debounced query в `fetch('/api/v1/items?q=...')`?
- Зачем `useCallback` для `handleDebounced`?

Следующий урок: [17. fetch в React](17-fetch-react.md).
