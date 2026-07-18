# 35. RegExp, JSON, Date, Math

## Сценарий с работы

Приходит файл логов — нужно вытащить timestamp, уровень и `user=42`. API отдаёт JSON с датами строками; фронт показывает «Invalid Date». В отчёте суммы «плывут» из-за `0.1 + 0.2`. Три инструмента ежедневной работы: **регулярные выражения** для текстов, **JSON** для обмена данными, **Date** и **Intl** для времени и локали.

Эта глава не делает вас regex-guru — цель **уверенно читать и писать простые паттерны**, безопасно парсить JSON и не попадать в ловушки часовых поясов.

## RegExp — литерал и конструктор

```javascript
const re1 = /user=(\d+)/;
const re2 = new RegExp("user=(\\d+)");

const line = "2024-06-18T10:00:01Z ERROR db connection user=7 failed";
const match = line.match(re1);

console.log(match[0]); // user=7
console.log(match[1]); // 7 — первая группа захвата
```

| Способ | Когда |
|--------|-------|
| `/pattern/flags` | паттерн известен в коде |
| `new RegExp(string, flags)` | паттерн собран из переменных |

### Флаги

| Флаг | Значение |
|------|----------|
| `g` | global — все совпадения, не только первое |
| `i` | ignore case |
| `m` | multiline — `^`/`$` на каждую строку |
| `u` | unicode |
| `s` | dotAll — `.` матчит перевод строки |

```javascript
"a1b2c3".match(/\d/g); // ["1", "2", "3"]
"User".match(/user/i);  // совпадение
```

### Основные методы строк и RegExp

```javascript
const text = "order-123 shipped";

/order-(\d+)/.test(text);           // true
text.match(/order-(\d+)/);          // массив или null
text.replace(/order-(\d+)/, "ORD-$1"); // order-123 → ORD-123
"a, b , c".split(/,\s*/);           // ["a", "b", "c"]
```

**Группы захвата** — скобки `()`:

```javascript
const logRe =
  /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(INFO|WARN|ERROR)\s+(.+)$/;

const m = "2024-06-18T10:00:00Z INFO app started".match(logRe);
// m[1] — время, m[2] — уровень, m[3] — сообщение
```

Опциональная группа в сообщении:

```javascript
const errRe = /user=(\d+)/;
const msg = "db connection user=7";
const um = msg.match(errRe);
const userId = um ? Number(um[1]) : undefined;
```

### Global regex и lastIndex

```javascript
const re = /a/g;
re.test("aba"); // true
re.test("aba"); // true — lastIndex сдвинулся
re.lastIndex;   // позиция
```

При `g` одно и то же regex-объект **stateful** — для циклов иногда создают новый или используют `matchAll`:

```javascript
for (const m of "a1b2".matchAll(/\d/g)) {
  console.log(m[0], m.index);
}
```

### Чего не делать с regex

- **Полная валидация email** одним regex — антипаттерн; используйте библиотеки или простую проверку `@` + сервер.
- **Парсинг HTML/XML** regex — хрупко; нужен парсер DOM.
- **Сложный JSON** regex — используйте `JSON.parse`.

## JSON — обмен данными

JavaScript Object Notation — подмножество JS для **сериализации данных** (не кода).

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

| Значение JS | В JSON |
|-------------|--------|
| string, number, boolean, null | как есть |
| object, array | рекурсивно |
| `undefined`, function, Symbol | **опускаются** (в object) или `null` (в array) |
| `NaN`, `Infinity` | `null` |
| `Date` | ISO-строка (если в replacer не иначе) |

Красивый вывод:

```javascript
JSON.stringify(order, null, 2);
```

**Replacer** — фильтр или трансформация:

```javascript
JSON.stringify(order, (key, value) => {
  if (key === "id") return undefined; // скрыть id
  return value;
});
```

### JSON.parse

```javascript
const raw = '{"name":"Ann","age":30}';
const obj = JSON.parse(raw);
```

Всегда оборачивайте **пользовательский** ввод — [32-error-handling.md](32-error-handling.md), `safeJsonParse` в лабе 33.

**Reviver** — восстановление типов после parse:

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

### Ограничения JSON

- Ключи только **строки** (в кавычках).
- Нет комментариев, trailing comma в строгом JSON.
- Нет `undefined` как значение — только отсутствие ключа.
- Циклические ссылки в object — `TypeError` при stringify.

```javascript
const a = {};
a.self = a;
JSON.stringify(a); // TypeError: Converting circular structure to JSON
```

