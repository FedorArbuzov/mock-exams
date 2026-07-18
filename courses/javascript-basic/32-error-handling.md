# 32. Обработка ошибок: try/catch, throw

## Сценарий с работы

Пятница, прод: в логах пусто, но пользователи видят белый экран. В MR нашли:

```javascript
try {
  await saveOrder(data);
} catch (e) {}
```

Ошибка **проглочена** — ни Sentry, ни `console.error`, ни HTTP 500. Другой тикет: API возвращает 404, клиент падает с `SyntaxError` — потому что парсят HTML-страницу ошибки как JSON. Третий кейс: `unhandledRejection` в Node — процесс завершился с кодом 0, хотя Promise упал.

Надёжный JavaScript **предполагает сбои**: невалидный ввод, сеть, диск, баги. Эта глава — как ловить, бросать, классифицировать и **не скрывать** ошибки.

## Модель: исключения vs возвращаемые значения

Два подхода сигнализировать о проблеме:

| Подход | Пример | Когда уместен |
|--------|--------|---------------|
| **Исключение** (`throw`) | `JSON.parse` на битой строке | Неожиданный сбой, нельзя продолжить |
| **Result / null** | `parseAge` → `{ ok: false }` | Ожидаемый «плохой ввод», часть API |

```javascript
// исключение — программа не может продолжить без данных
function loadConfig(path) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw); // SyntaxError если файл битый
}

// result — вызывающий код решает, что делать
function parseAge(input) {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0 || n > 150) {
    return { ok: false, error: "invalid age" };
  }
  return { ok: true, value: Math.floor(n) };
}
```

Правило курса: **валидация формы** — часто Result; **сломанный конфиг при старте** — throw или `process.exit(1)`.

## try / catch / finally

```javascript
function processUserJson(input) {
  let parsed = null;
  try {
    parsed = JSON.parse(input);
    validateUser(parsed);
    return saveUser(parsed);
  } catch (err) {
    console.error("Failed to process user:", err.message);
    throw err; // rethrow — не глотать
  } finally {
    cleanupTempFiles(); // выполнится почти всегда
  }
}
```

Порядок выполнения:

1. `try` — нормальный путь.
2. При throw — управление в `catch` (если тип подходит).
3. `finally` — **всегда** после `try`/`catch`, даже если был `return` или `throw` в `try`/`catch`.

```javascript
function demo() {
  try {
    return 1;
  } finally {
    console.log("finally runs");
  }
}
demo(); // лог "finally runs", return 1
```

Исключения из `finally` **перебивают** pending return/throw из `try` — редко используйте throw в `finally`.

`finally` не выполнится только при:

- `process.exit()`;
- фatal crash процесса;
- бесконечном цикле до `finally`.

## throw — генерация ошибки

```javascript
function withdraw(balance, amount) {
  if (typeof amount !== "number" || amount <= 0) {
    throw new TypeError("amount must be positive number");
  }
  if (amount > balance) {
    throw new Error("Insufficient funds");
  }
  return balance - amount;
}
```

Можно бросить **что угодно**:

```javascript
throw "oops";           // плохо — нет stack trace
throw { code: 404 };    // плохо — не instanceof Error
throw new Error("ok");  // хорошо
```

**Всегда** `throw new Error(...)` или подкласс — иначе теряете стек и единообразие в логах.

## Встроенные типы ошибок

| Тип | Типичная причина |
|-----|------------------|
| `Error` | базовый, общие сбои |
| `TypeError` | неверный тип, `null.property` |
| `RangeError` | число вне диапазона |
| `ReferenceError` | необъявленная переменная |
| `SyntaxError` | `JSON.parse`, парсер JS |

```javascript
try {
  JSON.parse("{");
} catch (err) {
  console.log(err.name);    // SyntaxError
  console.log(err.message); // Expected property name...
}
```

Проверка типа:

```javascript
if (err instanceof SyntaxError) {
  return { ok: false, error: "invalid json" };
}
```

**Оговорка:** `instanceof Error` между **разными realm** (iframe, vm) может дать false — в Node обычно один realm.

## Кастомные ошибки

```javascript
class HttpError extends Error {
  constructor(status, message, body = "") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(res.status, `HTTP ${res.status}`, body);
  }
  return res.json();
}
```

Вызывающий код:

```javascript
try {
  const data = await getJson("/api/items/99");
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    console.log("Not found");
  } else {
    throw err;
  }
}
```

Связь с API: [`fastapi/11-errors`](../../deploy/fastapi/README.md), [`api-design`](../api-design/README.md) — единый формат `{ detail: "..." }` на сервере и typed errors на клиенте.

