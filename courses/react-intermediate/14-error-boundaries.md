# 14. Error boundaries: что ловят и что нет

## Сценарий с работы

Пятница, 16:47. Admin SPA к Django `:8092` уже в staging. QA открывает `/products`, кликает «Редактировать» — белый экран. В консоли: `TypeError: Cannot read properties of undefined (reading 'slug')`. Sentry молчит: ошибка **в render**, но у вас нет error boundary — React **размонтировал** всё дерево до `<html>`. Пользователь видит пустую страницу; refresh помогает только до следующего битого продукта.

Tech lead пишет в Slack: «Нужен fallback UI, не white screen of death. Async-ошибки Query — отдельно, это не boundary». Вы открываете [react-basic: UI states](../react-basic/31-ui-states.md) — loading/error для fetch уже есть, но **синхронный краш компонента** Query не перехватит.

После [13-lab-auth.md](13-lab-auth.md) auth работает; теперь защищаем **дерево рендера** от падений в дочерних компонентах.

## Что вы узнаете

- Что такое **error boundary** и зачем он в production SPA
- Какие ошибки boundary **ловит**, а какие — **нет**
- Классовый компонент: `getDerivedStateFromError`, `componentDidCatch`
- Функциональный подход: библиотека `react-error-boundary`
- Гранулярность: boundary на route vs на виджет
- Связь с TanStack Query ([06-query-advanced.md](06-query-advanced.md)) — разные слои

---

## Два мира ошибок в React

| Тип | Пример | Кто ловит |
|-----|--------|-----------|
| **Render** | `product.category.slug` когда `category === null` | **Error boundary** |
| **Event handler** | `onClick` → `JSON.parse(bad)` | `try/catch` в handler |
| **Async / fetch** | `queryFn` rejected | `isError`, `errorElement`, boundary **не** ловит |
| **useEffect** | unhandled rejection в effect | `try/catch` / `.catch()` в async effect |

Error boundary работает как **try/catch для JSX**: если при построении дерева (render или lifecycle дочернего class-компонента) летит необработанное исключение, React ищет ближайший boundary вверх по дереву и показывает **fallback UI** вместо упавшей ветки.

```text
App
 └── QueryClientProvider
      └── AuthProvider
           └── Router
                └── ErrorBoundary          ← ловит краш ProductsTable
                     └── ProductsPage
                          └── ProductRow   ← throw здесь
```

Sibling-ветки **не** падают: sidebar с навигацией остаётся, если boundary оборачивает только `<Outlet />`.

---

## Классовый error boundary (канон React)

Официально boundary — только **class component** (на 2025 React 19 не добавил hook `useErrorBoundary` в core):

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    // сюда: Sentry, LogRocket, backend /api/v1/client-errors/
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      return typeof fallback === "function"
        ? fallback(error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

**`getDerivedStateFromError`** — чистая функция, только обновляет state (без side effects). **`componentDidCatch`** — логирование, аналитика. **`reset`** — сброс state boundary; дети **перемонтируются** при следующем render (важно для «Попробовать снова»).

### Использование на странице products

```tsx
function ProductEditorPanel({ productId }: { productId: number }) {
  const { data } = useProduct(productId); // Query — см. ниже про async

  // Опасно: если API вернул объект без category, а тип «соврал»
  return (
    <section>
      <h2>{data.title}</h2>
      <p>Категория: {data.category.slug}</p>
    </section>
  );
}

function ProductsRoute() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div role="alert" className="error-panel">
          <h2>Не удалось показать карточку товара</h2>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>
            Попробовать снова
          </button>
        </div>
      )}
    >
      <ProductEditorPanel productId={42} />
    </ErrorBoundary>
  );
}
```

Boundary **не заменяет** defensive coding: optional chaining (`data?.category?.slug ?? "—"`) всё равно нужен. Boundary — **последняя линия обороны**, когда что-то всё же упало.

---

## `react-error-boundary` для функционального стиля

В [`examples/package.json`](examples/package.json) можно добавить `react-error-boundary` — thin wrapper с `FallbackProps`, `resetKeys`, `onReset`:

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ProductFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert">
      <p>Ошибка отображения: {error.message}</p>
      <button type="button" onClick={resetErrorBoundary}>
        Сбросить
      </button>
    </div>
  );
}

