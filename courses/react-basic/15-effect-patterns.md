# 15. Зависимости, cleanup и паттерны `useEffect`

## Сценарий с работы

Search в shop-каталоге шлёт запрос на FastAPI `:8090` **на каждый символ** — backend получает `k`, `ke`, `key`, `keyb`… Tech lead открывает Network tab и видит 40 запросов за секунду. Разработчик добавляет `useEffect` с `[query]`, но в effect читает **устаревший** `page` из closure — пагинация «застревает» на 1. Ещё один коллега ставит `fetch` в effect **без** отмены: пользователь быстро меняет фильтр, ответы приходят **не по порядку** и UI показывает чужой результат.

Эта глава — про **dependency array**, **cleanup**, **stale closures** и почему «fetch в effect» часто лучше заменить на TanStack Query или custom hook с debounce.

## Что вы узнаете

- Правила массива зависимостей и `exhaustive-deps`
- Cleanup для таймеров, подписок и **отмены fetch**
- Stale closure: почему effect «видит старые» значения
- Anti-patterns: fetch без guard, effect как event handler, derived state в effect
- Паттерн «sync props → local state» (осторожно)

---

## Dependency array: контракт с React

React сравнивает deps **поверхностно** (`Object.is`). Если хотя бы один элемент изменился — cleanup старый effect, затем новый setup.

```tsx
useEffect(() => {
  document.title = `Shop — ${category}`;
}, [category]);
```

**Все** значения из замыкания setup, которые могут измениться между render и должны влиять на effect, должны быть в deps:

```tsx
function ItemCounter({ itemId }: { itemId: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [itemId]); // при смене товара — новый интервал
}
```

Функциональный updater `setCount(c => c + 1)` **не** требует `count` в deps — актуальное значение даёт React.

---

## ESLint `react-hooks/exhaustive-deps`

Плагин подсказывает пропущенные deps. Отключать `// eslint-disable` — только с **комментарием почему**. Типичный легитимный случай — ref для «последнего значения без re-run» (продвинуто, [27-ref-memo-callback.md](27-ref-memo-callback.md)).

---

## Cleanup: таймеры и debounce

Debounced search **обязан** очищать предыдущий таймер:

```tsx
function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Поиск товаров…"
    />
  );
}
```

При быстром вводе cleanup отменяет «висящие» вызовы — остаётся только последний через 300 ms. Лаба: [16-lab-effects.md](16-lab-effects.md).

**Стабильный `onSearch`:** если родитель передаёт inline `(q) => ...` каждый render, effect перезапускается лишний раз. Оберните в `useCallback` ([27-ref-memo-callback.md](27-ref-memo-callback.md)) или поднимите debounce в custom hook ([28-custom-hooks.md](28-custom-hooks.md)).

---

## Stale closure

Effect «замораживает» значения на момент **последнего** запуска:

```tsx
function BrokenPagination() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch(`/api/v1/items?page=${page}`)
      .then((r) => r.json())
      .then(setItems);
  }, []); // BUG: page всегда 1 в effect
}
```

Исправление — добавить `page` в deps **или** functional pattern / Query.

Ещё пример — interval со stale state:

```tsx
// Плохо: count в closure устаревает
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // count = 0 навсегда

// Хорошо: functional updater или ref
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

См. [12-closures.md](../javascript-basic/12-closures.md) в javascript-basic.

---

## Fetch в effect: guard и AbortController

```tsx
type Item = { id: number; name: string; price: number };

function ItemList({ category }: { category: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ category });
        const res = await fetch(`/api/v1/items?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Item[] = await res.json();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cancelled) setError(err instanceof Error ? err.message : "Ошибка");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category]);

  if (loading) return <p>Загрузка…</p>;
  if (error) return <p role="alert">{error}</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

| Anti-pattern | Пробема |
|--------------|---------|
| fetch без `AbortController` | setState после unmount, гонка ответов |
| нет `res.ok` | 404 как «успех» ([29-fetch.md](../javascript-basic/29-fetch.md)) |
| effect без deps при props | данные не обновляются |
| дублирование fetch в render + effect | двойные запросы |

Proxy Vite `/api` → `:8090` — [18-cors-fastapi.md](18-cors-fastapi.md).

---

## Effect как «синхронизация props → state»

Иногда нужно **локальное** редактирование, сбрасываемое при смене `itemId`:

```tsx
function ItemEditor({ item }: { item: Item }) {
  const [draft, setDraft] = useState(item.name);

  useEffect(() => {
    setDraft(item.name);
  }, [item.id, item.name]);

  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
```

Это **controlled escape hatch**. Альтернатива — `key={item.id}` на компоненте, чтобы React remount и сбросил state. Не копируйте весь API-объект в effect без необходимости — риск лишних render.

---

## «Fetch on mount only» vs реактивность

```tsx
// Только mount — данные устареют при смене shopId
useEffect(() => { loadItems(shopId); }, []);

// Реактивно — правильно для shopId из props
useEffect(() => { loadItems(shopId); }, [shopId]);
```

Для CRUD и кэша — **TanStack Query** ([20-tanstack-query.md](20-tanstack-query.md)) вместо ручного boilerplate.

---

## Разделение ответственности

```text
User input (instant)  →  useState + onChange
Debounced side effect →  useEffect + cleanup
Server data           →  useQuery (позже) или effect + abort
User action (click)   →  event handler, не effect
```

---

## Типичные ошибки

1. **Пустой `[]` при использовании props/state** — stale data и stale closure.

2. **Объект/массив в deps без мемоизации** — `{ filter }` новый каждый render → effect каждый раз.

3. **Нет cleanup у setTimeout** — debounce не работает, шторм запросов на `:8090`.

4. **setState на unmounted component** — warning; нужен abort или flag `cancelled`.

5. **Effect вместо `useMemo`** — производное значение через `setState` в effect → лишний render.

6. **Два effect на одну задачу** — объедините или вынесите в hook.

---

## Резюме

Массив зависимостей — явный контракт: при изменении deps React перезапускает effect. Cleanup отменяет таймеры, подписки и fetch. Stale closure возникает, когда effect не видит свежие props/state — исправляйте deps или functional updaters. Fetch в effect требует `AbortController`, проверку `ok` и guard от гонок. Debounce — через cleanup `clearTimeout`. Для API shop предпочтительнее Query после [17-fetch-react.md](17-fetch-react.md).

---

## Чек-лист

- Что сравнивает React между запусками effect?
- Зачем `return () => clearTimeout(timer)` в debounce?
- Почему `[]` + `page` внутри effect даёт баг пагинации?
- Как отменить fetch при размонтировании?
- Когда effect для `setDraft` оправдан?
- Чем заменить ручной fetch-effect в production-каталоге?

Следующий урок: [16. Лаба: поиск с debounce](16-lab-effects.md).