## Error cause (цепочка причин)

ES2022 — поле `cause`:

```javascript
try {
  JSON.parse(input);
} catch (err) {
  throw new Error("Config load failed", { cause: err });
}
```

```javascript
catch (err) {
  console.log(err.message);       // Config load failed
  console.log(err.cause.message); // исходная SyntaxError
}
```

Удобно для обёрток `getJson`, `readConfig` — не теряете первопричину.

## Ошибки в асинхронном коде

### Promises

```javascript
fetch(url)
  .then((res) => res.json())
  .catch((err) => {
    console.error(err);
    throw err;
  });
```

Rejected Promise **без** `.catch` / `await` в try — **unhandled rejection**.

### async/await

```javascript
async function loadProfile(id) {
  try {
    const res = await fetch(`/users/${id}`);
    if (!res.ok) throw new HttpError(res.status, "load failed");
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Network unavailable", { cause: err });
    }
    throw err;
  }
}
```

`await` **разворачивает** rejection в throw — ловится тем же `try/catch`.

### Top-level в скрипте

```javascript
async function main() {
  const data = await loadProfile(1);
  console.log(data);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
```

Без `.catch` на `main()` rejection уйдёт в `unhandledRejection`.

## Node: глобальные обработчики

```javascript
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exitCode = 1;
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
  process.exit(1); // процесс в неопределённом состоянии — выход
});
```

В production добавляют логирование (Sentry, Datadog) — см. `nodejs-basic`.

**Не** полагайтесь только на handlers — лучше явный `catch` на каждом async entry point.

## try/catch и производительность

Создавать `try/catch` **дорого** только если throw происходит **часто** в hot path. Для редких ошибок (парсинг, I/O) overhead пренебрежим. **Не** используйте exceptions для control flow в цикле на миллион итераций.

Антипаттерн:

```javascript
for (const line of lines) {
  try {
    JSON.parse(line);
  } catch {
    /* skip */
  }
}
```

Для ожидаемых битых строк — `safeJsonParse` (лаба [33-lab-errors.md](33-lab-errors.md)).

## Паттерн Result без библиотек

```javascript
export function safeJsonParse(text) {
  if (typeof text !== "string") {
    return { ok: false, error: "expected string" };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const result = safeJsonParse(userInput);
if (!result.ok) {
  showError(result.error);
  return;
}
useData(result.value);
```

TypeScript позже сделает это discriminated union — [`typescript-basic`](../javascript-path.md).

## assert — fail fast в разработке

```javascript
export function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a, b) {
  assert(b !== 0, "division by zero");
  return a / b;
}
```

В production-коде API-payload лучше валидировать явно, не `assert`.

## Логирование vs throw

| Действие | throw | log + return |
|----------|-------|--------------|
| Невозможно продолжить | да | — |
| Ожидаемый miss (404) | опционально | часто да |
| Внутренняя ошибка | rethrow после log | — |

```javascript
// плохо — и глотание, и молчание
try {
  await db.save(x);
} catch (e) {}

// лучше
try {
  await db.save(x);
} catch (err) {
  logger.error({ err, userId: x.id }, "save failed");
  throw err;
}
```

## Связь с fetch и модулями

- [29-fetch.md](29-fetch.md) — `fetch` не reject на HTTP 404; проверяйте `res.ok` и бросайте `HttpError`.
- [30-es-modules.md](30-es-modules.md) — экспортируйте `HttpError`, `safeJsonParse` из отдельных файлов.
- [28-lab-async.md](28-lab-async.md) — `fakeFetch`, `retry` с обработкой reject.

## Типичные ошибки

- **Пустой `catch {}`** — самая опасная конструкция в кодовой базе.
- **catch (e) и return default** без лога — скрытый баг месяцами.
- **Парсить JSON без try/catch** на пользовательском вводе.
- **Забыть `.catch` на `main()`** в CLI-скрипте.
- **throw строки** вместо `Error` — нет stack в мониторинге.
- **Ловить все ошибки одинаково** — 404 и 500 требуют разной UX-логики.
- **finally с return** — перезаписывает return из try (редкий, но запутанный баг).

## Чек-лист

- Выполнится ли `finally` после `return` в `try`?
- Чем **ожидаемая** ошибка валидации отличается от **неожиданного** сбоя?
- Почему пустой `catch` опаснее отсутствия try?
- Как обработать rejected Promise в async-функции?
- Зачем `throw new Error("wrap", { cause: err })`?
- Что такое `unhandledRejection` в Node?

Следующий урок: [33. Лаба: ошибки](33-lab-errors.md).