export function SafeProductEditor(props: { productId: number }) {
  return (
    <ErrorBoundary
      FallbackComponent={ProductFallback}
      onError={(error, info) => {
        console.error(error, info.componentStack);
      }}
      resetKeys={[props.productId]}
    >
      <ProductEditorPanel {...props} />
    </ErrorBoundary>
  );
}
```

**`resetKeys`** — при смене `productId` boundary автоматически сбрасывает ошибку и монтирует новый товар. Без этого пользователь застрял бы на fallback после перехода на другой id.

---

## Что boundary НЕ ловит

1. **Ошибки в event handlers** — оборачивайте в `try/catch`:

```tsx
async function handleSave() {
  try {
    await saveProduct(form);
  } catch (e) {
    toast.error("Сохранение не удалось");
  }
}
```

2. **Async код внутри useEffect / queryFn** — rejection не всплывает в render. Используйте `isError` из Query ([react-basic: TanStack Query](../react-basic/20-tanstack-query.md)).

3. **Ошибки в самом boundary** — fallback тоже может упасть; держите fallback **простым** (текст + кнопка).

4. **SSR** — на сервере boundary ведёт себя иначе; в Vite SPA ([00-environment.md](00-environment.md)) это реже проблема.

5. **Ошибки в Server Components** — другая модель (Next.js); наш курс — client SPA.

---

## Гранулярность: один boundary на всё приложение?

**Корневой boundary** в `main.tsx` — must-have: ловит неожиданные краши, показывает «Что-то пошло не так» вместо белого экрана.

**Route-level boundary** — изоляция: падение таблицы products не убивает layout с [AuthProvider](10-auth-context.md) и sidebar.

**Widget-level** — тяжёлый chart или markdown-preview от сторонней lib: упал виджет — остальная admin-форма жива.

```tsx
// src/app/RootErrorBoundary.tsx — минимальный fallback
export function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <main className="fatal-error">
          <h1>Приложение временно недоступно</h1>
          <button type="button" onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </main>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

Не ставьте boundary **на каждый** `<li>` — overhead и шум в логах без пользы.

---

## Error boundary vs Query error state

После [07-lab-django-products.md](07-lab-django-products.md) список грузится через Query:

```tsx
function ProductsList() {
  const { data, isError, error, refetch } = useProducts();

  if (isError) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={() => refetch()}>Повторить</button>
      </div>
    );
  }

  return <ProductsTable rows={data.results} />;
}
```

`isError` — **ожидаемый** сбой сети/API. Error boundary — **неожиданный** баг в `ProductsTable` (например, `rows.map` когда `rows` undefined из-за race). Оба слоя **совместимы**.

---

## Интеграция с typed API ([04-api-client.md](04-api-client.md))

Boundary не знает про `ApiError.status`. В `componentDidCatch` / `onError` отправляйте:

- `error.message`, `error.stack`
- `info.componentStack`
- контекст: route, user id из [useAuth](10-auth-context.md) (без токенов!)

Не логируйте JWT access token в Sentry.

---

## Типичные ошибки

**«Поставлю ErrorBoundary — Query ошибки исчезнут».** Нет. 401/500 из `/api/v1/products/` — это `isError`, refresh flow из [12-refresh-flow.md](12-refresh-flow.md), не boundary.

**«Boundary вокруг всего App без route boundaries».** Один битый виджет вынесет пользователя на generic fallback всего приложения.

**«Fallback рендерит тот же ProductEditorPanel».** Бесконечный цикл крашей. Fallback должен быть **другим** деревом.

**«reset без смены причины».** Пользователь жмёт «Повторить» — снова тот же null.category. Нужен fix данных или навигация назад.

**«Ловлю ошибки fetch в boundary через throw в render».** Антипаттерн:

```tsx
// Плохо: throw в render из-за async
if (isError) throw error;
```

Используйте явный error UI; throw в render для async — только с Suspense ([22-suspense-data.md](22-suspense-data.md)), не для обычного Query.

---

## Чек-лист

- [ ] Назовите три типа ошибок, которые boundary **не** ловит
- [ ] Объясните разницу `getDerivedStateFromError` и `componentDidCatch`
- [ ] Зачем `resetKeys` при смене route param
- [ ] Где корневой boundary, где route-level в admin SPA
- [ ] Почему Query `isError` и boundary — разные слои

---

## Далее

Следующий урок: [15. Boundaries + Router + Query reset](15-boundaries-router.md) — `errorElement`, связка с React Router 7 и сброс ошибок при навигации.
