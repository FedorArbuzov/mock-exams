# 25. Колбэки и callback hell

## Сценарий с работы

В легаси-модуле Node файл читается так: `readFile(path, (err, data) => { ... })`. Нужно прочитать конфиг, по нему — список пользователей, по первому пользователю — заказы. Код уезжает вправо на пятнадцать уровней вложенности — **callback hell**. В проде callback вызвался дважды, и баланс списался дважды. Новый сервис пишете на `async/await`, но `stream.on("data", ...)` и `addEventListener` всё ещё колбэки.

Колбэки — фундамент асинхронности в JavaScript. Promises и `async/await` построены **поверх** них, но не заменили полностью.

## Что вы узнаете

- Что такое callback и конвенция Node `(err, result)`
- Как выглядит callback hell и почему это проблема
- Inversion of control и риски «чужого» вызова
- События как подписка на колбэки
- Когда колбэки уместны в современном коде
- Как оборачивать callback API в Promise
- Связь с event loop и следующими уроками

---

## Колбэк: функция, которую вызовут позже

**Колбэк** — функция, переданная другому коду для вызова **после** события или завершения операции.

```javascript
function greetLater(name, callback) {
  console.log("scheduling...");
  setTimeout(() => {
    callback(`Hello, ${name}`);
  }, 100);
}

greetLater("Ann", (message) => {
  console.log(message);
});
```

**Вывод:**

```text
scheduling...
Hello, Ann
```

`s greetLater` вернулся сразу; колбэк выполнился позже через event loop ([24-event-loop.md](24-event-loop.md)).

Функции — объекты первого класса ([10-functions.md](10-functions.md)); колбэк — обычная передача функции как значения.

---

## Конвенция Node.js: `(err, data)`

Исторически асинхронные API Node используют **error-first callback**:

```javascript
function loadFile(path, callback) {
  // псевдокод внутренностей
  readFromDisk(path, (diskErr, raw) => {
    if (diskErr) {
      return callback(diskErr);
    }
    callback(null, raw);
  });
}

loadFile("config.json", (err, data) => {
  if (err) {
    console.error("Failed:", err.message);
    return;
  }
  console.log("OK:", data);
});
```

| Первый аргумент | Значение |
|-----------------|----------|
| `err` truthy | ошибка, `data` не использовать |
| `err` null/undefined | успех, `data` — результат |

**Всегда** проверяйте `err` первым — иначе разбор `data` на упавшей операции даст вторичные ошибки.

Современная замена в Node:

```javascript
import { readFile } from "node:fs/promises";

const data = await readFile("config.json", "utf-8");
```

Под капотом `fs/promises` оборачивает колбэковый `fs.readFile`.

---

## Callback hell (пирамида doom)

Три зависимых асинхронных шага без Promise:

```javascript
function getUser(id, cb) {
  setTimeout(() => cb(null, { id, name: "Ann" }), 50);
}
function getOrders(userId, cb) {
  setTimeout(() => cb(null, [{ id: 101 }]), 50);
}
function getOrderDetail(orderId, cb) {
  setTimeout(() => cb(null, { total: 99 }), 50);
}

getUser(1, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getOrderDetail(orders[0].id, (err, detail) => {
      if (err) return handle(err);
      console.log(user.name, detail.total);
    });
  });
});
```

**Проблемы:**

1. **Читаемость** — вложенность растёт с каждым шагом.
2. **Обработка ошибок** — `if (err)` на каждом уровне или один `handle` — легко забыть.
3. **Параллельность** — сложно запустить два запроса и дождаться обоих без дополнительной библиотеки.
4. **Отладка** — стек ошибок через колбэки менее удобен, чем с `async/await`.

Рефакторинг на Promises ([26-promises.md](26-promises.md)):

```javascript
getUser(1)
  .then((user) => getOrders(user.id))
  .then((orders) => getOrderDetail(orders[0].id))
  .then((detail) => console.log(detail))
  .catch(handle);
```

---

## Inversion of control

Передавая колбэк, вы отдаёте контроль **когда** и **сколько раз** его вызовут:

```javascript
function brokenApi(cb) {
  cb(null, "ok");
  cb(null, "ok again"); // двойной вызов — баг библиотеки
}
```

Риски:

- колбэк **никогда** не вызван (зависание);
- вызван **больше одного** раза;
- вызван синхронно, когда вы ожидали async (нарушение контракта).

С Promise состояние **pending → settled** один раз — часть проблем снимается ([26-promises.md](26-promises.md)).

---

## События: колбэки по подписке

Модель «издатель — подписчик»:

```javascript
const button = document.querySelector("button");

function onClick(event) {
  console.log("clicked", event.type);
}

button.addEventListener("click", onClick);
// позже:
button.removeEventListener("click", onClick);
```

В Node:

```javascript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
emitter.on("data", (chunk) => console.log(chunk));
emitter.emit("data", "hello");
```

Отписка важна — иначе утечки памяти через замыкания ([12-closures.md](12-closures.md)), особенно в SPA.

---

## Колбэки в таймерах и I/O

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// A, C, B
```

Колбэк таймера — macrotask; не выполняется «между A и C».

Файловый поток (концептуально):

```javascript
stream.on("data", (chunk) => {
  processChunk(chunk);
});
stream.on("end", () => {
  console.log("done");
});
```

Каждый chunk — отдельный колбэк; backpressure и ошибки обрабатываются отдельно (nodejs-basic).

---

## Обёртка callback → Promise

Когда API только с колбэком:

```javascript
import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);

const data = await readFileAsync("config.json", "utf-8");
```

Или вручную:

```javascript
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    readFile(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

**Правило:** `new Promise` только для адаптации legacy; не оборачивайте уже синхронный код «для красоты» ([26-promises.md](26-promises.md)).

---

## Когда колбэки всё ещё уместны

| Ситуация | Почему колбэк |
|----------|----------------|
| DOM events | нативная модель браузера |
| Streams (Node) | много мелких `data` событий |
| Старые npm-модули | нет Promise API |
| `setTimeout` / `setImmediate` | простая отложенная задача |

Новый прикладной код на HTTP-цепочках — **async/await** + `fetch` ([27-async-await.md](27-async-await.md), [29-fetch.md](29-fetch.md)).

---

## Сравнение стилей

| Аспект | Колбэки | Promises / async |
|--------|---------|------------------|
| Вложенность | пирамида | линейный код |
| Ошибки | err на каждом уровне | один `catch` / `try/catch` |
| Повторный вызов | возможен баг | settled один раз |
| Отмена | вручную | `AbortController` + fetch |
| Читаемость | падает с глубиной | выше |

---

## Связь с курсом

- [24-event-loop.md](24-event-loop.md) — когда вызывается колбэк.
- [26-promises.md](26-promises.md) — следующий слой абстракции.
- [28-lab-async.md](28-lab-async.md) — `delay`, fake fetch, retry.
- [python-async](../python-async/README.md) — колбэки vs `async def` в Python.

В mock-exams FastAPI на `:8090` отвечает синхронно с точки зрения клиента, но клиентский JS всё равно получает ответ через колбэк/Promise `fetch`.

---

## Типичные ошибки

1. **Забыть проверить `err`** в Node-style API.

2. **Callback hell вместо Promise.all** — независимые запросы вложили последовательно.

3. **Предполагать ровно один вызов** колбэка — защищайтесь флагом или переходите на Promise.

4. **Смешивать return и колбэк** в одной функции — вызывающий не знает, что использовать.

5. **Не отписываться от events** — утечки в долгоживущих страницах.

6. **Глубокая вложенность вместо именованных функций** — иногда `function onUser(err, user) { ... }` на верхнем уровне уже помогает до Promises.

---

## Резюме

Колбэк — функция, вызываемая позже при завершении операции. Node popularized `(err, result)`. Вложенные зависимые шаги дают callback hell и дублирование обработки ошибок. Inversion of control передаёт ответственность за вызов библиотеке. События — колбэки по подписке. Современный прикладной код предпочитает Promises и `async/await`, но streams, DOM и legacy npm остаются на колбэках — их нужно читать и при необходимости promisify.

---

## Чек-лист

- Что означает первый аргумент `(err, data)` в Node?
- Назовите три проблемы callback hell
- Что такое inversion of control в двух предложениях?
- Как `readFile` из `fs/promises` связан с колбэковым `readFile`?
- Почему `removeEventListener` важен?
- Когда всё же писать колбэк, а не `async` функцию?

Следующий урок: [26. Promises](26-promises.md).
