# 28. Лаба: асинхронные цепочки

## Сценарий

Перед подключением к реальному FastAPI на `:8090` ([29-fetch.md](29-fetch.md)) вы отрабатываете **асинхронные примитивы** в изоляции: задержки, порядок event loop, параллельная загрузка URL, повтор при сбое. Ошибка «в проде retry не сработал» часто из-за того, что не ждали `Promise.all` или перепутали microtasks и `setTimeout`.

Эта лаба опирается на [24-event-loop.md](24-event-loop.md), [26-promises.md](26-promises.md), [27-async-await.md](27-async-await.md).

## Что вы сделаете

- Реализуете `delay(ms)` на Promise
- Предскажете и проверите порядок вывода в смеси sync / Promise / setTimeout
- Напишете `fakeFetch` и `loadAll` без сети
- Реализуете `retry` с паузой между попытками

**Время:** ~40–55 минут.  
**Где код:** `courses/javascript-basic/examples/lab/`.

---

## Подготовка

Файлы:

```text
lab/
  async-utils.js    # delay, retry, loadAll, fakeFetch
  28-order.js       # порядок вывода
  28-demo.js        # сценарии retry и loadAll
```

В `package.json` или отдельном файле убедитесь в `"type": "module"` для top-level await в `28-order.js`.

---

## Задание 1. `delay(ms)`

Файл `async-utils.js`:

```javascript
export function delay(ms) {
  return new Promise((resolve) => {
    // TODO: setTimeout → resolve()
  });
}
```

### Проверка

```javascript
import { delay } from "./async-utils.js";

console.time("delay");
await delay(100);
console.timeEnd("delay"); // около 100 ms
```

### Критерии

- Возвращает Promise
- Не reject при положительном `ms`
- (Опционально) `delay(0)` ставит macrotask — обсудите с [24-event-loop.md](24-event-loop.md)

---

## Задание 2. Порядок вывода — `28-order.js`

Скопируйте и **сначала предскажите** порядок букв в комментарии, затем запустите:

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

await Promise.resolve();

console.log("D");
```

### Ожидаемый разбор (после запуска сверьте)

В ES module с top-level await порядок: **`A`, `C`, `D`, `B`**.

| Шаг | Что происходит |
|-----|----------------|
| 1 | `console.log("A")` — синхронно |
| 2 | `setTimeout` ставит `B` в очередь **macrotask** |
| 3 | `Promise.then` ставит `C` в очередь **microtask** |
| 4 | `await Promise.resolve()` приостанавливает модуль; стек пустеет → выполняется microtask **C** |
| 5 | Модуль продолжается → синхронно **D** |
| 6 | Следующая macrotask → **B** |

Если запустить тот же код **внутри** `async function` без top-level await, порядок может отличаться: `D` окажется после microtasks той же async-функции, но до `B`. Для лабы используйте отдельный файл-модуль.

В комментарии вверху файла объясните:

- почему `B` не сразу после `A`;
- где microtask, где macrotask;
- что сделал `await Promise.resolve()` для остального модуля.

Запуск:

```bash
node lab/28-order.js
```

---

## Задание 3. `fakeFetch` и `loadAll`

В `async-utils.js`:

```javascript
export function fakeFetch(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes("error")) {
        reject(new Error(`404 ${url}`));
      } else {
        resolve({
          ok: true,
          json: async () => ({ url, items: [] }),
        });
      }
    }, 50);
  });
}

