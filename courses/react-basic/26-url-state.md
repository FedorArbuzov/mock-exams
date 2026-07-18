# 26. URL как state: search params

## Сценарий с работы

QA shop: «Отфильтровал каталог по "keyboard", скинул ссылку коллеге — у него **сброшен** фильтр». Фильтр живёт только в `useState` — URL не отражает state. Product: «Фильтры и страница пагинации — в query string, как у нормальных shop; refresh и share должны работать».

**`useSearchParams`** (React Router) синхронизирует **search** часть URL (`?q=keyboard&page=2`) с UI. Вместе с TanStack Query — `queryKey` включает params → правильный кэш к `:8090`.

## Что вы узнаете

- `useSearchParams` read/write
- Связь URL ↔ filters ↔ `useQuery`
- Debounced search в URL (осторожно)
- `URLSearchParams` API
- Bookmarkable catalog shop

---

## Anatomy URL

```text
http://localhost:5173/items/5?q=keyboard&sort=price&page=2
                      │ path  │ └────── search (query string) ──────┘
```

Path — **какой экран** ([24-nested-routes.md](24-nested-routes.md)).  
Search — **вариант экрана** (фильтры, sort, page).

---

## `useSearchParams`

```tsx
import { useSearchParams } from "react-router-dom";

function CatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  function setQuery(nextQ: string) {
    const next = new URLSearchParams(searchParams);
    if (nextQ) {
      next.set("q", nextQ);
    } else {
      next.delete("q");
    }
    next.set("page", "1"); // сброс страницы при новом поиске
    setSearchParams(next);
  }

  return (
    <input
      value={q}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Поиск…"
    />
  );
}
```

`setSearchParams` обновляет URL **без** full reload; компоненты re-render.

---

## Инициализация из URL

При первом открытии `/catalog?q=mouse` поле поиска должно показать `mouse` — читайте из `searchParams`, не дублируйте отдельный state без sync:

```tsx
const q = searchParams.get("q") ?? "";
// controlled input value={q} — URL is source of truth
```

Если нужен debounce **перед** записью в URL ([16-lab-effects.md](16-lab-effects.md)):

```tsx
const [draft, setDraft] = useState(() => searchParams.get("q") ?? "");

useEffect(() => {
  const t = setTimeout(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (draft) next.set("q", draft);
      else next.delete("q");
      next.delete("page");
      return next;
    });
  }, 300);
  return () => clearTimeout(t);
}, [draft, setSearchParams]);
```

Два источника — draft для input, URL для share — sync через effect.

---

## Query + search params

```tsx
function CatalogPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";

  const { data, isPending, isError } = useQuery({
    queryKey: ["items", { q, page }],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", page);
      const qs = params.toString();
      const path = qs ? `/api/v1/items?${qs}` : "/api/v1/items";
      return api<Item[]>(path, { signal });
    },
  });

  // render list...
}
```

Любое изменение `q` или `page` → новый `queryKey` → fetch (или cache hit если уже был). Backend `:8090` должен понимать query (или фильтруйте на клиенте для учебного API — зафиксируйте в README лабы).

---

## Пагинация в URL

```tsx
function Pagination({ totalPages }: { totalPages: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  function goTo(p: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  }

  return (
    <div>
      <button type="button" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        Назад
      </button>
      <span>{page} / {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        Вперёд
      </button>
    </div>
  );
}
```

---

## `setSearchParams` options

```tsx
setSearchParams(next, { replace: true }); // не плодить history на каждый символ
```

При debounced URL update — **`replace: true`** уменьшает стопку «Назад».

---

## Несколько фильтров

```tsx
const category = searchParams.get("category") ?? "all";

function setCategory(cat: string) {
  const next = new URLSearchParams(searchParams);
  if (cat === "all") next.delete("category");
  else next.set("category", cat);
  next.set("page", "1");
  setSearchParams(next);
}
```

queryKey:

```tsx
queryKey: ["items", { q, page, category }]
```

---

## Sync при navigate programmatically

```tsx
navigate(`/catalog?${new URLSearchParams({ q: "hub" })}`);
// или
navigate({ pathname: "/", search: "?q=hub" });
```

После [23-react-router.md](23-react-router.md) `useNavigate` + search object.

---

## Отличие от path params

| | Path `:itemId` | Search `?q=` |
|---|----------------|--------------|
| Пример | `/items/42` | `/?q=keyboard` |
| Обязательность | route match | optional filters |
| REST id ресурса | да | нет |

Не кладите primary entity id только в search, если нужен RESTful share `/items/42`.

---

## FastAPI :8090

Передайте фильтры как query string — согласуйте с OpenAPI `/docs`. Если стенд не поддерживает `q` — фильтруйте `data` на клиенте, но **URL state всё равно** учите для capstone.

Proxy: `/api/v1/items?q=...` → `:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Типичные ошибки

1. **Фильтр только в useState** — ссылка не шарится.

2. **queryKey без search params** — неверный кэш при смене `?q=`.

3. **Debounce пишет URL на каждый key** без replace — history spam.

4. **Забыли сброс page** при новом q — «пустая» страница 5.

5. **Дубли: state q + searchParams q** — рассинхрон; один source of truth.

6. **Не encode** — `URLSearchParams` vs ручная строка с пробелами.

---

## Резюме

Search params делают фильтры shop **bookmarkable**: `useSearchParams` читает и пишет `?q=&page=`. TanStack Query включает params в `queryKey` и `queryFn`. Debounced search → URL с `replace: true`. Path params для id товара, search — для вариантов каталога. Backend `:8090` или client filter — но URL остаётся контрактом UX.

---

## Чек-лист

- Как прочитать `q` из URL?
- Зачем сбрасывать `page` при новом поиске?
- Что попадёт в queryKey при `?q=a&page=2`?
- Чем `setSearchParams` лучше `window.location.search =`?
- Когда использовать replace?
- Как коллега воспроизведёт ваш фильтр?

Следующий урок: [27. useRef, useMemo, useCallback](27-ref-memo-callback.md).
