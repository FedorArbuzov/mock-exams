# React Basic — Interview Cheatsheet

Проверьте себя **без подглядывания** в главы, затем сверьтесь с [37-interview-qa.md](37-interview-qa.md).

---

## Быстрые ответы

### Основы

| Вопрос | Ответ |
|--------|-------|
| React — это | библиотека UI, declarative, компоненты + hooks |
| JSX | синтаксис → `createElement`, не HTML string |
| SPA vs MPA | SPA — один bundle, JSON API; MPA — full page reload |
| Virtual DOM | описание UI → diff → minimal DOM commit |
| Data flow | props down, events up; однонаправленный |

### Компоненты

| Вопрос | Ответ |
|--------|-------|
| props vs state | props от родителя read-only; state — `useState`, re-render |
| key в list | stable id (`item.id`); index — плохо при reorder |
| controlled input | `value` + `onChange` из state |
| lifting state | общий parent для siblings |
| composition | `children`, не inheritance |

### Hooks — правила

| Правило | Суть |
|---------|------|
| Top level only | не в if/loop/nested fn |
| Только React fn / custom hook | не в utils |
| Порядок вызовов | фиксирован между renders |

### Hooks — API

| Hook | Назначение |
|------|------------|
| `useState` | локальный state |
| `useEffect` | sync с внешним миром после render |
| `useRef` | DOM, mutable без re-render |
| `useMemo` | кэш дорогого вычисления |
| `useCallback` | stable function reference |
| custom `use*` | переиспользование stateful logic |

### useEffect deps

| Массив | Поведение |
|--------|-----------|
| `[]` | mount + cleanup unmount |
| `[a, b]` | re-run при изменении a или b |
| functional setState | `setX(prev => …)` — актуальный prev |

### Data fetching

| Подход | Когда |
|--------|-------|
| TanStack Query | default для server state :8090 |
| useEffect + fetch | обучение; легко ошибиться |
| CORS | проблема browser+API, не React |

Query: **queryKey** = cache id; **invalidate** после mutation.

### Router

| API | Назначение |
|-----|------------|
| `BrowserRouter` | HTML5 history |
| `Routes` / `Route` | path → element |
| `useParams` | `/items/:id` |
| `useSearchParams` | `?q=` URL state |
| `Outlet` | nested layout |

### Context

| Да | Нет |
|----|-----|
| theme, cart, locale | server list (Query) |
| избежать drilling | каждое поле формы |
| memo `value` | god-context 20 полей |

### UI states

```text
loading → skeleton/spinner
error   → message + retry
empty   ≠ error (200, items: [])
success → content
```

Query: `isLoading` (нет data), `isFetching` (любой request).

### TypeScript

| Паттерн | Пример |
|---------|--------|
| props interface | `ProductCardProps` |
| events | `ChangeEvent<HTMLInputElement>` |
| extend native | `ComponentProps<"button">` |
| generic list | `DataList<T extends { id }>` |
| API types | `Item`, `ItemsResponse` |

### Performance

| Действие | Порядок |
|----------|---------|
| 1 | Profiler / DevTools measure |
| 2 | fix keys, Context value, Query |
| 3 | memo / useCallback / useMemo если нужно |

StrictMode dev — **double render** намеренно.

### Структура проекта

```text
app/       providers, routes
pages/     thin route components
features/  catalog, cart domain
components/ui/  shared Button, Spinner
api/       client.ts, items.ts → :8090
types/     Item interfaces
hooks/     generic useDebouncedValue
```

---

## Мини-сниппеты

```tsx
// debounced search hook consumer
const debouncedQ = useDebouncedValue(query, 300);

// Query catalog
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
});

// Cart functional update
setLines((prev) => [...prev, { id, title, qty: 1 }]);

// controlled input
<input value={q} onChange={(e) => setQ(e.target.value)} />

// early return states
if (isLoading) return <Skeleton />;
if (isError) return <ErrorPanel onRetry={refetch} />;
if (!items.length) return <Empty />;

// useRef focus
const ref = useRef<HTMLInputElement>(null);
useEffect(() => { ref.current?.focus(); }, []);
```

---

## mock-exams stack

| Слой | Порт / tech |
|------|-------------|
| Vite React SPA | :5173 |
| FastAPI shop API | :8090 `/api/v1/items` |
| TanStack Query | cache server state |
| React Router | /catalog, /items/:id, /cart |
| Context | theme + client cart |

---

## Частые ловушки

1. Index as `key` — баги при filter/reorder
2. `useEffect` без deps → infinite loop
3. Context `value={{ … }}` каждый render → mass re-render
4. `fetch` в render body — never
5. Empty cart vs error — разный UX
6. CORS misconfig — «React broken»
7. `useCallback` everywhere без memo children — waste
8. Provider under single Route — state lost
9. StrictMode — не «двойной баг», dev check
10. Server data в Context вместо Query — stale

---

## Что учить дальше

| Тема | Курс |
|------|------|
| Auth, error boundaries | react-intermediate |
| Vitest, Testing Library | javascript-testing |
| REST контракты | api-design |
| Node BFF | nodejs-basic |
| Capstone shop SPA | [38-capstone.md](38-capstone.md) |

---

[← README](README.md) · [37-interview-qa](37-interview-qa.md) · [38-capstone](38-capstone.md)
