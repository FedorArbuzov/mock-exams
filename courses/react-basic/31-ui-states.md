# 31. UI states: loading, error, empty

## Введение: «Пользователь видит белый экран 3 секунды»

QA на staging shop: открыли `/catalog`, `:8090` отвечает медленно — **пустая** страница без пояснений. Потом оборвали сеть — **красный stack trace** в overlay Vite. Product: «Нужны skeleton, retry и „товаров нет“».

Три состояния асинхронного UI — **обязательный** контракт экрана с данными:

1. **Loading** — идёт запрос, показываем skeleton/spinner.
2. **Error** — сбой сети или 500, кнопка «Повторить».
3. **Empty** — успешный ответ, но данных 0 (фильтр слишком строгий или пустой каталог).

После [17-fetch-react.md](17-fetch-react.md) и Query ([20-tanstack-query.md](20-tanstack-query.md)) данные приходят асинхронно. Context ([29-context.md](29-context.md)) и cart не отменяют эти состояния на catalog page. Эта глава — **паттерны UX**, reusable компоненты, a11y.

## Что вы узнаете

- Матрица состояний для shop catalog.
- Skeleton vs spinner — когда что.
- Error UI + `refetch` / retry.
- Empty state — copy и CTA.
- Интеграция с TanStack Query `isLoading`, `isError`, `isFetching`.
- Типичные антипаттерны в mock-exams и prod.

---

## Модель состояний

```text
                    ┌─────────────┐
                    │   idle /    │
                    │  loading    │──► Skeleton / Spinner
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌──────────┐  ┌─────────┐
         │ error  │  │ success  │  │ success │
         │        │  │ + empty  │  │ + data  │
         └────────┘  └──────────┘  └─────────┘
              │            │            │
              ▼            ▼            ▼
         Retry UI     Empty UI     Content
```

**Idle** — до первого fetch (Query: `isLoading && !data`).  
**Refetch** — `isFetching && data` — показываем stale data + subtle indicator ([21-mutations.md](21-mutations.md)).

---

## Loading: skeleton и spinner

### Spinner — короткие операции

Мutation «Добавить в корзину», logout — кнопка с `disabled` + inline spinner.

### Skeleton — списки и карточки

Пользователь видит **структуру** будущего layout — меньше layout shift (CLS).

```tsx
function ProductCardSkeleton() {
  return (
    <article className="card skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-block skeleton-button" />
    </article>
  );
}

function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

CSS ([33-styling.md](33-styling.md)):

```css
.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, var(--card) 25%, #e0e0e0 50%, var(--card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 4px;
}
```

**a11y:** на контейнер loading — `aria-busy="true"`, `aria-live="polite"` при смене на content; skeleton — `aria-hidden`.

---

## Error: сообщение и retry

```tsx
type ErrorPanelProps = {
  message?: string;
  onRetry?: () => void;
};

