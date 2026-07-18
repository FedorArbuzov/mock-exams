# 09. Лаба: объекты и массивы

## Зачем эта лаба

Ответ `GET http://localhost:8090/api/v1/items` от FastAPI — JSON: массив объектов с `id`, `title`, `price`. React-админка shop и Node BFF **не видят** Pydantic models — только **plain JavaScript objects** после `JSON.parse` или `res.json()`. До [29-fetch.md](29-fetch.md) и стенда `:8090` вы моделируете тот же **домен каталога** локально: `products.json` + функции `filter`, `map`, `reduce`.

Лаба связывает [07-objects.md](07-objects.md) и [08-arrays.md](08-arrays.md) в мини-pipeline:

```text
products.json  →  parse  →  query/filter  →  aggregate  →  immutable update
```

Это тот же data flow, что в [`fastapi/06-lab-crud`](../fastapi/06-lab-crud.md) и django catalog, но без HTTP — чтобы ошибки были **ваши** (shallow copy, mutate sort), а не «CORS» или «502».

**Иммутабельность** в задании 4 — репетиция React state: `applyDiscount` не должен менять массив, который «пришёл с сервера» и лежит в кэше. **Shallow trap** в задании 5 — репетиция code review «мы же скопировали spread».

## Предварительно

- Прочитаны [07. Объекты](07-objects.md) и [08. Массивы](08-arrays.md).
- `"type": "module"` в [`examples/package.json`](examples/package.json) — задания 2+ могут использовать `export`/`import`.
- Рабочая директория:

```bash
cd courses/javascript-basic/examples
```

---

## Подготовка данных

Создайте `lab/data/products.json`:

```json
[
  { "id": 1, "name": "Keyboard", "price": 79.99, "category": "electronics" },
  { "id": 2, "name": "Mouse", "price": 29.99, "category": "electronics" },
  { "id": 3, "name": "Desk", "price": 199.0, "category": "furniture" }
]
```

Структура сознательно близка к items shop API; поля `name` vs `title` — в реальном OpenAPI `:8090` может быть `title` — при интеграции сделаете mapper `{ ...item, name: item.title }`.

---

## Задание 1. Загрузка и обзор

**Контекст:** offline CLI `node scripts/export-catalog.js` читает snapshot JSON так же, как позже прочитает ответ API в файл.

`lab/09-load.js`:

```javascript
import { readFileSync } from "node:fs";

const raw = readFileSync("lab/data/products.json", "utf-8");
const products = JSON.parse(raw);

console.log("count:", products.length);
console.log("first:", products[0].name);
console.log("categories:", [...new Set(products.map((p) => p.category))]);
```

```bash
node lab/09-load.js
```

**Критерий:** `count: 3`, first name, два category без ошибок. Если `ENOENT` — вы не в `examples/` или нет `lab/data/products.json`.

Опционально: оберните `JSON.parse` в try/catch ([32-error-handling.md](32-error-handling.md)) и выведите понятное сообщение.

---

## Задание 2. Фильтр и map

**Контекст:** UI block «Electronics under €50» — типичный `filter` + `map` на клиенте до server-side pagination ([`fastapi/17-pagination`](../fastapi/17-pagination-filters.md)).

`lab/09-query.js`:

```javascript
export function filterByCategory(products, category) {
  // return new array, do not mutate products
}

export function namesUnderPrice(products, maxPrice) {
  // names (strings) where price < maxPrice, preserve order
}
```

Проверка в том же файле или `lab/09-query-run.js`:

```javascript
import { readFileSync } from "node:fs";
import { filterByCategory, namesUnderPrice } from "./09-query.js";

const products = JSON.parse(
  readFileSync("lab/data/products.json", "utf-8")
);

console.log(filterByCategory(products, "electronics").length); // 2
console.log(namesUnderPrice(products, 50)); // ["Mouse"]
```

