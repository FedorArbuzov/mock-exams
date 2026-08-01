# 37. Lab: collections and parsing

The goal is to tie **Map/Set**, **RegExp**, and **Intl** into one pipeline: group products, parse a log, and print a report to the console with `console.table` and a time measurement. Practice for chapters [34-map-set.md](34-map-set.md), [35-regex-json-date.md](35-regex-json-date.md), [36-debugging.md](36-debugging.md).

**Time:** ~30–40 minutes after the theory of block 34–36.

## Stand

```bash
cd courses/javascript-basic/examples
```

Create `lab/collections/` for reusable functions and `lab/37-report.js` as the entry point.

Data — `lab/data/products.json` (or from lab 31).

---

## Task 1. `groupBy`

File `lab/collections/group.js`:

```javascript
/**
 * @template T
 * @param {T[]} array
 * @param {(item: T) => string | number} keyFn
 * @returns {Map<string | number, T[]>}
 */
export function groupBy(array, keyFn) {
  // TODO: Map, not Object
}
```

**Test** — `lab/37-group-demo.js`:

```javascript
import products from "../data/products.json" with { type: "json" };
// or loadProducts from shop — if lab 31 is done

const byCat = groupBy(products, (p) => p.category);
console.log([...byCat.keys()]);
console.log(byCat.get("electronics")?.length);
```

**Criterion:** it returns exactly a `Map`, not a plain object.

---

## Task 2. `uniqueBy`

File `lab/collections/unique.js`:

```javascript
/**
 * The first element for each key keyFn(item).
 * @template T
 */
export function uniqueBy(array, keyFn) {
  // TODO: Map or Set + filter
}
```

Example:

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

## Task 3. `parseLogLines`

File `lab/collections/log-parser.js`.

Input — a multiline string:

```text
2024-06-18T10:00:00Z INFO app started
2024-06-18T10:00:01Z ERROR db connection user=7 failed
2024-06-18T10:00:02Z WARN slow query took 1200ms
2024-06-18T10:00:03Z ERROR auth denied user=42
```

Line format:

```text
<ISO-UTC> <LEVEL> <message...>
```

Optionally in the message: `user=<digits>`.

```javascript
/**
 * @returns {{ time: string, level: string, message: string, userId?: number }[]}
 */
export function parseLogLines(text) {
  const lineRe =
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(INFO|WARN|ERROR)\s+(.+)$/;
  const userRe = /user=(\d+)/;

  // TODO: split lines, match, extract userId if present
}
```

**Verification:**

```javascript
const logs = parseLogLines(sample);
console.log(logs[1].level);           // ERROR
console.log(logs[1].userId);          // 7
console.log(logs[0].userId);          // undefined
```

Empty lines in the input — skip them.

---

## Task 4. `summarizeByCategory`

File `lab/collections/summary.js`:

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

## Task 5. The report `37-report.js`

Assemble the pipeline:

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

// 2. formatting sum via Intl
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

Run:

```bash
node lab/37-report.js
```

---

## Task 6. A debugging experiment

Add an **intentional bug** — in `groupBy` use a plain object instead of a Map once. Run the report, localize it via the stack trace or `console.log(typeof result)`. Fix it. In a comment in `37-report.js` — 1–2 sentences on what broke.

---

## Task 7. Dedupe tags (optional)

```javascript
const tags = ["js", "web", "js", "api", "web"];
const unique = [...new Set(tags)];
console.log(unique.join(", "));
```

Move it into `lab/collections/tags.js` as `uniqueTags(tags)` if you want a bonus.

---

## Success criteria

- [ ] `groupBy` returns a `Map`
- [ ] `uniqueBy` keeps the **first** occurrence
- [ ] Regex extracts the optional `userId`
- [ ] `37-report.js` uses `console.table` and `console.time`/`timeEnd`
- [ ] At least one sum via `Intl.NumberFormat`
- [ ] All modules — ES import/export with `.js`

## If something went wrong

| Symptom | What to check |
|---------|----------|
| `match` is always null | Anchors `^` `$`; trim the lines |
| `userId` is a string | `Number(um[1])` |
| `console.table` is empty | `rows` is not empty; object keys |
| `JSON parse` fails | the path to `products.json` |
| Map serializes to `{}` | for the table, convert to an array of objects |

## Reflection

Answer in a comment: when would you choose `Object.groupBy` (if available) for grouping instead of your own `groupBy`?

---

Next lesson: [38. Interview Q&A](38-interview-qa.md).
