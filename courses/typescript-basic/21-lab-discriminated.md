# 21. Лаба: типы результатов API

## Зачем эта лаба

Собираете **клиент каталога** к FastAPI `http://localhost:8090`: discriminated union `ApiResult<T>`, исчерпывающий `handleResult`, маппинг HTTP. Локально — мок `fetch`; при [deploy/fastapi](../../deploy/fastapi/README.md) — живые ответы.

**Время:** ~55–70 минут.

---

## Структура

```text
lab/api-result.ts  product-guards.ts  catalog-client.ts
lab/21-handlers.ts  21-demo-mock.ts  21-demo.ts (опционально)
```

`Product` из [12-lab-functions](12-lab-functions.md) или [18-lab-classes](18-lab-classes.md).

---

## Задание 1. `ApiResult<T>`

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

## Задание 2. Guards

`isProduct`, `isProductList` — structural check; **без** голого `as Product`.

---

## Задание 3. `CatalogClient`

`getItem(id)`: 404 → `not_found`, 422 → `validation_error` + `normalizeFieldErrors`, `!res.ok` → network, 200 + guard → `ok`.

`listItems()`: `GET /items`, `isProductList`.

`normalizeFieldErrors` — FastAPI `detail` массив `{ loc, msg }`.

---

## Задание 4. `handleApiResult`

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
    // ... все case + default: assertNever(result)
  }
}
```

---

## Задание 5. Мок fetch

`21-demo-mock.ts`: подмена `globalThis.fetch` — `/items/1` → 200 JSON, `/items/999` → 404. Ожидание: разные ветки handler.

```bash
npx tsc && node dist/lab/21-demo-mock.js
```

---

## Задание 6 (опционально). Живой `:8090`

`21-demo.ts` — `listItems()` при запущенном FastAPI. Сверьте JSON с OpenAPI; `title` vs `name` — mapper в guard или `fromDto`.

---

## Задание 7 (опционально). UI state union

```typescript
export type CatalogViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; products: readonly Product[] }
  | { status: "failed"; error: string };
```

`reduceResult(state, result)` — без boolean flags.

---

## Критерии успеха

- [ ] Tagged union с `kind`
- [ ] `default: assertNever(result)`
- [ ] `getItem` без `as Product` без guard
- [ ] Мок: 200 и 404 — разные handlers
- [ ] `npx tsc` strict

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `default` не `never` | добавьте case |
| 404 как network | проверьте status до `!res.ok` |
| CORS в браузере | демо в Node |
| detail shape | `normalizeFieldErrors` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| nodejs-basic | BFF + Result |
| react-basic | `CatalogViewState` |
| Zod / OpenAPI | замена guards |

Поздравляем — блок **функции → generics → классы → API results** в typescript-basic пройден. Дальше по треку: `strict` tsconfig, Zod, nodejs/react.

## Чек-лист

- [ ] Исчерпывающий switch
- [ ] Guards на JSON границе
- [ ] Понимаете маппинг HTTP → `kind`
