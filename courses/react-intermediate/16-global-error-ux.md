# 16. Global error UX: toasts, retry, offline

## Сценарий с работы

Staging admin SPA. Три разных экрана показывают ошибки **по-разному**: products — красный `<div role="alert">`, settings — `alert()`, login — молчание в консоли. Пользователь не понимает: «Это временно или мне звонить в support?» Мобильный LTE обрывается — форма «Сохранить» крутит spinner бесконечно, потому что mutation не обрабатывает offline.

Product owner: «Нужна **единая** политика: toast для recoverable, full-page для fatal, retry там где имеет смысл, offline banner». Вы уже разделили boundary и Query ([14-error-boundaries.md](14-error-boundaries.md), [15-boundaries-router.md](15-boundaries-router.md)); теперь **UX-слой** поверх [04-api-client.md](04-api-client.md) и [react-basic: UI states](../react-basic/31-ui-states.md).

## Что вы узнаете

- Классификация ошибок: recoverable vs fatal vs auth
- Toast/inline/banner/modal — когда что
- Retry: exponential backoff, idempotency, `refetch` vs `mutate`
- Offline detection: `navigator.onLine`, events `online`/`offline`
- Global handlers в API client и Query `MutationCache`
- Доступность: `role="alert"`, focus management

---

## Классификация для admin SPA

| Класс | Пример | UX |
|-------|--------|-----|
| **Transient network** | timeout, 502 | Toast + «Повторить» |
| **Validation** | 400 DRF `{ field: [...] }` | Inline у поля формы ([28-forms-rhf.md](28-forms-rhf.md)) |
| **Auth** | 401 после failed refresh | Redirect login ([12-refresh-flow.md](12-refresh-flow.md)) |
| **Forbidden** | 403 | Страница «Нет доступа» |
| **Not found** | 404 product | Empty state + link back |
| **Render bug** | null.slug | Error boundary fallback |
| **Offline** | `navigator.onLine === false` | Sticky banner, disable mutations |

Один HTTP 500 **не** всегда toast: список products — inline error panel с refetch; фоновый prefetch — тихий retry.

---

## Toast-слой (минимальная реализация)

В [`examples/`](examples/package.json) нет тяжёлой UI-lib — достаточно контекста + portal:

```tsx
// src/shared/notifications/ToastProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: string;
  variant: "error" | "success" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6_000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`toast toast--${t.variant}`}>
            <span>{t.message}</span>
            {t.action ? (
              <button type="button" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
```

**`aria-live="polile"`** — screen reader объявляет новые toast без кражи фокуса. Для **критичных** blocking ошибок prefer `role="alert"` inline, не toast.

Подключите `ToastProvider` в `main.tsx` **внутри** `AuthProvider`, чтобы toast мог вызвать logout.

---

## Global API error mapping

Расширьте interceptor из [04-api-client.md](04-api-client.md):

```tsx
// src/api/client.ts — фрагмент
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.detail ?? res.statusText,
      res.status,
      body,
    );
  }
  return res.json() as Promise<T>;
}
```

Hook **`useApiErrorToast`** для mutations:

```tsx
export function useApiErrorToast() {
  const { push } = useToast();

  return useCallback(
    (error: unknown, retry?: () => void) => {
      if (error instanceof ApiError) {
        if (error.status === 401) return; // refresh flow уже обработал
        if (error.status >= 500) {
          push({
            variant: "error",
            message: "Сервер временно недоступен",
            action: retry ? { label: "Повторить", onClick: retry } : undefined,
          });
          return;
        }
      }
      push({
        variant: "error",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    },
    [push],
  );
}
```

---

## Query: default retry и global onError

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error, _vars, _ctx, mutation) => {
        // опционально: централизованный лог
        console.error("mutation failed", mutation.options.mutationKey, error);
      },
    },
  },
});
```

На странице products **всё равно** показывайте `isError` UI ([react-basic: TanStack Query](../react-basic/20-tanstack-query.md)) — global retry не заменяет локальный контекст «Не удалось загрузить каталог».

---

## Offline banner

```tsx
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

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

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="alert" className="offline-banner">
      Нет подключения к интернету. Изменения сохранятся, когда связь вернётся.
    </div>
  );
}
```

В mutations проверяйте `navigator.onLine` **до** submit или используйте `networkMode: 'offlineFirst'` в Query v5 для PWA-сценариев (admin SPA чаще блокирует кнопку):

```tsx
const createProduct = useMutation({
  mutationFn: createProductApi,
  networkMode: "always",
  onMutate: () => {
    if (!navigator.onLine) {
      throw new Error("OFFLINE");
    }
  },
});
```

---

## Retry patterns

### Query refetch

```tsx
const { refetch, isFetching } = useProducts();

<button
  type="button"
  disabled={isFetching}
  onClick={() => refetch()}
>
  {isFetching ? "Загрузка…" : "Повторить"}
</button>
```

### Mutation retry (осторожно)

POST create **не** idempotent — не auto-retry 3 раза. DELETE/PUT с idempotency key — можно. DRF POST `/api/v1/products/` без ключа — только ручной retry пользователя.

### Exponential backoff для polling

Из [06-query-advanced.md](06-query-advanced.md): `refetchInterval` увеличивать при ошибках — advanced; для admin достаточно фиксированного retry Query.

---

## Единый `ErrorPanel` компонент

```tsx
type ErrorPanelProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel = "Повторить",
}: ErrorPanelProps) {
  return (
    <div role="alert" className="error-panel">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
```

Используйте в:
- Query list error
- Route `errorElement` ([15-boundaries-router.md](15-boundaries-router.md))
- Boundary fallback (с другим title)

---

## Логирование без PII

В global handler отправляйте:
- correlation id (заголовок `X-Request-Id` от Django)
- route path, HTTP method, status
- **не** отправляйте: password, refresh token, полные JWT

Связь с [35-security-client.md](35-security-client.md) — позже углубим CSP и XSS; ошибки не должны рендерить `error.message` от API как HTML.

---

## Типичные ошибки

**«Все ошибки в toast».** Пользователь пропустил toast — не знает почему форма не сохранилась. Validation — inline.

**«alert() в dev остался в production».** Замените на toast или ErrorPanel.

**«Retry mutation на 400 validation».** Создаст дубликаты или бесконечный fail loop.

**«Offline = только banner, кнопки активны».** Frustration при silent fail — disable или queue (out of scope).

**«Toast без aria-live».** Accessibility audit fail.

**«Один текст для 401 и 500».** 401 → login flow из [10-auth-context.md](10-auth-context.md).

---

## Чек-лист

- [ ] Перечислите 4 класса ошибок и подходящий UX для каждого
- [ ] Почему POST create не auto-retry
- [ ] Где ToastProvider в дереве провайдеров
- [ ] Как Query `retry` function отличает 404 от 502
- [ ] Зачем `OfflineBanner` + disabled submit

---

## Далее

Следующий урок: [17. Лаба: fallback UI и route errors](17-lab-errors.md) — соберёте error boundaries, Router и Query reset в [`examples/`](examples/src/).
