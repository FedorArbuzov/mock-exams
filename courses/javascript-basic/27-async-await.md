# 27. `async`/`await`

## Сценарий с работы

Рефакторите сервис: три вызова API шли цепочкой `.then` — трудно читать и ставить breakpoint. Переписали на `async/await`, но страница снова медленная: забыли, что `await` в цикле ждёт **по очереди**. В `map` написали `urls.map(async (u) => fetch(u))` и удивились, что `await` снаружи не ждёт. Top-level `await` в `config.js` сломал тесты, которые `import` без ожидания.

`async`/`await` — **синтаксический сахар** над Promise: линейный код с `try/catch` вместо пирамид `.then`.

## Что вы узнаете

- Как объявлять `async` функции и что они возвращают
- `await` и приостановка до settlement Promise
- `try/catch/finally` вокруг await
- Последовательное vs параллельное выполнение
- Ошибки в циклах и `Promise.all` с `map`
- `await` на не-Promise значениях
- Top-level await в ES modules
- `async` методы в классах и типичные ловушки

---

## async функция всегда возвращает Promise

```javascript
async function getAnswer() {
  return 42;
}

const p = getAnswer();
console.log(p instanceof Promise); // true

p.then((v) => console.log(v)); // 42
```

Явный throw → rejected Promise:

```javascript
async function fail() {
  throw new Error("boom");
}

fail().catch((e) => console.log(e.message)); // boom
```

`async` без `await` внутри — всё равно Promise (иногда полезно для единообразного API).

---

## await: ждём settlement

```javascript
async function loadProfile(userId) {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(user.id);
  return { user, orders };
}
```

До первого `await` код выполняется **синхронно** в вызывающем стеке. После `await` продолжение — **microtask** ([24-event-loop.md](24-event-loop.md)).

```javascript
async function demo() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
}

console.log("A");
demo();
console.log("B");
// A, 1, B, 2
```

---

## try/catch/finally

```javascript
async function main() {
  try {
    const data = await riskyOperation();
    return data;
  } catch (err) {
    console.error("Handled:", err.message);
    throw err; // или return fallback
  } finally {
    console.log("always runs");
  }
}
```

Один `try/catch` вокруг нескольких `await` — аналог одного `.catch` на цепочке ([26-promises.md](26-promises.md)).

Синхронный throw до await тоже ловится:

```javascript
async function f() {
  try {
    throw new Error("sync");
  } catch (e) {
    console.log(e.message);
  }
}
```

---

## Последовательно vs параллельно

**Последовательно** — каждый шаг ждёт предыдущий (медленнее, если шаги независимы):

```javascript
const a = await fetchA();
const b = await fetchB();
```

**Параллельно** — запустить оба, потом дождаться:

```javascript
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

Важно: `await` **до** `Promise.all` убивает параллельность:

```javascript
// медленно — B стартует только после A
const a = await fetchA();
const b = await fetchB();

// быстро
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

Для трёх и более — тот же паттерн или `Promise.allSettled` при частичных сбоях.

---

## map + async: классическая ловушка

```javascript
// плохо — массив Promise, не ждём
const results = urls.map(async (url) => {
  const res = await fetch(url);
  return res.json();
});
console.log(results); // [Promise, Promise, ...]

// хорошо
const results = await Promise.all(
  urls.map(async (url) => {
    const res = await fetch(url);
    return res.json();
  })
);
```

`map` с `async` callback возвращает массив Promise; нужен `Promise.all` (или `allSettled`).

---

## await на не-Promise

```javascript
async function f() {
  const x = await 42;
  console.log(x); // 42
}
```

Движок оборачивает значение в `Promise.resolve`. Полезно для унификации, но избыточно для литералов.

---

## Циклы: for, for...of, while

**По очереди** (часто нужно для rate limit):

```javascript
for (const id of ids) {
  await processOne(id);
}
```

**Параллельно с лимитом** — отдельные паттерны (nodejs-intermediate); наивно:

```javascript
await Promise.all(ids.map((id) => processOne(id)));
```

`forEach` с `async` callback **не ждёт** await:

```javascript
// плохо
ids.forEach(async (id) => {
  await processOne(id);
});
// forEach завершится сразу, processOne в фоне
```

Используйте `for...of` или `Promise.all`.

---

## Top-level await

В ES modules (Node с `"type": "module"`, Vite, браузер):

```javascript
// config.js
const res = await fetch("http://localhost:8090/health");
const config = await res.json();
export { config };
```

Импортирующий модуль **ждёт** инициализации. Удобно для конфига; в тестах может потребоваться mock до import.

```javascript
// main.js
import { config } from "./config.js";
console.log(config);
```

---

## async методы в классах

```javascript
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

const api = new ApiClient("http://localhost:8090");
const items = await api.get("/api/v1/items");
```

Связь с [21-classes.md](21-classes.md) и [29-fetch.md](29-fetch.md).

---

## Обработка ошибок в параллельных batch

```javascript
const results = await Promise.allSettled(
  urls.map((url) => fetchJson(url))
);

const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
const failed = results.filter((r) => r.status === "rejected");
```

Или один `try/catch` вокруг `Promise.all` — упадёт на первой ошибке.

---

## async/await vs чистые Promises

| Ситуация | Предпочтение |
|----------|--------------|
| Линейные шаги с ветвлениями | async/await |
| Трансформации без await | цепочка `.then` |
| Комбинаторы | `Promise.all` внутри async |
| Библиотечный pipeline | иногда then короче |

Стиль команды: чаще async/await для читаемости.

---

## Связь с курсом

- [26-promises.md](26-promises.md) — основа под await.
- [24-event-loop.md](24-event-loop.md) — продолжения после await.
- [28-lab-async.md](28-lab-async.md) — порядок вывода, retry, loadAll.
- [29-fetch.md](29-fetch.md) — HTTP с await.
- [30-es-modules.md](30-es-modules.md) — top-level await.
- [32-error-handling.md](32-error-handling.md) — стратегии recover/rethrow.

FastAPI стенд `:8090` — типичная цель `await fetch` в лабах nodejs/react.

---

## Типичные ошибки

1. **Последовательный await для независимых запросов** — лишняя латентность.

2. **`map(async ...)` без `Promise.all`** — не дождались результатов.

3. **`forEach(async ...)`** — не ждёт завершения.

4. **Забыть `return` в async** — неявный `undefined` в Promise.

5. **try/catch только вокруг одного await** — второй пробросит unhandled.

6. **async в конструкторе класса** — нельзя `await` в `constructor`; фабрика `static async create()`.

7. **Блокировать UI долгим await в обработчике** — await не делает work параллельным, только не блокирует стек между I/O; CPU между await всё ещё sync.

---

## Резюме

`async` функции возвращают Promise; `await` приостанавливает до settlement другого Promise. `try/catch` заменяет `.catch` для линейного кода. Независимые операции — `Promise.all`, не цепочка await. `map` с async требует `Promise.all`. Top-level await в modules для конфигурации. Циклы `for...of` с await — последовательная обработка; `forEach` с async — антипаттерн.

---

## Чек-лист

- Что возвращает `async () => 5`?
- Как запустить три `fetch` параллельно?
- Порядок вывода в примере A, demo(), B?
- Почему `urls.map(async (u) => fetch(u))` без `all` не ждёт?
- Где ловить ошибку от `await fetch(...)`?
- Можно ли `await` в `class constructor`?

Следующий урок: [28. Лаба: async](28-lab-async.md).