export async function loadAll(urls) {
  // TODO: Promise.all
  // при любой ошибке — throw new Error с упоминанием url из reason
}
```

### Требования к `loadAll`

```javascript
const data = await loadAll([
  "http://api/items",
  "http://api/users",
]);
// data.length === 2, каждый элемент — результат json()
```

При ошибке:

```javascript
try {
  await loadAll(["http://api/ok", "http://api/error-page"]);
} catch (e) {
  console.log(e.message); // должен содержать "error" или проблемный url
}
```

### Подсказка

```javascript
export async function loadAll(urls) {
  try {
    const responses = await Promise.all(urls.map((url) => fakeFetch(url)));
    return Promise.all(responses.map((r) => r.json()));
  } catch (err) {
    throw new Error(`loadAll failed: ${err.message}`);
  }
}
```

Улучшите сообщение, чтобы было ясно **какой** URL упал (например, оборачивать каждый fetch отдельно).

---

## Задание 4. `retry`

```javascript
export async function retry(fn, attempts = 3, delayMs = 100) {
  // вызвать fn() (возвращает Promise)
  // при reject — подождать delayMs и повторить
  // после исчерпания attempts — throw последней ошибки
}
```

### Пример

```javascript
let calls = 0;
async function flaky() {
  calls += 1;
  if (calls < 3) throw new Error("temporary");
  return "ok";
}

const result = await retry(flaky, 5, 50);
console.log(result, calls); // ok, 3
```

### Важно

- `fn` вызывается заново на каждой попытке
- задержка **между** попытками, не до первой
- используйте ваш `delay(delayMs)`

### Шаблон

```javascript
export async function retry(fn, attempts = 3, delayMs = 100) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await delay(delayMs);
    }
  }
  throw lastError;
}
```

---

## Задание 5. Демо `28-demo.js`

Соберите сценарии:

```javascript
import { delay, fakeFetch, loadAll, retry } from "./async-utils.js";

// 1. retry на fakeFetch с url с error — успех после смены url в fn
// 2. loadAll на 3 успешных url
// 3. параллельно: Promise.all([delay(100), fakeFetch("/x")]) — замер времени ~100ms, не 150
```

---

## Задание 6. (Опционально) Мост к FastAPI

Если поднят [deploy/fastapi](../../deploy/fastapi/README.md):

```javascript
const res = await fetch("http://localhost:8090/health");
console.log(res.status, await res.json());
```

Сравните с `fakeFetch`: те же шаги `ok` + `json()`, но реальная сеть.

---

## Критерии успеха

- [ ] `28-order.js` — комментарий с правильным порядком (A, C, D, B для ES module) и объяснением
- [ ] `delay(100)` измеряется `console.time` ≈ 100 ms
- [ ] `loadAll` падает с понятным сообщением при url с `error`
- [ ] `retry` повторяет при reject и возвращает результат при успехе
- [ ] Нет unhandled rejection при запуске демо

---

## Типичные ошибки в лабе

1. **`setTimeout(resolve, ms)` без Promise** — забыли обёртку.

2. **Ожидали порядок A, B, C, D** — не учли microtasks ([24-event-loop.md](24-event-loop.md)).

3. **`loadAll` без `await Promise.all`** — вернули массив Promise.

4. **`retry` без await delay** — мгновенный спам попыток.

5. **`retry` ловит только sync throw** — нужен `await fn()`.

6. **Глотают исходную ошибку** — `throw lastError`, не `return undefined`.

---

## Связь с курсом

- Event loop: [24-event-loop.md](24-event-loop.md)
- Promises: [26-promises.md](26-promises.md)
- async/await: [27-async-await.md](27-async-await.md)
- Реальный HTTP: [29-fetch.md](29-fetch.md), `:8090`
- Ошибки: [32-error-handling.md](32-error-handling.md)

Паттерн `retry` пригодится при нестабильной сети к BFF и в nodejs-intermediate (rate limit, backoff).

---

## Резюме лабы

Вы собрали минимальный «async toolkit»: задержка, параллельная загрузка, повтор при сбое и осознанный порядок выполнения в event loop. Это фундамент перед `fetch` на FastAPI и перед тестами с моками API в javascript-testing.

---

## Чек-лист перед сдачей

- Все экспорты из `async-utils.js` используются в демо?
- Запуск `node lab/28-order.js` совпадает с комментарием?
- Есть ли `.catch` или `try/catch` на демо-вызовах?
- Понимаете ли разницу между `fakeFetch` reject и HTTP 404 у реального fetch?

Следующий урок: [29. fetch](29-fetch.md).
