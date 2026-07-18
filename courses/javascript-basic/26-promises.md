# 26. Promises: then, catch, finally

## Сценарий с работы

Два независимых запроса к API вы запустили последовательно — страница грузится вдвое дольше. Один из `then` забыли с `.catch` — в логах Node `UnhandledPromiseRejection`, процесс упал. В коде `new Promise((resolve) => resolve(fs.readFileSync(...)))` — «обёртка ради обёртки». На review просят заменить вложенные колбэки на `Promise.all` и объяснить, почему `fetch` не падает на HTTP 404.

Promise — объект, представляющий **будущий** результат асинхронной операции: успех или ошибка **один раз**.

## Что вы узнаете

- Три состояния Promise: pending, fulfilled, rejected
- Цепочки `.then` / `.catch` / `.finally`
- Как ошибки пробрасываются по цепочке
- `Promise.all`, `allSettled`, `race`, `any`
- Unhandled rejection и зачем всегда ловить ошибки
- Антипаттерн «Promise constructor» для уже async API
- Связь с event loop (microtasks) и `async/await`

---

## Состояния Promise

```javascript
const pending = new Promise((resolve, reject) => {
  // пока не вызван resolve или reject — pending
});

const fulfilled = Promise.resolve(42);
const rejected = Promise.reject(new Error("fail"));
```

| Состояние | Значение |
|-----------|----------|
| **pending** | ожидание |
| **fulfilled** | успех, есть `value` |
| **rejected** | ошибка, есть `reason` |

После settled состояние **не меняется** — колбэк не вызовут повторно (в отличие от сломанного callback API).

```javascript
const p = new Promise((resolve) => {
  setTimeout(() => resolve("done"), 100);
});

p.then((value) => console.log(value)); // через ~100 ms: done
```

`.then` регистрирует обработчик в **microtask** очереди ([24-event-loop.md](24-event-loop.md)).

---

## then, catch, finally

```javascript
fetchData()
  .then((data) => process(data))
  .then((result) => save(result))
  .catch((err) => console.error(err))
  .finally(() => console.log("cleanup"));
```

- **`then(onFulfilled, onRejected?)`** — возвращает **новый** Promise.
- **`catch(onRejected)`** — то же, что `then(null, onRejected)`.
- **`finally(fn)`** — выполняется при любом исходе; не меняет значение цепочки (кроме throw внутри).

```javascript
Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => {
    throw new Error("oops");
  })
  .catch((e) => {
    console.log(e.message); // oops
    return 0;
  })
  .then((v) => console.log(v)); // 0 — восстановились после catch
```

---

## Возврат из then: значение или новый Promise

```javascript
Promise.resolve(1)
  .then((v) => v * 2)           // возврат значения → fulfilled с 2
  .then((v) => Promise.resolve(v + 1)) // возврат Promise → «расплющивание»
  .then((v) => console.log(v)); // 3
```

Если внутри `then` **throw** — следующий Promise rejected:

```javascript
Promise.resolve()
  .then(() => {
    throw new Error("fail");
  })
  .catch((e) => console.log(e.message)); // fail
```

Синхронный throw в **executor** `new Promise` тоже даёт rejection:

```javascript
new Promise(() => {
  throw new Error("x");
}).catch((e) => console.log(e.message)); // x
```

---

## Проброс ошибок и unhandled rejection

```javascript
Promise.reject(new Error("fail"))
  .then(() => console.log("skipped"))
  .catch((e) => console.log(e.message)); // fail — then пропущен
```

Без `.catch` в конце цепочки:

```javascript
Promise.reject(new Error("unhandled"));
// Node: UnhandledPromiseRejectionWarning — в новых версиях может завершить процесс
```

**Всегда** завершайте цепочки обработкой ошибок или `try/catch` с `await`.

В Node для отладки:

```javascript
process.on("unhandledRejection", (reason) => {
  console.error(reason);
});
```

В проде — логирование и метрики, не глотать молча.

---

## Создание Promise

### Уже есть значение

```javascript
Promise.resolve(42);
Promise.reject(new Error("x"));
```

### Адаптация колбэка ([25-callbacks.md](25-callbacks.md))

```javascript
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Антипаттерн: лишний Promise

```javascript
// плохо
new Promise((resolve) => {
  resolve(JSON.parse('{"a":1}'));
});

// хорошо
JSON.parse('{"a":1}');

// плохо — sync IO в executor
new Promise((resolve) => {
  resolve(fs.readFileSync("huge.json", "utf-8"));
});

