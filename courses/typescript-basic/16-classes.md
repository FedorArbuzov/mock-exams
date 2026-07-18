# 16. Классы с типами: `implements`, private, модификаторы

## Сценарий с работы

Вы переносите [javascript-basic/21-classes](../javascript-basic/21-classes.md) в TypeScript: `DiscountProduct extends Product`, приватный `#stock`, интерфейс `Sellable`. На review: «Почему `implements` не дублирует поля?», «Зачем `private` в TS, если в JS уже `#`?», «Почему `readonly` в parameter property ломает присвоение снаружи?»

Классы в TS — runtime JS **плюс** проверка на compile-time; `implements` не генерирует код, но держит контракт.

## Что вы узнаете

- Классы с **типами полей** и **модификаторами**
- **`implements`** для interface
- **`private` (#)** vs **`private` (TS)** vs **`protected`**
- **Parameter properties**, **abstract class**, **generic class**
- Когда class vs interface/type

---

## Базовый класс с типами

```typescript
class Product {
  constructor(
    public readonly id: number,
    public name: string,
    private _price: number,
    public category: string
  ) {
    if (_price < 0) throw new Error("price cannot be negative");
  }

  get price(): number {
    return this._price;
  }

  set price(value: number) {
    if (value < 0) throw new Error("price cannot be negative");
    this._price = value;
  }

  describe(): string {
    return `${this.name} (${this.id})`;
  }
}
```

**Parameter properties:** `public readonly id` — поле + присвоение в одной строке.

---

## `implements`: контракт без копирования

```typescript
interface Sellable {
  readonly price: number;
  describe(): string;
}

class PhysicalProduct extends Product implements Sellable {
  constructor(
    id: number,
    name: string,
    price: number,
    category: string,
    public sku: string
  ) {
    super(id, name, price, category);
  }
}
```

| | `extends` | `implements` |
|---|-----------|--------------|
| Наследование | Да | Нет |
| Runtime | Код | **Стирается** |

---

## Private: три уровня

```typescript
class Inventory {
  #warehouseStock = new Map<number, number>();

  private log(msg: string): void {
    console.log(msg);
  }

  protected adjust(id: number, delta: number): void {
    const cur = this.#warehouseStock.get(id) ?? 0;
    this.#warehouseStock.set(id, cur + delta);
  }
}
```

| Модификатор | Compile-time | Runtime |
|-------------|--------------|---------|
| `#field` | Класс | Настоящая приватность |
| `private` | TS | Публичное в JS |
| `protected` | Класс + наследники | Публичное в JS |

**В продакшене** для npm-пакетов — `#` если нужна runtime-гарантия.

---

## Наследование с типами

```typescript
class DiscountProduct extends Product {
  constructor(
    id: number,
    name: string,
    price: number,
    category: string,
    public readonly discountRate: number
  ) {
    super(id, name, price, category);
    if (discountRate < 0 || discountRate > 1) {
      throw new Error("discountRate must be 0..1");
    }
  }

  get displayPrice(): number {
    return this.price * (1 - this.discountRate);
  }

  override describe(): string {
    return `${super.describe()} -${this.discountRate * 100}%`;
  }
}
```

`override` ловит опечатки в имени метода при `noImplicitOverride`.

---

## Static members

```typescript
class Product {
  static fromDto(dto: { id: number; title: string; price: number }): Product {
    return new Product(dto.id, dto.title, dto.price, "general");
  }

  static isValidPrice(n: number): boolean {
    return Number.isFinite(n) && n >= 0;
  }
}
```

Маппинг `title` → `name` для ответа `:8090` — граница DTO / домен.

---

## Abstract class

```typescript
abstract class CatalogEntity {
  abstract get displayName(): string;
  log(): void {
    console.log(this.displayName);
  }
}
```

Нельзя `new CatalogEntity()` — только подклассы.

---

## Generic class

```typescript
class IdentifiedBox<T extends { id: number }> {
  constructor(private item: T) {}
  get(): T { return this.item; }
}
```

Связь с [13-generics](13-generics.md), [15-lab-generics](15-lab-generics.md).

---

## Класс vs interface vs type

| Сущность | Когда |
|----------|-------|
| `interface` | Форма, контракт, `implements` |
| `type` | Union, mapped, tuple |
| `class` | Runtime, `new`, инварианты |

DTO JSON — interface/type; `Product` с валидацией — class.

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [javascript-basic/21-classes](../javascript-basic/21-classes.md) | prototype, `#` |
| [18-lab-classes](18-lab-classes.md) | Product hierarchy |
| [22-lab-oop](../javascript-basic/22-lab-oop.md) | Cart JS → TS |

---

## Типичные ошибки

| Ошибка | Причина | Исправление |
|--------|---------|-------------|
| Ждать поля от `implements` | Interface не создаёт поля | Объявить в классе |
| `private` для секретов в lib | Стирание в JS | `#` |
| Забыть `super()` | Правило наследника | До `this` |
| Геттер + рекурсивный сеттер | `this.price = v` | Внутреннее `_price` |

---

## В продакшене

- DTO от `:8090` — interfaces; домен с инвариантами — classes.
- `toJSON()` — явные поля для POST, не spread class instance с лишним.
- Стрелки как поля класса — память на экземпляр ([javascript-basic/21-classes](../javascript-basic/21-classes.md)).

---

## Резюме

TS-классы добавляют типы, модификаторы и `implements`. `#` — runtime приватность; `private`/`protected` — в основном compile-time. Parameter properties сокращают boilerplate.

---

## Чек-лист

- Чем `implements Sellable` отличается от `extends Product`?
- Почему `#stock` предпочтительнее `private stock`?
- Что делает `public readonly id` в constructor?
- Когда достаточно `type Product = { ... }`?

Следующий урок: [17. Enum, const assertions, satisfies](17-enums-const.md).
