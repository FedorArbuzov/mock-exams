# 06. Лаба: union и shop-домен

## Зачем эта лаба

На FastAPI `:8090` товар имеет `status` из фиксированного набора; скидка — `number | null`. JavaScript-слой без типов пропускает `status: "activ"` в JSON. Лаба строит **типизированный** кусок каталога shop — те же сущности, что в [`javascript-basic/09-lab-objects-arrays`](../javascript-basic/09-lab-objects-arrays.md), но ошибки ловятся **`tsc`** до `node`.

Два навыка:

1. Моделировать **union литералов** и **nullable** поля как в OpenAPI.
2. Писать функции, которые **сужают** union ([08-narrowing.md](08-narrowing.md) — углубление после лабы).

## Предварительно

- Прочитаны [04](04-primitives-literals.md) и [05](05-unions-intersections.md).
- Каталог: `courses/typescript-basic/examples/`.

```bash
cd courses/typescript-basic/examples
```

---

## Задание 1. ProductStatus и Product

`lab/06-product-types.ts`:

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  status: ProductStatus;
  discount: number | null;
  description?: string;
}

const keyboard: Product = {
  id: 1,
  sku: "KB-001",
  title: "Keyboard",
  price: 79.99,
  status: "active",
  discount: null,
};

export { Product, ProductStatus, keyboard };
```

Добавьте **намеренно** неверный объект в комментарии `/* ... */` с `status: "hidden"` — убедитесь, что `tsc` ругается. Раскомментировать не нужно.

```bash
npx tsc --noEmit lab/06-product-types.ts
```

---

## Задание 2. Функция isActive

`lab/06-status-guard.ts`:

```typescript
import type { Product, ProductStatus } from "./06-product-types.js";

function isActiveStatus(status: ProductStatus): boolean {
  return status === "active";
}

function filterActiveProducts(products: Product[]): Product[] {
  return products.filter((p) => isActiveStatus(p.status));
}

const catalog: Product[] = [
  keyboard, // импортируйте или продублируйте минимально
  { id: 2, sku: "MS-002", title: "Mouse", price: 29.99, status: "archived", discount: 5 },
];

console.log("Active count:", filterActiveProducts(catalog).length);
```

Запуск: `npx tsx lab/06-status-guard.ts` (или через общий tsconfig).

**Критерий:** для каталога из двух товаров вывод `Active count: 1`.

---

## Задание 3. Union ref: id или sku

**Контекст:** endpoint `GET /items/{id}` или поиск по `sku` — разные входы BFF.

`lab/06-product-ref.ts`:

```typescript
type ProductRef = number | string;

function formatRef(ref: ProductRef): string {
  if (typeof ref === "number") {
    return `id=${ref}`;
  }
  return `sku=${ref}`;
}

console.log(formatRef(42));
console.log(formatRef("KB-001"));
```

В комментарии: почему без `typeof` нельзя вызвать `ref.toFixed()`.

---

## Задание 4. ApiResult discriminated union

`lab/06-api-result.ts`:

```typescript
type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; status: number; message: string };
type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(`HTTP ${result.status}: ${result.message}`);
  }
  return result.data;
}

const ok: ApiResult<Product[]> = {
  ok: true,
  data: [],
};

const fail: ApiResult<Product[]> = {
  ok: false,
  status: 502,
  message: "Bad gateway to FastAPI :8090",
};

// Раскомментируйте по одному:
// console.log(unwrap(ok));
// console.log(unwrap(fail));
```

Импорт `Product` — из задания 1 или локальный type alias `type Product = { id: number }` для краткости.

**Критерий:** `unwrap(ok)` → `[]`; `unwrap(fail)` бросает с текстом про 502.

---

## Задание 5. Nullable discount helper

`lab/06-discount.ts`:

```typescript
function effectivePrice(price: number, discount: number | null): number {
  if (discount === null) {
    return price;
  }
  return Math.max(0, price - discount);
}

console.log(effectivePrice(100, null));
console.log(effectivePrice(100, 15));
console.log(effectivePrice(10, 20));
```

**В комментарии:** почему `discount?: number` было бы другой семантикой, чем `number | null` для ответа API.

---

## Критерии успеха

- [ ] `ProductStatus` — union трёх строк; опечатка ловится `tsc`
- [ ] `filterActiveProducts` возвращает только `active`
- [ ] `formatRef` обрабатывает `number` и `string`
- [ ] `unwrap` сужает по полю `ok`
- [ ] `effectivePrice` корректен для null и переполнения скидки

## Если что-то пошло не так

| Симптом | Направление |
|---------|-------------|
| Cannot find module `./06-product-types.js` | ESM: в import расширение `.js` при `module: NodeNext` |
| `status: "hidden"` не ошибка | проверьте strict; файл вне tsc project |
| `unwrap` — error на `result.data` | не сузили `ok` — добавьте `if (!result.ok)` |
| `tsx` vs `tsc` paths | запускайте из `examples/` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [07. Interfaces](07-interfaces-objects.md) | readonly каталог |
| [08. Narrowing](08-narrowing.md) | `in`, `instanceof` |
| [09. Лаба objects](09-lab-objects.md) | полный каталог |
| [`deploy/fastapi` :8090](../../deploy/fastapi/README.md) | реальные DTO |

Следующий урок (теория): [07. Interfaces и объекты](07-interfaces-objects.md).