function ErrorPanel({
  message = "Не удалось загрузить каталог. Проверьте сеть и API :8090.",
  onRetry,
}: ErrorPanelProps) {
  return (
    <div role="alert" className="error-panel">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
```

### Различайте типы ошибок

| Случай | UI |
|--------|-----|
| Network offline | «Нет соединения» + retry |
| 404 item | «Товар не найден» + link catalog |
| 500 server | «Сервис временно недоступен» |
| CORS misconfig | dev hint → [18-cors-fastapi.md](18-cors-fastapi.md) |

Не показывайте сырой `error.stack` пользователю; логируйте в console / Sentry (react-intermediate).

---

## Empty state

**Empty ≠ Error.** HTTP 200, `{ items: [], total: 0 }`.

```tsx
function EmptyCatalog({ onResetFilters }: { onResetFilters?: () => void }) {
  return (
    <div className="empty-state">
      <p>Товаров не найдено</p>
      <p className="muted">Измените фильтры или загляните позже.</p>
      {onResetFilters && (
        <button type="button" onClick={onResetFilters}>
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
```

Корзина empty — [30-lab-context.md](30-lab-context.md). Search empty — другой copy: «По запросу „{q}“ ничего нет».

**CTA:** ссылка на `/catalog`, кнопка сброса, контакт support — один primary action.

---

## Компонент-оркестратор: AsyncBoundary pattern

```tsx
type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

function CatalogBody({ state }: { state: AsyncState<Item[]> }) {
  const { data, isLoading, isError, error, refetch } = state;

  if (isLoading && !data) {
    return <ProductListSkeleton />;
  }

  if (isError) {
    return (
      <ErrorPanel
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyCatalog />;
  }

  return <ProductList items={data} />;
}
```

**Early returns** сверху вниз: loading → error → empty → success ([08-conditional-rendering.md](08-conditional-rendering.md)).

---

## TanStack Query mapping

```tsx
function CatalogPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const items = data?.items ?? [];

  return (
    <section aria-busy={isLoading}>
      {isFetching && data && (
        <p className="sr-only" aria-live="polite">
          Обновление…
        </p>
      )}
      <CatalogBody
        state={{
          data: items,
          isLoading,
          isError,
          error: error as Error | null,
          refetch,
        }}
      />
    </section>
  );
}
```

Query различает:
- `isLoading` — нет cached data, первый fetch
- `isFetching` — любой fetch в flight
- `isPending` (v5) — см. docs вашей версии в `examples/package.json`

**Placeholder data / initialData** — уменьшает flash loading при revisit.

---

## Suspense (обзор)

React **Suspense** + lazy routes ([24-nested-routes.md](24-nested-routes.md)):

```tsx
<Suspense fallback={<ProductListSkeleton />}>
  <CatalogPage />
</Suspense>
```

Query `useSuspenseQuery` — в react-intermediate; в basic достаточно явных флагов.

---

## Переиспользуемые компоненты проекта

Рекомендуемая папка `src/components/feedback/`:

| Комponent | Назначение |
|-----------|------------|
| `Spinner` | inline loading |
| `ProductListSkeleton` | catalog |
| `ErrorPanel` | error + retry |
| `EmptyState` | generic icon + title + action |

Props через TypeScript: [32-typescript-react.md](32-typescript-react.md).

---

## Сценарий mock-exams shop

1. User opens `/catalog` — 6 skeleton cards.
2. FastAPI `:8090` `/api/v1/items` — 200, 1 demo item — список.
3. User ставит фильтр «zzz» — empty state.
4. Stop docker — error + retry; после `docker compose up` — retry works.

Health check optional в footer: `GET /health` ([18-cors-fastapi.md](18-cors-fastapi.md)).

---

## Типичные ошибки

**Один boolean `loading`** — не различаете initial load и background refetch.

**Spinner на весь viewport 5s** — без skeleton; плохой UX.

**Empty при error** — `catch` глотает и ставит `items = []`.

**Нет `role="alert"`** на error — screen readers не объявляют.

**Бесконечный retry loop** — ограничьте attempts или exponential backoff ([javascript-basic 28-lab-async](../javascript-basic/28-lab-async.md)).

**Забыли loading на mutation button** — двойной submit формы ([21-mutations.md](21-mutations.md)).

---

## Резюме

Каждый data-driven экран shop SPA обязан явно обрабатывать **loading**, **error**, **empty**. Skeleton для списков, ErrorPanel с retry, Empty с CTA. Query даёт флаги — ваш UI их отображает. Лаба context cart empty пересекается — единый `EmptyState` переиспользуйте.

## Чек-лист

- [ ] Порядок early returns на catalog page
- [ ] Разница `isLoading` и `isFetching` в Query
- [ ] Empty vs error vs «нет результатов поиска»
- [ ] a11y: aria-busy, role=alert
- [ ] Где лежат feedback-компоненты в структуре ([35-project-structure.md](35-project-structure.md))

Следующий урок: [32. TypeScript в React](32-typescript-react.md).