Если `import assert { type: "json" }` поддерживается вашим Node — можно импортировать JSON напрямую; иначе `readFileSync` — канонично для курса.

---

## Задание 3. Reduce: сумма по категориям

**Контекст:** dashboard «inventory value by category» для merchandising.

```javascript
export function totalByCategory(products) {
  // return { electronics: 109.98, furniture: 199 }
  // use reduce; optional round to 2 decimals
}
```

```javascript
console.log(totalByCategory(products));
// { electronics: 109.98, furniture: 199 }
// 79.99 + 29.99 = 109.98
```

**Подсказка:** начальное значение reduce `{}`; не забыть `return acc`. Floating point: `Math.round(x * 100) / 100`.

---

## Задание 4. Иммутабельное обновление

**Контекст:** flash sale −10% — UI показывает новые цены, но **кэш** исходного catalog не должен измениться (TanStack Query, Redux — позже).

```javascript
export function applyDiscount(products, percent) {
  // NEW array; each product NEW object; price reduced by percent%;
  // original products unchanged (shallow check: products[0] same ref ok,
  // but products[0].price must match JSON before call)
}
```

Проверка:

```javascript
const snapshot = JSON.parse(JSON.stringify(products));
const discounted = applyDiscount(products, 10);
console.log(products[0].price === snapshot[0].price); // true
console.log(discounted[0].price < snapshot[0].price);   // true
console.log(discounted !== products);                   // true
```

Используйте `map` + spread `{ ...p, price: newPrice }`, не `products[i].price = …`.

---

## Задание 5. Shallow trap

**Контекст:** «мы склонировали config» — но nested `meta` общий; баг как в intro [07-objects.md](07-objects.md).

`lab/09-shallow.js` — код:

```javascript
const a = { meta: { views: 1 }, name: "Keyboard" };
const b = { ...a };
b.name = "Mouse";
b.meta.views = 99;
console.log(a.name);        // ?
console.log(a.meta.views);  // ?
```

**В комментарии (5–8 предложений):** фактический вывод, почему `name` и `views` ведут себя по-разному, как исправить для nested (`structuredClone`, deep path copy). Связь с `applyDiscount` — почему spread по product достаточен для flat `price`, но не для nested `meta`.

Запустите файл и сверьте с предсказанием.

---

## Задание 6 (опционально). Сортировка витрины

```javascript
export function sortByName(products) {
  // return NEW array sorted by name localeCompare; do not mutate input
}
```

Используйте `toSorted` (ES2023) или `[...products].sort(...)`. Проверьте, что `products` после вызова в исходном порядке.

---

## Критерии успеха

- [ ] JSON читается без падения из `examples/`
- [ ] `filterByCategory` / `namesUnderPrice` — без мутации входа
- [ ] `totalByCategory` — объект с ключами `electronics` и `furniture` для sample data
- [ ] `applyDiscount` не меняет `products[0].price` до вызова
- [ ] Комментарий в `09-shallow.js` объясняет nested shared reference
- [ ] В коде есть хотя бы один chain `filter`/`map`/`reduce`, не только `for`

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `ENOENT lab/data/products.json` | `cd examples`; создайте JSON |
| `applyDiscount` меняет original | мутируете in place; используйте `map` + new objects |
| `109.98000000000002` в reduce | округление cents |
| `import` SyntaxError | запуск из `examples/` с `"type": "module"` |
| `filterByCategory` возвращает 3 | сравнение category case-sensitive; `"Electronics"` ≠ `"electronics"` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [10. Функции](10-functions.md) | export functions, чистые функции |
| [17. Destructuring](17-destructuring-spread.md) | `{ ...p }` в applyDiscount |
| [29. fetch](29-fetch.md) | products с `:8090` вместо файла |
| [31. Lab modules](31-lab-modules.md) | разбиение query на файлы |
| [`deploy/fastapi` items API](../../deploy/fastapi/README.md) | реальный JSON контракт |

Следующий урок (теория): [10. Функции](10-functions.md).
