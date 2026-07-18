# 07. Interfaces, объекты, readonly и index signatures

## Введение: сценарий с работы

Модель каталога shop в BFF: десять файлов импортируют `Product` из `types.ts`. Коллега добавил в **interface** поле `internalCost` — все потребители компилируются, но случайно логируют чувствительное поле в stdout CI. В другом PR кто-то **мутирует** `readonly` массив id через cast `(ids as number[]).push(1)` — типы обмануты, runtime позволяет.

Третий кейс: метаданные товара `attributes: { color?: string; size?: string; [key: string]: string }` — **index signature** для произвольных ключей из Django admin `:8092` / FastAPI `:8090`. Без index signature TS ругается на `attributes.material`. Interfaces — главный инструмент **structural** контрактов JSON, который вы начали в [01-landscape.md](01-landscape.md).

## Что вы узнаете

- Объявление **`interface`** и отличие от `type` (обзор).
- **`readonly`** для полей и массивов.
- **Optional** и **readonly** вместе.
- **Index signatures** `[key: string]: T`.
- **Excess property checking** при literal assignment.
- Расширение интерфейсов `extends`.
- Связь с объектами из [`javascript-basic/07-objects`](../javascript-basic/07-objects.md).

## Interface: контракт объекта

```typescript
interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  status: "active" | "archived" | "draft";
}
```

Использование:

```typescript
function printProduct(p: Product): void {
  console.log(`${p.sku}: ${p.title} — ${p.price}`);
}

const item: Product = {
  id: 1,
  sku: "KB-001",
  title: "Keyboard",
  price: 79.99,
  status: "active",
};
```

**Structural typing:** переменная с **лишними** полями совместима при присваивании **через переменную**:

```typescript
const fromApi = {
  id: 2,
  sku: "MS-002",
  title: "Mouse",
  price: 29.99,
  status: "active" as const,
  warehouse: "EU",
};

const p: Product = fromApi; // OK — лишнее warehouse не мешает
```

Но **literal** с лишним полем — ошибка:

```typescript
const bad: Product = {
  id: 3,
  sku: "X",
  title: "X",
  price: 1,
  status: "active",
  extra: true, // TS2353 excess property
};
```

## readonly: иммутабельность на уровне типов

```typescript
interface CatalogSnapshot {
  readonly generatedAt: string;
  readonly productIds: readonly number[];
}

const snap: CatalogSnapshot = {
  generatedAt: new Date().toISOString(),
  productIds: [1, 2, 3],
};

// snap.generatedAt = "x"; // error
// snap.productIds.push(4); // error
```

`readonly` не замораживает **вложенные** объекты глубоко — как `Object.freeze` shallow в JS. Для глубокой иммутабельности — `Readonly<T>` рекурсивно (utility types позже) или дисциплина кода.

Паттерн для ответа **GET /catalog** с `:8090`: не мутировать DTO после parse.

## Optional и readonly

```typescript
interface ProductDetail extends Product {
  readonly id: number;
  description?: string;
  specs?: Readonly<Record<string, string>>;
}
```

`extends` — intersection под капотом для полей.

## Index signatures

Когда ключи **динамические**, но значения одного типа:

```typescript
interface StringAttributes {
  [key: string]: string;
}

interface ProductAttributes {
  color?: string;
  size?: string;
  [key: string]: string | undefined;
}
```

Второй вариант: явные ключи + index; все явные поля должны быть совместимы с index (`string | undefined`).

```typescript
const attrs: ProductAttributes = {
  color: "black",
  material: "plastic",
};

function getAttr(a: ProductAttributes, name: string): string | undefined {
  return a[name];
}
```

Осторожно: index signature **ослабляет** проверку — опечатка `a.colour` вернёт `undefined`, не ошибку TS.

## interface vs type alias

| | `interface` | `type` |
|---|------------|--------|
| Объекты | идиоматично | да |
| Union `A \| B` | нет | да |
| Declaration merge | да (редко) | нет |
| extends | `extends` | `&` |

```typescript
type ProductStatus = "active" | "archived" | "draft";

interface Product {
  status: ProductStatus;
}
```

На курсе: **objects → interface**, **unions → type**.

## Расширение и композиция

```typescript
interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

interface Product extends Timestamps {
  id: number;
  title: string;
}

// эквивалентно Product = { id, title } & Timestamps
```

Как композиция Pydantic models в FastAPI — без наследования runtime.

## Имплементация interface классом (preview)

```typescript
interface Printable {
  format(): string;
}

class InvoiceLine implements Printable {
  constructor(
    public title: string,
    public price: number
  ) {}

  format(): string {
    return `${this.title}: ${this.price}`;
  }
}
```

`implements` проверяет **форму** — классы в [`javascript-basic/21-classes`](../javascript-basic/21-classes.md); углубление в nodejs-basic.

## JSON и interface

`interface` **не существует** в runtime. После `JSON.parse` объект **не проверен**:

```typescript
const raw: unknown = JSON.parse('{"id":1,"title":"Desk"}');
// (raw as Product).title — не валидация!
```

Контракт с `:8090` держите в **общей** спецификации; TS interface — зеркало для разработки. Runtime — Zod позже.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [05. Unions](05-unions-intersections.md) | поля union в interface |
| [08. Narrowing](08-narrowing.md) | `"key" in obj` |
| [09. Лаба objects](09-lab-objects.md) | каталог Product |
| [06. Лаба unions](06-lab-unions.md) | Product interface |
| [`javascript-basic/07`](../javascript-basic/07-objects.md) | ссылки, spread |

## Типичные ошибки

**Думать, что interface валидирует JSON.** Только compile-time.

**Excess property при object literal** — сюрприз для новичков; через переменную — тише.

**Index signature `[key: string]: any`.** Убивает типобезопасность.

**readonly + мутация через cast.** Обход системы — code smell.

**Дублировать interface вместо import.** Один `types/product.ts` в monorepo mock-exams.

**Путать optional `?` и `| undefined` в strictOptional.** Редкий strict флаг.

## Резюме

**Interface** описывает форму объекта для structural typing. **readonly** защищает от переприсваивания и push. **Index signatures** — динамические ключи attributes. **extends** композирует контракты. Literal assignment строже assign через переменную. Interfaces — основа моделей shop перед лабой каталога и клиентом к **:8090**.

## Чек-лист

- [ ] Чем literal assign отличается от assign через переменную (excess property)?
- [ ] Что делает `readonly` на массиве в interface?
- [ ] Когда нужен index signature?
- [ ] `interface` vs `type` для union — что выбрать?
- [ ] Почему `as Product` после parse — не валидация?
- [ ] Пример `interface` с optional и nullable полем

Следующий урок: [08. Сужение типов (narrowing)](08-narrowing.md).
