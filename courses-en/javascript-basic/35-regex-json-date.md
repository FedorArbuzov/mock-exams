# 35. RegExp, JSON, Date, Math

## A scenario from work

A log file lands on your desk — you need to pull out the timestamp, the level, and `user=42`. An API returns JSON with dates as strings; the frontend shows "Invalid Date". A report has amounts that "drift" because of `0.1 + 0.2`. Three tools you'll use daily: **regular expressions** for text, **JSON** for data exchange, **Date** and **Intl** for time and locale.

This chapter won't make you a regex guru — the goal is to **confidently read and write simple patterns**, parse JSON safely, and avoid the classic timezone traps.

## RegExp — literal and constructor

```javascript
const re1 = /user=(\d+)/;
const re2 = new RegExp("user=(\\d+)");

const line = "2024-06-18T10:00:01Z ERROR db connection user=7 failed";
const match = line.match(re1);

console.log(match[0]); // user=7
console.log(match[1]); // 7 — first capture group
```

| Approach | When |
|--------|-------|
| `/pattern/flags` | pattern is known at code time |
| `new RegExp(string, flags)` | pattern is built from variables |

### Flags

| Flag | Meaning |
|------|----------|
| `g` | global — all matches, not just the first |
| `i` | ignore case |
| `m` | multiline — `^`/`$` match on every line |
| `u` | unicode |
| `s` | dotAll — `.` matches newlines too |

```javascript
"a1b2c3".match(/\d/g); // ["1", "2", "3"]
"User".match(/user/i);  // matches
```

### Core string and RegExp methods

```javascript
const text = "order-123 shipped";

/order-(\d+)/.test(text);           // true
text.match(/order-(\d+)/);          // array or null
text.replace(/order-(\d+)/, "ORD-$1"); // order-123 → ORD-123
"a, b , c".split(/,\s*/);           // ["a", "b", "c"]
```

**Capture groups** — parentheses `()`:

```javascript
const logRe =
  /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(INFO|WARN|ERROR)\s+(.+)$/;

const m = "2024-06-18T10:00:00Z INFO app started".match(logRe);
// m[1] — timestamp, m[2] — level, m[3] — message
```

An optional group inside the message:

```javascript
const errRe = /user=(\d+)/;
const msg = "db connection user=7";
const um = msg.match(errRe);
const userId = um ? Number(um[1]) : undefined;
```

### Global regex and lastIndex

```javascript
const re = /a/g;
re.test("aba"); // true
re.test("aba"); // true — lastIndex has moved
re.lastIndex;   // position
```

With `g`, the same regex object is **stateful** — for loops, people often create a fresh one or use `matchAll`:

```javascript
for (const m of "a1b2".matchAll(/\d/g)) {
  console.log(m[0], m.index);
}
```

### What not to do with regex

- **Full email validation** with a single regex — an anti-pattern; use a library or a simple `@` check plus server-side verification.
- **Parsing HTML/XML** with regex — fragile; you need a DOM parser.
- **Complex JSON** with regex — use `JSON.parse` instead.

## JSON — data exchange

JavaScript Object Notation — a subset of JS syntax for **serializing data** (not code).

### JSON.stringify

```javascript
const order = {
  id: 42,
  items: [{ sku: "KB", qty: 1 }],
  note: undefined,
  created: new Date("2024-06-18T10:00:00Z"),
};

JSON.stringify(order);
// {"id":42,"items":[{"sku":"KB","qty":1}],"created":"2024-06-18T10:00:00.000Z"}
```

| JS value | In JSON |
|-------------|--------|
| string, number, boolean, null | as-is |
| object, array | recursively |
| `undefined`, function, Symbol | **omitted** (in objects) or `null` (in arrays) |
| `NaN`, `Infinity` | `null` |
| `Date` | ISO string (unless the replacer says otherwise) |

Pretty-printed output:

```javascript
JSON.stringify(order, null, 2);
```

**Replacer** — a filter or transform:

```javascript
JSON.stringify(order, (key, value) => {
  if (key === "id") return undefined; // hide id
  return value;
});
```

### JSON.parse

```javascript
const raw = '{"name":"Ann","age":30}';
const obj = JSON.parse(raw);
```

Always wrap **untrusted** input in a try/catch — see [32-error-handling.md](32-error-handling.md) and `safeJsonParse` in lab 33.

**Reviver** — restoring types after parsing:

```javascript
const json = '{"createdAt":"2024-06-18T10:00:00Z","amount":99.5}';

const data = JSON.parse(json, (key, value) => {
  if (key === "createdAt" && typeof value === "string") {
    return new Date(value);
  }
  return value;
});

console.log(data.createdAt instanceof Date); // true
```

### JSON's limitations

