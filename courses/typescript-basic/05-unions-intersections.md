# 05. Union, intersection и optional свойства

## Введение: сценарий с работы

Ответ FastAPI `:8090` для товара: поле `discount` то **число**, то **`null`** («скидки нет»). В JS вы писали `if (item.discount != null)`. В TS без union компилятор думает, что `discount` всегда `number` — доступ к `null` не отражён. QA заводит баг: «опциональное поле `description` отсутствует в JSON» — в TS нужно `description?: string`, иначе код обращается к `undefined` как к обязательному string.

Второй кейс: функция принимает **либо** `Product`, **либо** `ProductId` (число) — **union** `Product | number`. Третий: тип `AdminUser` = `User & { role: "admin" }` — **intersection** для расширения без дублирования полей. Эти три механизма — 80% моделей shop-каталога до generics.

## Что вы узнаете

- **Union** `A | B` — значение одного из типов.
- **Intersection** `A & B` — всё сразу.
- **Optional** свойства `?` и `undefined` в типах.
- **`null` vs `undefined` vs optional** — согласованность с API.
- Discriminated unions (preview) для `ProductStatus`.
- Паттерны для DTO с `:8090`.

## Union: «или то, или это»

```typescript
type ProductId = number;
type ProductSku = string;

type ProductRef = ProductId | ProductSku;

function resolveRef(ref: ProductRef): string {
  if (typeof ref === "number") {
    return `id:${ref}`;
  }
  return `sku:${ref}`;
}
```

Без сужения (narrowing) тело функции не может вызвать методы, общие не для всех членов union — [08-narrowing.md](08-narrowing.md).

### Literal union — статусы shop

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  title: string;
  status: ProductStatus;
}
```

Опечатка `"activ"` — **TS2322** на этапе присвоения.

### Union с null — nullable поля

```typescript
interface PriceInfo {
  amount: number;
  discount: number | null; // явный null из JSON
}
```

Различайте:

| Запись | Смысл |
|--------|-------|
| `discount: number` | всегда число |
| `discount: number \| null` | число или null |
| `discount?: number` | может отсутствовать (undefined) |
| `discount?: number \| null` | нет ключа, null или число |

С FastAPI/Pydantic `Optional[float] = None` чаще мапится на `number | null`; отсутствующий ключ — `?`.

## Optional свойства

```typescript
interface Product {
  id: number;
  title: string;
  description?: string;
}

const keyboard: Product = {
  id: 1,
  title: "Keyboard",
  // description можно не указывать
};

function printDesc(p: Product): void {
  const text = p.description ?? "(no description)";
  console.log(text);
}
```

`p.description` имеет тип `string | undefined`. Оператор `??` — из [`javascript-basic/19`](../javascript-basic/19-optional-nullish.md).

**Строгая опция** (`exactOptionalPropertyTypes` в tsconfig) — позже; на курсе помните: `?` ≠ «может быть null», если не указали `| null`.

## Intersection: «и то, и другое»

```typescript
interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

interface ProductCore {
  id: number;
  title: string;
  price: number;
}

type Product = ProductCore & Timestamps;

const item: Product = {
  id: 1,
  title: "Mouse",
  price: 29.99,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};
```

Intersection **объединяет** поля. Конфликт имён с несовместимыми типами даёт `never` на поле — редкий edge case.

### Расширение роли пользователя

```typescript
interface User {
  id: number;
  name: string;
}

type AdminUser = User & {
  role: "admin";
  permissions: string[];
};
```

Аналог spread объекта в JS, но на уровне типов.

## Union vs intersection в практике

```typescript
type ApiError = { ok: false; error: string };
type ApiSuccess<T> = { ok: true; data: T };
type ApiResult<T> = ApiSuccess<T> | ApiError;

function handle<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data; // сужение по discriminant `ok`
}
```

**Discriminated union** — общее поле-метка (`ok`, `status`, `type`) — идиома для ответов BFF перед разбором JSON с `:8090`.

## Объединение optional и union

```typescript
interface CartLine {
  productId: number;
  qty: number;
  note?: string | null;
}
```

Документируйте в команде: «отсутствует» vs `null` vs `""` — три семантики из javascript-basic и API design.

## Type aliases vs interfaces (preview)

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  id: number;
  status: ProductStatus;
}
```

Union литералов чаще через `type`; объекты — `interface` ([07-interfaces-objects.md](07-interfaces-objects.md)). `type` может описывать union примитивов; `interface` — нет.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [04. Литералы](04-primitives-literals.md) | члены union |
| [06. Лаба unions](06-lab-unions.md) | ProductStatus на практике |
| [08. Narrowing](08-narrowing.md) | `typeof`, discriminant |
| [07. Interfaces](07-interfaces-objects.md) | optional, readonly |
| [`api-design`](../api-design/README.md) | nullable в контрактах |

## Типичные ошибки

**Всё optional через `?` вместо `| null`.** API явно шлёт `"field": null` — тип должен включать `null`.

**Union без сужения — вызов общего метода.** `(x: Cat | Dog).bark()` — ошибка, если не у всех есть `bark`.

**Intersection дублирует несовместимые поля.** `A & B` где `id: string` и `id: number`.

**Путать `\|` и `&` в optional chain.** Union — альтернатива; intersection — наложение.

**Игнорировать `undefined` при `?.`.** Результат optional chain часто `T | undefined`.

**`string | "active"`** — избыточно; `"active"` уже подтип `string`.

## Резюме

**Union** моделирует альтернативы (`number | string`, статусы, success/error). **Intersection** склеивает контракты (`User & Admin`). **Optional `?`** — поле может отсутствовать. Согласуйте `null`/`undefined` с FastAPI **:8090**. Discriminated unions готовят к безопасному разбору ответов API.

## Чек-лист

- [ ] Чем `A | B` отличается от `A & B`?
- [ ] Когда `field?: string`, когда `field: string | null`?
- [ ] Напишите `ProductStatus` как union трёх литералов
- [ ] Что такое discriminant в `ApiResult`?
- [ ] Почему union требует narrowing перед `.toFixed()`?
- [ ] Как `??` работает с optional полем?

Следующий урок: [06. Лаба: union в shop-домене](06-lab-unions.md).
