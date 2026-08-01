# 21. Lab: API result types

## Why this lab

You build a **catalog client** for FastAPI `http://localhost:8090`: a discriminated union `ApiResult<T>`, an exhaustive `handleResult`, and HTTP mapping. Locally use a mocked `fetch`; with [deploy/fastapi](../../deploy/fastapi/README.md) — live responses.

**Time:** ~55–70 minutes.

---

## Structure

```text
lab/api-result.ts  product-guards.ts  catalog-client.ts
lab/21-handlers.ts  21-demo-mock.ts  21-demo.ts (optional)
```

`Product` from [12-lab-functions](12-lab-functions.md) or [18-lab-classes](18-lab-classes.md).

---

## Task 1. `ApiResult<T>`

```typescript
export type ApiSuccess<T> = { kind: "ok"; data: T };
export type ApiNotFound = { kind: "not_found"; resource: string; id: number };
export type ApiValidationError = {
  kind: "validation_error";
  fieldErrors: Record<string, string[]>;
};
export type ApiNetworkError = {
  kind: "network_error";
  message: string;
  cause?: unknown;
};

export type ApiResult<T> =
  | ApiSuccess<T>
  | ApiNotFound
  | ApiValidationError
  | ApiNetworkError;

export function assertNever(x: never): never {
  throw new Error(`Unexpected: ${JSON.stringify(x)}`);
}
```

---

## Task 2. Guards

`isProduct`, `isProductList` — structural checks; **no** bare `as Product`.

---

## Task 3. `CatalogClient`

`getItem(id)`: 404 → `not_found`, 422 → `validation_error` + `normalizeFieldErrors`, `!res.ok` → network, 200 + guard → `ok`.

`listItems()`: `GET /items`, `isProductList`.

`normalizeFieldErrors` — FastAPI `detail` array of `{ loc, msg }`.

---

## Task 4. `handleApiResult`

```typescript
export function handleApiResult<T>(
  result: ApiResult<T>,
  handlers: {
    onOk: (data: T) => void;
    onNotFound: (resource: string, id: number) => void;
    onValidation: (errors: Record<string, string[]>) => void;
    onNetwork: (message: string) => void;
  }
): void {
  switch (result.kind) {
    case "ok":
      handlers.onOk(result.data);
      break;
    // ... all cases + default: assertNever(result)
  }
}
```

---

## Task 5. Mock fetch

`21-demo-mock.ts`: replace `globalThis.fetch` — `/items/1` → 200 JSON, `/items/999` → 404. Expected: different handler branches.

```bash
npx tsc && node dist/lab/21-demo-mock.js
```

---

## Task 6 (optional). Live `:8090`

`21-demo.ts` — `listItems()` with FastAPI running. Check the JSON against OpenAPI; `title` vs `name` — a mapper in the guard or `fromDto`.

---

## Task 7 (optional). UI state union

```typescript
export type CatalogViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; products: readonly Product[] }
  | { status: "failed"; error: string };
```

`reduceResult(state, result)` — without boolean flags.

---

## Success criteria

- [ ] Tagged union with `kind`
- [ ] `default: assertNever(result)`
- [ ] `getItem` without `as Product` and without a guard
- [ ] Mock: 200 and 404 — different handlers
- [ ] `npx tsc` strict

## If something goes wrong

| Symptom | Solution |
|---------|----------|
| `default` not `never` | add a case |
| 404 as network | check status before `!res.ok` |
| CORS in the browser | run the demo in Node |
| detail shape | `normalizeFieldErrors` |

## Related courses

| Next | Relation |
|------|----------|
| nodejs-basic | BFF + Result |
| react-basic | `CatalogViewState` |
| Zod / OpenAPI | replacement for guards |

Congratulations — the **functions → generics → classes → API results** block in typescript-basic is complete. Next on the track: `strict` tsconfig, Zod, nodejs/react.

## Checklist

- [ ] Exhaustive switch
- [ ] Guards at the JSON boundary
- [ ] You understand the HTTP → `kind` mapping