- Keys must be **strings** (quoted).
- No comments, no trailing commas in strict JSON.
- No `undefined` as a value — only the absence of a key.
- Circular references in an object cause a `TypeError` on stringify.

```javascript
const a = {};
a.self = a;
JSON.stringify(a); // TypeError: Converting circular structure to JSON
```

For config files that need comments, Node projects sometimes reach for JSON5 or YAML — neither is native JSON.

## Date — time, and the pain that comes with it

```javascript
const now = new Date();
console.log(now.toISOString()); // UTC: 2024-06-18T12:34:56.789Z

const ts = Date.now(); // milliseconds since the Unix epoch (UTC)

const d = new Date("2024-06-18T10:00:00Z"); // ISO with Z — unambiguously UTC
console.log(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
```

### Parsing strings — tread carefully

```javascript
new Date("2024-06-18");        // often UTC midnight
new Date("2024/06/18");        // implementation-defined
new Date(2024, 5, 18);         // local midnight, month is 0-based (5 = June)
```

**Storage rule:** UTC in the database and API (`toISOString()`), local time only when **displaying**.

### Date arithmetic

```javascript
const start = Date.now();
await delay(100);
const elapsed = Date.now() - start;

const dayMs = 24 * 60 * 60 * 1000;
const inWeek = new Date(Date.now() + 7 * dayMs);
```

For calendar logic ("+1 month", holidays), reach for **date-fns** or **Luxon**; the upcoming **Temporal** API will handle this natively too.

### Comparison

```javascript
const a = new Date("2024-06-18T10:00:00Z");
const b = new Date("2024-06-19T10:00:00Z");
a < b; // true
a.getTime() === b.getTime(); // same instant
```

## Intl — localization without hand-rolled strings

### Numbers and currency

```javascript
const price = 1234.5;

new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
}).format(price);
// "1 234,50 ₽"

new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(79.9);
// "$79.90"
```

Used in [31-lab-modules.md](31-lab-modules.md) for `formatPrice`.

### Dates

```javascript
const d = new Date("2024-06-18T15:30:00Z");

new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(d);
// local display for the user
```

### Relative time

```javascript
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
rtf.format(-1, "day"); // "yesterday"
```

## Math — rounding and randomness

```javascript
Math.floor(3.7);   // 3 — rounds down
Math.ceil(3.1);    // 4 — rounds up
Math.round(3.5);   // 4 — rounds to nearest (3.5 → 4)
Math.trunc(-3.7);  // -3 — drops the fractional part

Math.max(1, 5, 2); // 5
Math.min(...[3, 1, 4]);

Math.abs(-5);
Math.sqrt(16);
Math.pow(2, 10); // or 2 ** 10
```

### Money — don't touch floats directly

```javascript
// bad for accounting
0.1 + 0.2; // 0.30000000000000004

// cents as integers
function toCents(price) {
  return Math.round(price * 100);
}

function fromCents(cents) {
  return cents / 100;
}

toCents(19.99); // 1999
```

For production finance work, use decimal libraries or store integer cents.

### Math.random

```javascript
Math.random(); // [0, 1)

// integer from min to max, inclusive
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

**Not** suitable for cryptography — use `crypto.randomBytes` / `crypto.getRandomValues` instead.

## Summary table: what to use when

| Task | Tool |
|--------|------------|
| Log line → fields | RegExp + `match` |
| API request/response | JSON |
| Store a moment in time | ISO UTC string or timestamp in ms |
| Show to the user | Intl.DateTimeFormat |
| Price in the UI | Intl.NumberFormat |
| Round a rating | Math.round |
| Amount in cents | integer + Math.round |

## Ties to the rest of the course

- [29-fetch.md](29-fetch.md) — `response.json()` calls `JSON.parse` under the hood.
- [07-objects.md](07-objects.md) — `JSON.parse(JSON.stringify())` as shallow-plus copying, with its limits.
- [37-lab-collections.md](37-lab-collections.md) — parsing logs with regex plus groupBy.

## Common mistakes

- **Regex without anchors** `^` `$` — a partial match slips through where you needed the whole string.
- **`JSON.parse` without try/catch** on external data.
- **Confusing `Date.parse` with ISO parsing** — behavior differs on non-standard strings.
- **Local time in an API** without an offset — breaks across DST changes.
- **`Math.round` for money** without converting to cents first — errors accumulate.
- **Reusing a global regex** in a loop — matches get skipped because of `lastIndex`.

## Checklist

- What does `JSON.stringify({ x: undefined, y: 1 })` return?
- Why does `replace` and `match` need the `g` flag?
- How do you safely extract `user=42` from a string?
- Why is it better to store dates in UTC?
- How does `Math.floor` differ from `Math.trunc` for negative numbers?
- How do you format 79.9 USD using **Intl**?

Next lesson: [36. Debugging](36-debugging.md).