Для конфигов с комментариями в Node иногда используют JSON5 или YAML — не нативный JSON.

## Date — время и боль

```javascript
const now = new Date();
console.log(now.toISOString()); // UTC: 2024-06-18T12:34:56.789Z

const ts = Date.now(); // миллисекунды с Unix epoch (UTC)

const d = new Date("2024-06-18T10:00:00Z"); // ISO с Z — однозначно UTC
console.log(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
```

### Парсинг строк — осторожно

```javascript
new Date("2024-06-18");        // часто UTC midnight
new Date("2024/06/18");        // implementation-defined
new Date(2024, 5, 18);         // локальная полночь, месяц 0-based (5 = июнь)
```

**Правило хранения:** UTC в БД и API (`toISOString()`), локаль только при **отображении**.

### Арифметика дат

```javascript
const start = Date.now();
await delay(100);
const elapsed = Date.now() - start;

const dayMs = 24 * 60 * 60 * 1000;
const inWeek = new Date(Date.now() + 7 * dayMs);
```

Для календарной логики («+1 месяц», праздники) — библиотеки **date-fns**, **Luxon**; в будущем **Temporal** API.

### Сравнение

```javascript
const a = new Date("2024-06-18T10:00:00Z");
const b = new Date("2024-06-19T10:00:00Z");
a < b; // true
a.getTime() === b.getTime(); // same instant
```

## Intl — локализация без ручных строк

### Числа и валюта

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

Используйте в [31-lab-modules.md](31-lab-modules.md) для `formatPrice`.

### Даты

```javascript
const d = new Date("2024-06-18T15:30:00Z");

new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(d);
// локальное отображение для пользователя
```

### Относительное время

```javascript
const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
rtf.format(-1, "day"); // "вчера"
```

## Math — округление и случайность

```javascript
Math.floor(3.7);   // 3 — вниз
Math.ceil(3.1);    // 4 — вверх
Math.round(3.5);   // 4 — к ближайшему (3.5 → 4)
Math.trunc(-3.7);  // -3 — отбросить дробную часть

Math.max(1, 5, 2); // 5
Math.min(...[3, 1, 4]);

Math.abs(-5);
Math.sqrt(16);
Math.pow(2, 10); // или 2 ** 10
```

### Деньги — не float напрямую

```javascript
// плохо для accounting
0.1 + 0.2; // 0.30000000000000004

// центы как целые
function toCents(price) {
  return Math.round(price * 100);
}

function fromCents(cents) {
  return cents / 100;
}

toCents(19.99); // 1999
```

Для финансов в проде — decimal-библиотеки или хранение integer cents.

### Math.random

```javascript
Math.random(); // [0, 1)

// целое от min до max включительно
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

**Не** для криптографии — `crypto.randomBytes` / `crypto.getRandomValues`.

## Сводная таблица «что когда»

| Задача | Инструмент |
|--------|------------|
| Строка лога → поля | RegExp + `match` |
| API request/response | JSON |
| Хранить момент времени | ISO UTC string или timestamp ms |
| Показать пользователю | Intl.DateTimeFormat |
| Цена в UI | Intl.NumberFormat |
| Округлить рейтинг | Math.round |
| Сумма в центах | integer + Math.round |

## Связь с курсом

- [29-fetch.md](29-fetch.md) — `response.json()` → `JSON.parse` под капотом.
- [07-objects.md](07-objects.md) — `JSON.parse(JSON.stringify())` shallow+ с ограничениями.
- [37-lab-collections.md](37-lab-collections.md) — парсинг логов regex + groupBy.

## Типичные ошибки

- **Regex без якорей** `^` `$` — частичное совпадение там, где нужна вся строка.
- **`JSON.parse` без try/catch** на внешних данных.
- **Путать `Date.parse` и ISO** — разное поведение на нестандартных строках.
- **Локальное время в API** без offset — ломается при DST.
- **`Math.round` для денег** без перевода в cents — накопление ошибки.
- **Reuse global regex** в цикле — пропуск совпадений из-за `lastIndex`.

## Чек-лист

- Что вернёт `JSON.stringify({ x: undefined, y: 1 })`?
- Зачем флаг `g` в `replace` и `match`?
- Как безопасно извлечь `user=42` из строки?
- Почему хранить даты лучше в UTC?
- Чем `Math.floor` отличается от `Math.trunc` для отрицательных?
- Как отформатировать 79.9 USD через **Intl**?

Следующий урок: [36. Отладка](36-debugging.md).
