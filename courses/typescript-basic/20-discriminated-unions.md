# 20. Discriminated unions: tagged unions и исчерпывающий switch

## Сценарий с работы

Клиент shop обрабатывает результат API: успех, 404, 422, сеть. Джун пишет `if (result.error) ... else if (result.data) ...` — поля пересекаются, TS не сужает. После рефакторинга — **тег** `kind: "ok" | "not_found" | ...` — `switch` исчерпывающий, `default` с `never` ловит забытый кейс. Тот же паттерн — UI state (loading / success / error) и события заказа.

## Что вы узнаете

- **Discriminated union** с общим дискриминатором
- Сужение в **`switch`** и **`if`**
- **Exhaustive check** через `never`
- Отличие от boolean flags

---

## Анатомия tagged union

```typescript
type ApiSuccess<T> = {
  kind: "ok";
  data: T;
};

type ApiNotFound = {
  kind: "not_found";
  resource: string;
  id: number;
};

type ApiValidationError = {
  kind: "validation_error";
  fieldErrors: Record<string, string[]>;
};

type ApiNetworkError = {
  kind: "network_error";
  cause: unknown;
};

type ApiResult<T> =
  | ApiSuccess<T>
  | ApiNotFound
  | ApiValidationError
  | ApiNetworkError;
```

**Дискриминатор** — поле с **уникальным литералом** (`kind`). Имя стабильно в проекте.

---

## Сужение в switch

```typescript
function describeResult<T>(result: ApiResult<T>): string {
  switch (result.kind) {
    case "ok":
      return `OK: ${JSON.stringify(result.data)}`;
    case "not_found":
      return `${result.resource} #${result.id} not found`;
    case "validation_error":
      return `Validation: ${Object.keys(result.fieldErrors).join(", ")}`;
    case "network_error":
      return "Network error";
  }
}
```

В `case "ok"` доступно `data`; в `not_found` — `resource`, не `data`.

---

## Исчерпывающий switch с `never`

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

function handleResult<T>(result: ApiResult<T>): void {
  switch (result.kind) {
    case "ok":
      renderData(result.data);
      break;
    case "not_found":
      showToast(result.resource);
      break;
    case "validation_error":
      showFormErrors(result.fieldErrors);
      break;
    case "network_error":
      showRetry();
      break;
    default:
      assertNever(result);
  }
}
```

Новый `kind: "timeout"` без `case` → `result` не `never` → **ошибка compile**.

---

## Сравнение с «boolean soup»

```typescript
// Плохо
type BadState<T> = {
  loading: boolean;
  error?: string;
  data?: T;
};

// Хорошо
type LoadState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

Tagged union **исключает** `{ loading: false, data: undefined, error: undefined }`.

---

## Связь с HTTP `:8090`

```typescript
async function fetchItem(id: number): Promise<ApiResult<Product>> {
  try {
    const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
    if (res.status === 404) {
      return { kind: "not_found", resource: "item", id };
    }
    if (res.status === 422) {
      const body = await res.json();
      return { kind: "validation_error", fieldErrors: body.detail ?? {} };
    }
    if (!res.ok) {
      return { kind: "network_error", cause: res.statusText };
    }
    const data: unknown = await res.json();
    if (!isProduct(data)) {
      return {
        kind: "validation_error",
        fieldErrors: { _: ["invalid shape"] },
      };
    }
    return { kind: "ok", data };
  } catch (cause) {
    return { kind: "network_error", cause };
  }
}
```

`isProduct` — [19-type-guards](19-type-guards.md). FastAPI 422 — [`fastapi`](../fastapi/README.md).

---

## Вложенные unions: события заказа

```typescript
type OrderEvent =
  | { type: "created"; orderId: number }
  | { type: "paid"; orderId: number; paidAt: string }
  | { type: "shipped"; orderId: number; tracking: string };
```

Статусы синхронизируйте с [17-enums-const](17-enums-const.md).

---

## User-defined guard на дискриминатор

```typescript
function isOk<T>(r: ApiResult<T>): r is ApiSuccess<T> {
  return r.kind === "ok";
}

if (isOk(result)) {
  console.log(result.data);
}
```

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [19-type-guards](19-type-guards.md) | `is Ok` |
| [21-lab-discriminated](21-lab-discriminated.md) | полная лаба |
| [14-utility-types](14-utility-types.md) | `Exclude` |
| [javascript-basic/32-error-handling](../javascript-basic/32-error-handling.md) | Result vs throw |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| Optional `error?` без тега | Нет дискриминатора | Tagged union |
| `kind: string` | Потеря литералов | Явные литералы / `as const` |
| Забыли `default: never` | Новый вариант тихо в default | assertNever |
| 422 как network | Неверная классификация | Отдельный kind |
| throw и Result в одном слое | Два стиля | Один стиль на границе |

---

## В продакшене

- Клиент `:8090` — один `ApiResult<T>`, не смешивать exceptions и Result в UI-слое.
- UI state в React — `CatalogViewState` union, не три boolean ([21-lab-discriminated](21-lab-discriminated.md)).
- Новый HTTP-код → новый `kind` + обновление switch (compile проверит).

---

## Резюме

Discriminated union — union с полем-литералом. `switch` + `never` — полнота на compile-time. Маппинг HTTP на `ApiResult<T>` держит shop-клиент предсказуемым.

---

## Чек-лист

- Что делает поле `kind`?
- Как `assertNever` ловит неполный switch?
- Чем `LoadState` лучше `{ loading, error?, data? }`?
- Какие `kind` для 404 и 422 FastAPI?

Следующий урок: [21. Лаба: API result types](21-lab-discriminated.md).
