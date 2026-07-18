# 18. Лаба: иерархия классов Product

## Зачем эта лаба

Закрепляете [16-classes](16-classes.md) и [javascript-basic/21-classes](../javascript-basic/21-classes.md): `Product`, `DiscountProduct`, `Sellable`, `#stock` в `Inventory`. Категории из [17-enums-const](17-enums-const.md). `toJSON` / `fromDto` — мост к POST на FastAPI `:8090` (`title` vs `name`).

**Время:** ~50–65 минут.

---

## Структура

```text
lab/catalog-constants.ts  sellable.ts  product.ts
lab/discount-product.ts  inventory.ts  18-demo.ts
```

---

## Задание 1. Константы категорий

```typescript
export const Category = {
  Electronics: "electronics",
  Furniture: "furniture",
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export const CATEGORY_LABELS = {
  [Category.Electronics]: "Электроника",
  [Category.Furniture]: "Мебель",
} as const satisfies Record<Category, string>;
```

---

## Задание 2. `Sellable` и `Product`

`Product implements Sellable`: parameter properties, getter/setter `price`, `describe()`, `toJSON()`, `static fromDto(dto)` — `title` → `name`, category validate через `Object.values(Category)`.

---

## Задание 3. `DiscountProduct`

`extends Product`, `discountRate` 0..1, `override displayPrice` и `describe()`.

---

## Задание 4. `Inventory`

`#stock = new Map<number, number>()`, `restock`, `reserve` — quantity > 0, boolean при нехватке остатка.

---

## Задание 5. Демо

```typescript
const kb = new Product(1, "Keyboard", 100, Category.Electronics, "KB-001");
const sale = new DiscountProduct(2, "Mouse", 50, Category.Electronics, "MS-01", 0.2);
console.log(sale.displayPrice); // $40.00

const inv = new Inventory();
inv.restock(1, 10);
console.log(inv.reserve(1, 3)); // true, stock 7
```

```bash
npx tsc && node dist/lab/18-demo.js
```

---

## Задание 6 (опционально). `isSellable`

User-defined guard для `unknown` — [19-type-guards](19-type-guards.md).

---

## Критерии успеха

- [ ] `implements Sellable`; `override` на наследнике
- [ ] `#stock` недоступен снаружи
- [ ] `fromDto` валидирует category
- [ ] `toJSON` без лишних полей для POST

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `Category` не принимает string | guard + `Object.values` |
| `implements` на displayPrice | добавить getter |
| `protected _price` | используйте `this.price` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [19-type-guards](19-type-guards.md) | `isSellable` |
| [29-fetch](../javascript-basic/29-fetch.md) | POST items :8090 |

Следующий урок: [19. Type guards](19-type-guards.md).

## Чек-лист

- [ ] `#` vs `private` — осознанный выбор
- [ ] DTO mapper `title` → `name`
- [ ] `satisfies` на labels
