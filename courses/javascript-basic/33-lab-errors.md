# 33. Лаба: надёжные функции

Цель — написать **маленькую библиотеку обработки ошибок**: безопасный парсинг, HTTP-обёртка с типизированным сбоем, assert для инвариантов, глобальный handler в Node. Всё в ES modules, готово к импорту из capstone и будущих API-клиентов.

**Время:** ~25–35 минут после теории (~50–70 мин на пару 32+33).

## Стенд

```bash
cd courses/javascript-basic/examples
```

Создайте файлы в `lab/errors/` (или `lab/33-*.js` — главное, чтобы import были согласованы).

---

## Задание 1. `safeJsonParse`

Файл `lab/errors/json.js`:

```javascript
/**
 * @param {unknown} text
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string }}
 */
export function safeJsonParse(text) {
  // TODO
}
```

**Требования:**

- Невалидный JSON → `{ ok: false, error: "..." }`, **без throw**.
- Не-string на входе → `{ ok: false, error: "expected string" }` (или ваше сообщение).
- Валидный JSON → `{ ok: true, value: parsed }`.

**Проверка** — `lab/33-json-demo.js`:

```javascript
import { safeJsonParse } from "./errors/json.js";

console.log(safeJsonParse('{"a":1}'));     // ok: true
console.log(safeJsonParse("{"));           // ok: false
console.log(safeJsonParse(123));           // ok: false
console.log(safeJsonParse("null"));        // ok: true, value: null
```

---

## Задание 2. `assert`

Файл `lab/errors/assert.js`:

```javascript
export function assert(condition, message = "Assertion failed") {
  // TODO: throw new Error(message) если !condition
}
```

**Проверка:**

```javascript
import { assert } from "./errors/assert.js";

assert(1 + 1 === 2);
try {
  assert(false, "boom");
} catch (e) {
  console.log(e.message); // boom
}
```

---

## Задание 3. `HttpError` и `getJson`

Файл `lab/errors/http.js`:

```javascript
export class HttpError extends Error {
  constructor(status, body = "") {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} url
 * @param {typeof fetch} [fetchImpl]
 */
export async function getJson(url, fetchImpl = fetch) {
  // TODO
}
```

**Поведение:**

| Ситуация | Результат |
|----------|-----------|
| `res.ok` | распарсенный JSON |
| `!res.ok` | `throw new HttpError(status, bodyText)` |
| network (`TypeError` от fetch) | `throw new Error("Network unavailable", { cause: err })` |

**Mock** — переиспользуйте идею из [28-lab-async.md](28-lab-async.md):

```javascript
// lab/33-http-demo.js
import { getJson, HttpError } from "./errors/http.js";

function fakeFetch(url) {
  return Promise.resolve({
    ok: url.includes("ok"),
    status: url.includes("ok") ? 200 : 404,
    text: async () => (url.includes("ok") ? "" : "Not found"),
    json: async () => ({ id: 1 }),
  });
}

function failingFetch() {
  return Promise.reject(new TypeError("Failed to fetch"));
}

// TODO: вызовы getJson с fakeFetch и failingFetch
```

Убедитесь:

```javascript
try {
  await getJson("/error", fakeFetch);
} catch (e) {
  console.log(e instanceof HttpError, e.status); // true 404
}
```

---

## Задание 4. Композиция: config loader

`lab/33-config.js` — загрузка «конфига» из строки:

```javascript
import { safeJsonParse } from "./errors/json.js";
import { assert } from "./errors/assert.js";

export function loadConfigFromString(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) {
    throw new Error(`Invalid config JSON: ${parsed.error}`);
  }
  const cfg = parsed.value;
  assert(typeof cfg === "object" && cfg !== null, "config must be object");
  assert(typeof cfg.port === "number", "config.port required");
  return cfg;
}
```

Добавьте тестовые вызовы:

```javascript
console.log(loadConfigFromString('{"port":3000}'));
try {
  loadConfigFromString('{"port":"bad"}');
} catch (e) {
  console.log("expected fail:", e.message);
}
```

---

## Задание 5. Глобальные обработчики (Node)

`lab/33-handlers.js`:

```javascript
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exitCode = 1;
});

// намеренно «плохой» код для демонстрации
Promise.reject(new Error("oops without catch"));
```

Запуск:

```bash
node lab/33-handlers.js
echo exit:$?
```

**Ожидание:** в stderr `UNHANDLED REJECTION`, exit code ≠ 0 (на Windows проверьте `$LASTEXITCODE`).

В комментарии объясните: почему production-код **не должен** полагаться только на этот handler.

---

## Задание 6. `main().catch` паттерн

`lab/33-main.js`:

```javascript
import { getJson } from "./errors/http.js";

async function main() {
  const data = await getJson("https://invalid.test/error");
  console.log(data);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  if (err.cause) console.error("  cause:", err.cause.message);
  process.exitCode = 1;
});
```

С `fakeFetch` вместо реального URL — покажите корректный exit path.

---

## Критерии успеха

- [ ] `safeJsonParse` никогда не бросает на битом JSON
- [ ] `getJson` различает HTTP 404 и network error
- [ ] `HttpError` имеет `.status` и `.body`
- [ ] `33-handlers.js` демонстрирует `unhandledRejection`
- [ ] Есть `main().catch` с `process.exitCode = 1`
- [ ] Понимаете, когда Result (`ok: false`), когда throw

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `getJson` возвращает undefined | Вы `return await res.json()`? |
| Network не оборачивается | `catch` только вокруг `fetchImpl`, rethrow с `cause` |
| Handler не срабатывает | rejection в том же tick; добавьте `setTimeout` для demo |
| `instanceof HttpError` false | импорт из одного модуля, `class` не дублировать |

## Рефлексия

В `lab/33-reflection.md` (3–5 предложений): где в Task Tracker capstone ([39-capstone.md](39-capstone.md)) вы примените `safeJsonParse` и `HttpError`?

---

Следующий урок: [34. Map и Set](34-map-set.md).
