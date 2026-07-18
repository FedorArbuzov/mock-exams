# 37. Лаба: коллекции и парсинг

Цель — связать **Map/Set**, **RegExp** и **Intl** в один pipeline: сгруппировать товары, распарсить лог, вывести отчёт в консоль с `console.table` и замером времени. Практика глав [34-map-set.md](34-map-set.md), [35-regex-json-date.md](35-regex-json-date.md), [36-debugging.md](36-debugging.md).

**Время:** ~30–40 минут после теории блока 34–36.

## Стенд

```bash
cd courses/javascript-basic/examples
```

Создайте `lab/collections/` для переиспользуемых функций и `lab/37-report.js` как entry point.

Данные — `lab/data/products.json` (или из лабы 31).

---

## Задание 1. `groupBy`

Файл `lab/collections/group.js`:

```javascript
/**
 * @template T
 * @param {T[]} array
 * @param {(item: T) => string | number} keyFn
 * @returns {Map<string | number, T[]>}
 */
export function groupBy(array, keyFn) {
  // TODO: Map, не Object
}
```

**Тест** — `lab/37-group-demo.js`:

```javascript
import products from "../data/products.json" with { type: "json" };
// или loadProducts из shop — если лаба 31 сделана

const byCat = groupBy(products, (p) => p.category);
console.log([...byCat.keys()]);
console.log(byCat.get("electronics")?.length);
```

**Критерий:** возвращается именно `Map`, не plain object.

---

## Задание 2. `uniqueBy`

Файл `lab/collections/unique.js`:

```javascript
/**
 * Первый элемент на каждый ключ keyFn(item).
 * @template T
 */
export function uniqueBy(array, keyFn) {
  // TODO: Map или Set + filter
}
```

Пример:

```javascript
const items = [
  { id: 1, tag: "js" },
  { id: 2, tag: "web" },
  { id: 3, tag: "js" },
];
uniqueBy(items, (x) => x.tag);
// [{ id: 1, tag: "js" }, { id: 2, tag: "web" }]
```

---

## Задание 3. `parseLogLines`

Файл `lab/collections/log-parser.js`.

Вход — многострочная строка:

```text
2024-06-18T10:00:00Z INFO app started
2024-06-18T10:00:01Z ERROR db connection user=7 failed
2024-06-18T10:00:02Z WARN slow query took 1200ms
2024-06-18T10:00:03Z ERROR auth denied user=42
```

Формат строки:

```text
<ISO-UTC> <LEVEL> <message...>
```

Опционально в message: `user=<digits>`.

```javascript
/**
 * @returns {{ time: string, level: string, message: string, userId?: number }[]}
 */
export function parseLogLines(text) {
  const lineRe =
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(INFO|WARN|ERROR)\s+(.+)$/;
  const userRe = /user=(\d+)/;

  // TODO: split lines, match, extract userId если есть
}
```

**Проверка:**

```javascript
const logs = parseLogLines(sample);
console.log(logs[1].level);           // ERROR
console.log(logs[1].userId);          // 7
console.log(logs[0].userId);          // undefined
```

Пустые строки в input — пропускать.

---

## Задание 4. `summarizeByCategory`

Файл `lab/collections/summary.js`:

```javascript
import { groupBy } from "./group.js";

export function summarizeByCategory(products) {
  const grouped = groupBy(products, (p) => p.category);
  const rows = [];
  for (const [category, list] of grouped) {
    const sum = list.reduce((acc, p) => acc + p.price, 0);
    rows.push({ category, count: list.length, sum });
  }
  return rows.sort((a, b) => a.category.localeCompare(b.category));
}
```

---

## Задание 5. Отчёт `37-report.js`

Соберите pipeline:

```javascript
// lab/37-report.js
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { summarizeByCategory } from "./collections/summary.js";
import { parseLogLines } from "./collections/log-parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.time("37-report");

// 1. products
const productsPath = join(__dirname, "data", "products.json");
const products = JSON.parse(await readFile(productsPath, "utf8"));

const rows = summarizeByCategory(products);
console.log("\n=== By category ===");
console.table(rows);

// 2. форматирование sum через Intl
const formatMoney = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

console.log("Total inventory value:", formatMoney(rows.reduce((a, r) => a + r.sum, 0)));

// 3. logs
const sampleLog = `2024-06-18T10:00:00Z INFO app started
2024-06-18T10:00:01Z ERROR db connection user=7 failed
2024-06-18T10:00:03Z ERROR auth denied user=42`;

const errors = parseLogLines(sampleLog).filter((l) => l.level === "ERROR");
console.log("\n=== ERROR lines ===");
console.table(errors);

console.timeEnd("37-report");
```

Запуск:

```bash
node lab/37-report.js
```

---

## Задание 6. Отладочный эксперимент

Добавьте **намеренный баг** — в `groupBy` один раз используйте plain object вместо Map. Запустите отчёт, локализуйте через stack trace или `console.log(typeof result)`. Исправьте. В комментарии в `37-report.js` — 1–2 предложения, что сломалось.

---

## Задание 7. Dedupe тегов (опционально)

```javascript
const tags = ["js", "web", "js", "api", "web"];
const unique = [...new Set(tags)];
console.log(unique.join(", "));
```

Вынесите в `lab/collections/tags.js` как `uniqueTags(tags)` если хотите бонус.

---

## Критерии успеха

- [ ] `groupBy` возвращает `Map`
- [ ] `uniqueBy` сохраняет **первое** вхождение
- [ ] Regex извлекает optional `userId`
- [ ] `37-report.js` использует `console.table` и `console.time`/`timeEnd`
- [ ] Хотя бы одна сумма через `Intl.NumberFormat`
- [ ] Все модули — ES import/export с `.js`

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `match` всегда null | Якоря `^` `$`; trim строк |
| `userId` string | `Number(um[1])` |
| `console.table` пустой | `rows` не пустой; keys объекта |
| `JSON parse` fail | путь к `products.json` |
| Map сериализуется `{}` | для table конвертируйте в массив объектов |

## Рефлексия

Ответьте в комментарии: когда для группировки вы бы выбрали `Object.groupBy` (если доступен) вместо своего `groupBy`?

---

Следующий урок: [38. Interview Q&A](38-interview-qa.md).