// хорошо
import { readFile } from "node:fs/promises";
await readFile("huge.json", "utf-8");
```

Используйте `new Promise` только когда **переводите** callback-style API в Promise.

---

## Promise.all — параллельно, одна ошибка роняет всё

```javascript
const [user, config] = await Promise.all([
  fetchUser(1),
  loadConfig(),
]);
```

- Запускает все промисы **параллельно**.
- Ждёт **все** fulfilled.
- При **первом** reject — весь `all` rejected (остальные не отменяются автоматически).

```javascript
await Promise.all([
  Promise.resolve(1),
  Promise.reject(new Error("b")),
  Promise.resolve(3),
]).catch((e) => console.log(e.message)); // b
```

Для независимых запросов к FastAPI `:8090` ([29-fetch.md](29-fetch.md)) — типичный паттерн ускорения.

---

## Promise.allSettled — все результаты, без throw

```javascript
const results = await Promise.allSettled([
  fetch("/api/a"),
  fetch("/api/b"),
]);

for (const r of results) {
  if (r.status === "fulfilled") {
    console.log("ok", r.value);
  } else {
    console.error("fail", r.reason);
  }
}
```

Каждый элемент: `{ status: "fulfilled", value }` или `{ status: "rejected", reason }`.

Удобно для «отправить 10 webhook, отчитаться по каждому».

---

## Promise.race и Promise.any

**race** — первый settled (успех **или** ошибка):

```javascript
const winner = await Promise.race([
  delay(200).then(() => "slow"),
  delay(50).then(() => "fast"),
]);
console.log(winner); // fast
```

Таймаут через race + reject:

```javascript
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    delay(ms).then(() => Promise.reject(new Error("timeout"))),
  ]);
}
```

**any** — первый **fulfilled**; если все rejected — `AggregateError`:

```javascript
await Promise.any([
  Promise.reject("a"),
  Promise.resolve("ok"),
]); // "ok"
```

---

## Сравнение комбинаторов

| Метод | Результат | При ошибке |
|-------|-----------|------------|
| `all` | массив values | сразу reject |
| `allSettled` | массив статусов | не throw |
| `race` | первый settled | первый reject тоже |
| `any` | первый fulfilled | все reject → AggregateError |

---

## Promise и fetch

```javascript
const res = await fetch("http://localhost:8090/health");
```

`fetch` возвращает Promise **Response**. Сетевой сбой → reject. HTTP 404/500 → **fulfilled** Response с `ok: false` — отдельная проверка ([29-fetch.md](29-fetch.md)).

---

## Цепочка vs async/await

Эквивалент:

```javascript
// цепочка
getUser(id)
  .then((u) => getOrders(u.id))
  .then((orders) => orders.length);

// async/await
const u = await getUser(id);
const orders = await getOrders(u.id);
const count = orders.length;
```

`async/await` — синтаксический сахар; под капотом Promise ([27-async-await.md](27-async-await.md)).

---

## Связь с курсом

- [25-callbacks.md](25-callbacks.md) — откуда выросли Promises.
- [24-event-loop.md](24-event-loop.md) — `.then` = microtask.
- [27-async-await.md](27-async-await.md) — следующий уровень синтаксиса.
- [28-lab-async.md](28-lab-async.md) — `delay`, `loadAll`, `retry`.
- [32-error-handling.md](32-error-handling.md) — стратегии ошибок в приложении.

---

## Типичные ошибки

1. **Забыть `return` в `then`** — следующий шаг получит `undefined`.

```javascript
promise.then((data) => {
  save(data); // забыли return save(data)
});
```

2. **Последовательный await там, где нужен `Promise.all`**.

3. **Пустой `catch` без логирования** — глотает баги.

4. **Думать, что `fetch` reject на 404** — только сеть и CORS (в браузере).

5. **Вложенные `new Promise`** вместо цепочки `then` или одного async.

6. **Не обрабатывать rejection в fire-and-forget** — `doAsync();` без `.catch`.

---

## Резюме

Promise — единоразовый результат async операции: pending → fulfilled или rejected. Цепочки `then`/`catch`/`finally` строят pipeline; throw и reject идут в `catch`. `Promise.all` ускоряет независимые задачи; `allSettled` собирает все исходы; `race`/`any` — гонки и таймауты. Обработка ошибок обязательна — unhandled rejection опасен. `new Promise` — для адаптации колбэков, не для sync кода.

---

## Чек-лист

- Назовите три состояния Promise
- Что вернёт `then`, если callback бросает исключение?
- Разница `Promise.all` и `allSettled`?
- Почему `fetch` на 500 не попадает в `catch` без проверки `ok`?
- Что такое unhandled rejection?
- Когда уместен `Promise.race` для таймаута?

Следующий урок: [27. async/await](27-async-await.md).
