# 09. Лаба: типизированный каталог товаров

## Зачем эта лаба

В [`javascript-basic/09-lab-objects-arrays`](../javascript-basic/09-lab-objects-arrays.md) вы грузили `products.json` и ловили shallow copy. Здесь — **типизированный** каталог shop: `interface Product`, union статусов, `readonly` snapshot, narrowing для «сырого» JSON. Это мини-модель данных, которую в `nodejs-basic` подключат к FastAPI **:8090**; пока источник — локальный файл или inline массив.

Навыки:

1. Собрать **модуль типов** и функции поверх него.
2. Отделить **DTO** (как пришло) от **доменной** логики (фильтры, цены).
3. Применить **type guard** к `unknown` после `JSON.parse`.

## Предварительно

- Прочитаны [07](07-interfaces-objects.md) и [08](08-narrowing.md).
- Пройдены [06-lab-unions](06-lab-unions.md).
- Каталог: `courses/typescript-basic/examples/`.

```bash
cd courses/typescript-basic/examples
mkdir -p lab/data
```

Создайте `lab/data/products.json`:

```json
[
  {
    "id": 1,
    "sku": "KB-001",
    "title": "Keyboard",
    "price": 79.99,
    "status": "active",
    "discount": null,
    "category": "electronics"
  },
  {
    "id": 2,
    "sku": "MS-002",
    "title": "Mouse",
    "price": 29.99,
    "status": "active",
    "discount": 5,
    "category": "electronics"
  },
  {
    "id": 3,
    "sku": "DS-010",
    "title": "Desk",
    "price": 199.0,
    "status": "archived",
    "discount": null,
    "category": "furniture"
  }
]
```

---

## Задание 1. Модуль типов

`lab/09-types.ts`:

```typescript
export type ProductStatus = "active" | "archived" | "draft";

export interface Product {
  readonly id: number;
  sku: string;
  title: string;
  price: number;
  status: ProductStatus;
  discount: number | null;
  category: string;
}

export type Catalog = readonly Product[];
```

Экспортируйте типы для использования в других файлах лабы.

---

## Задание 2. Загрузка и guard

`lab/09-load-catalog.ts`:

```typescript
import { readFileSync } from "node:fs";
import type { Catalog, Product, ProductStatus } from "./09-types.js";

const VALID_STATUSES: ProductStatus[] = ["active", "archived", "draft"];

function isProductStatus(s: string): s is ProductStatus {
  return (VALID_STATUSES as string[]).includes(s);
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.sku === "string" &&
    typeof o.title === "string" &&
    typeof o.price === "number" &&
    typeof o.status === "string" &&
    isProductStatus(o.status) &&
    (o.discount === null || typeof o.discount === "number") &&
    typeof o.category === "string"
  );
}

function loadCatalog(path: string): Catalog {
  const raw: unknown = JSON.parse(readFileSync(path, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("Catalog must be an array");
  }
  const products: Product[] = [];
  for (const item of raw) {
    if (!isProduct(item)) {
      throw new Error("Invalid product in catalog");
    }
    products.push(item);
  }
  return products;
}

const catalog = loadCatalog("lab/data/products.json");
console.log("Loaded:", catalog.length, "products");
```

```bash
npx tsx lab/09-load-catalog.ts
```

**Критерий:** `Loaded: 3 products`. Испортите один `status` в JSON — скрипт должен бросить.

---

## Задание 3. Фильтры и effective price

`lab/09-catalog-utils.ts`:

```typescript
import type { Catalog, Product } from "./09-types.js";

export function filterActive(catalog: Catalog): Product[] {
  return catalog.filter((p) => p.status === "active");
}

export function effectivePrice(p: Product): number {
  if (p.discount === null) {
    return p.price;
  }
  return Math.max(0, p.price - p.discount);
}

export function totalActiveValue(catalog: Catalog): number {
  return filterActive(catalog).reduce((sum, p) => sum + effectivePrice(p), 0);
}
```

`lab/09-report.ts`:

```typescript
import { loadCatalog } from "./09-load-catalog.js"; // вынесите loadCatalog в export или скопируйте импорт catalog
import { filterActive, totalActiveValue } from "./09-catalog-utils.js";

// Упростите: импортируйте catalog из одного места
```

Практичнее: в `09-load-catalog.ts` добавьте `export { loadCatalog }` и в report:

```typescript
import { loadCatalog } from "./09-load-catalog.js";
import { filterActive, totalActiveValue } from "./09-catalog-utils.js";

const catalog = loadCatalog("lab/data/products.json");
const active = filterActive(catalog);
console.log("Active:", active.map((p) => p.sku).join(", "));
console.log("Total value (active):", totalActiveValue(catalog).toFixed(2));
```

Ожидаемо: `KB-001, MS-002` и сумма `79.99 + 24.99 = 104.98`.

---

## Задание 4. Index signature для атрибутов (опционально)

`lab/09-attributes.ts`:

```typescript
interface ProductAttributes {
  color?: string;
  warranty?: string;
  [key: string]: string | undefined;
}

function formatAttributes(attrs: ProductAttributes): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

console.log(formatAttributes({ color: "black", material: "plastic" }));
```

---

## Задание 5. Связь с :8090 (комментарий)

В `lab/09-notes.md` кратко ответьте (5–10 предложений):

1. Чем этот `Product` похож на ответ `GET /api/v1/items` FastAPI?
2. Чего **не хватает** по сравнению с Pydantic на backend?
3. Какой следующий шаг в `nodejs-basic` для реального HTTP?

---

## Критерии успеха

- [ ] Типы в `09-types.ts`; `Catalog` readonly
- [ ] `loadCatalog` принимает только валидный JSON
- [ ] `filterActive` и `totalActiveValue` — корректные числа
- [ ] `tsc --noEmit` без ошибок по `lab/09-*.ts`
- [ ] `09-notes.md` — связь с mock-exams :8090

## Если что-то пошло не так

| Симптом | Направление |
|---------|-------------|
| ENOENT products.json | путь от `examples/`; cwd при `tsx` |
| Invalid product | проверьте `status` и типы в JSON |
| Cannot assign readonly | `Catalog` readonly — возвращайте новый массив из filter |
| import .js в .ts | `moduleResolution: NodeNext` — расширение `.js` в import |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| Следующие главы typescript-basic | generics, tsconfig strict flags |
| `nodejs-basic` | `fetch` к :8090, shared types |
| [`javascript-basic/09`](../javascript-basic/09-lab-objects-arrays.md) | тот же домен без типов |
| [`fastapi`](../fastapi/README.md) | источник контракта |

Поздравляем с блоком **типы + объекты** в typescript-basic. Дальше по плану курса — generics, utility types, `strict` flags; по [`javascript-path`](../javascript-path.md) — углубление TS и переход к Node.

Следующий урок (по плану курса): **10. Массивы и tuple** *(файл будет добавлен в следующих итерациях курса)*.

## Чек-лист

- [ ] Модуль типов отделён от логики
- [ ] `isProduct` сужает `unknown` → `Product`
- [ ] Понимаете readonly snapshot каталога
- [ ] Умеете объяснить gap между TS interface и Pydantic
- [ ] Готовы подключить реальный API на :8090 в nodejs-basic
