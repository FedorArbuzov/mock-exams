# 31. Лаба: разбиение на модули

Цель — **собрать мини-пакет** `shop/` из отдельных ES modules: публичный API через `index.js`, приватные хелперы внутри файлов, CLI-скрипт как потребитель. Это тот же цикл, что в реальном рефакторинге монолита из [30-es-modules.md](30-es-modules.md).

**Время:** ~25–35 минут после теории (~50–70 мин на пару 30+31).

## Стенд

```bash
cd courses/javascript-basic/examples
node --version   # v20+ или v22+
```

В `package.json` уже `"type": "module"`. Все пути import — **с расширением `.js`**.

Эталон — `solutions/lab/shop/` (открывайте **после** своей попытки).

---

## Архитектура

Создайте каталог `lab/shop/`:

```text
lab/
├── shop/
│   ├── index.js       # re-export публичного API
│   ├── cart.js        # Cart, CartItem (урок 22)
│   ├── catalog.js     # loadProducts, filterByCategory
│   ├── format.js      # formatPrice(amount, currency)
│   └── data/
│       └── products.json
└── 31-cli.js          # точка входа CLI
```

Можно скопировать `lab/data/products.json` из репозитория или создать свой с минимум 3 товарами (`id`, `name`, `price`, `category`).

---

## Задание 1. `format.js` — форматирование цены

```javascript
// lab/shop/format.js
export function formatPrice(amount, currency = "USD") {
  // Intl.NumberFormat, style: "currency"
}
```

**Проверка в REPL или временном файле:**

```javascript
import { formatPrice } from "./shop/format.js";
console.log(formatPrice(79.9, "USD"));  // $79.90
console.log(formatPrice(1234.5, "RUB")); // по локали ru-RU
```

Не экспортируйте внутренние константы локали, если они не нужны снаружи.

---

## Задание 2. `catalog.js` — загрузка каталога

Два допустимых способа (выберите один, задокументируйте в комментарии):

**A. readFile + JSON.parse** (практика `import.meta.url`):

```javascript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadProducts() {
  const path = join(__dirname, "data", "products.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}
```

**B. static import JSON** (Node 20+):

```javascript
import products from "./data/products.json" with { type: "json" };
export async function loadProducts() {
  return products;
}
```

Добавьте:

```javascript
export function filterByCategory(products, category) {
  return products.filter((p) => p.category === category);
}
```

---

## Задание 3. `cart.js` — корзина

Перенесите или перепишите из лабы 22:

```javascript
export class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    if (quantity < 1) throw new Error("quantity must be >= 1");
    if (unitPrice < 0) throw new Error("negative price");
    this.productId = productId;
    this.name = name;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  lineTotal() {
    return this.unitPrice * this.quantity;
  }
}

export class Cart {
  #items = new Map();

  add(item) { /* merge by productId */ }
  total() { /* sum line totals */ }
  toJSON() { /* массив для API */ }
}
```

**Не импортируйте** `catalog.js` из `cart.js` — иначе легко получить цикл.

---

## Задание 4. `index.js` — публичный фасад

```javascript
// lab/shop/index.js
export { Cart, CartItem } from "./cart.js";
export { loadProducts, filterByCategory } from "./catalog.js";
export { formatPrice } from "./format.js";
```

Внутренние функции (если появятся) — **без** re-export.

---

## Задание 5. CLI `31-cli.js`

```javascript
// lab/31-cli.js
import { Cart, CartItem, loadProducts, formatPrice } from "./shop/index.js";

const products = await loadProducts();
const cart = new Cart();

// TODO: добавьте 2 разных товара из products
// TODO: выведите каждую позицию и итог через formatPrice

console.log("Items:", cart.toJSON());
console.log("Total:", formatPrice(cart.total(), "USD"));
```

Запуск:

```bash
node lab/31-cli.js
```

**Ожидаемый вывод (пример):**

```text
Keyboard x1 — $79.90
Mouse x1 — $29.99
Items: [ ... ]
Total: $109.89
```

---

## Задание 6. Проверка графа зависимостей

В комментарии в `31-cli.js` нарисуйте ASCII-граф:

```text
31-cli.js → shop/index.js → cart.js, catalog.js, format.js
catalog.js → data/products.json (или fs)
```

Убедитесь: **нет** стрелки `cart.js → catalog.js`.

---

## Критерии успеха

- [ ] `node lab/31-cli.js` без ошибок
- [ ] `formatPrice(79.9, "USD")` → `$79.90`
- [ ] Публичный API только через `shop/index.js`
- [ ] Нет циклических import
- [ ] `Cart` использует `Map` для позиций
- [ ] В комментарии — граф модулей

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `ERR_MODULE_NOT_FOUND` | Расширение `.js` в import; путь относительно файла |
| `require is not defined` | Файл в ESM-пакете — только `import` |
| `JSON parse error` | UTF-8, валидный JSON в `products.json` |
| `Cart is not defined` | Re-export в `index.js`; import из `./shop/index.js` |
| Пустой каталог | `loadProducts` читает правильный путь через `import.meta.url` |

## Рефлексия (2–3 предложения в комментарии)

Ответьте себе: чем named export упростил бы рефакторинг, если переименуете `formatPrice` в `priceLabel`?

---

Следующий урок: [32. Обработка ошибок](32-error-handling.md).
