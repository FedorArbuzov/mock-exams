# 20. Discriminated unions: tagged unions and exhaustive switch

## Scenario from work

The shop client handles an API result: success, 404, 422, network. A junior writes `if (result.error) ... else if (result.data) ...` — the fields overlap and TS does not narrow. After the refactor there is a **tag** `kind: "ok" | "not_found" | ...` — the `switch` is exhaustive, and a `default` with `never` catches a forgotten case. The same pattern applies to UI state (loading / success / error) and order events.

## What you'll learn

- **Discriminated union** with a shared discriminant
- Narrowing in **`switch`** and **`if`**
- **Exhaustive check** via `never`
- Difference from boolean flags

---

## Anatomy of a tagged union

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

The **discriminant** is a field with a **unique literal** (`kind`). Keep its name stable across the project.

---

## Narrowing in switch

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

In `case "ok"`, `data` is available; in `not_found` — `resource`, not `data`.

---

## Exhaustive switch with `never`

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

A new `kind: "timeout"` without a `case` → `result` is not `never` → **compile error**.

---

## Comparison with "boolean soup"

```typescript
// Bad
type BadState<T> = {
  loading: boolean;
  error?: string;
  data?: T;
};

// Good
type LoadState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

A tagged union **excludes** `{ loading: false, data: undefined, error: undefined }`.

---

## Connection to HTTP `:8090`

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

## Nested unions: order events

```typescript
type OrderEvent =
  | { type: "created"; orderId: number }
  | { type: "paid"; orderId: number; paidAt: string }
  | { type: "shipped"; orderId: number; tracking: string };
```

Keep statuses in sync with [17-enums-const](17-enums-const.md).

---

## User-defined guard on the discriminant

```typescript
function isOk<T>(r: ApiResult<T>): r is ApiSuccess<T> {
  return r.kind === "ok";
}

if (isOk(result)) {
  console.log(result.data);
}
```

---

## Related courses

| Lesson | Relation |
|------|-------|
| [19-type-guards](19-type-guards.md) | `is Ok` |
| [21-lab-discriminated](21-lab-discriminated.md) | full lab |
| [14-utility-types](14-utility-types.md) | `Exclude` |
| [javascript-basic/32-error-handling](../javascript-basic/32-error-handling.md) | Result vs throw |

---

## Common mistakes

| Mistake | Cause | Fix |
|--------|---------|-------------|
| Optional `error?` without a tag | No discriminant | Tagged union |
| `kind: string` | Loss of literals | Explicit literals / `as const` |
| Forgot `default: never` | New variant silently in default | assertNever |
| 422 as network | Wrong classification | Separate kind |
| throw and Result in the same layer | Two styles | One style at the boundary |

---

## In production

- The `:8090` client — one `ApiResult<T>`, don't mix exceptions and Result in the UI layer.
- UI state in React — a `CatalogViewState` union, not three booleans ([21-lab-discriminated](21-lab-discriminated.md)).
- A new HTTP code → a new `kind` + a switch update (the compiler will check).

---

## Summary

A discriminated union is a union with a literal field. `switch` + `never` — completeness at compile time. Mapping HTTP onto `ApiResult<T>` keeps the shop client predictable.

---

## Checklist

- What does the `kind` field do?
- How does `assertNever` catch an incomplete switch?
- Why is `LoadState` better than `{ loading, error?, data? }`?
- Which `kind` values map to FastAPI 404 and 422?

Next lesson: [21. Lab: API result types](21-lab-discriminated.md).
