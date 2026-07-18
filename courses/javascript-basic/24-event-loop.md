# 24. Event loop: браузер и Node

## Сценарий с работы

Интерфейс «зависает» на три секунды после нажатия кнопки — в обработчике оказался тяжёлый цикл. В логах теста порядок `console.log` не совпадает с порядком строк в файле: сначала `4`, потом `3`, потом `2`. Коллега говорит: «Поставил `setTimeout(fn, 0)` — должно выполниться сразу после текущей строки», но это не так. На собеседовании классика: вывести порядок букв в смеси `setTimeout`, `Promise.then` и синхронного кода.

JavaScript **однопоточен** для вашего кода, но **асинхронен** за счёт очередей задач. Event loop — модель, которая объясняет, **когда** выполняются колбэки, таймеры и продолжения `await`.

## Что вы узнаете

- Почему долгий синхронный код блокирует UI и весь процесс Node
- Что такое call stack и как в него попадают функции
- Разницу между **macrotask** и **microtask** очередями
- Классический порядок вывода: `1, 4, 3, 2`
- Что реально делает `setTimeout(fn, 0)`
- Как `async/await` связан с microtasks
- Отличия браузера и Node.js на высоком уровне
- Практические выводы: workers, не блокировать loop, не полагаться на «нулевой» таймер

---

## Однопоточность: один стек вызовов

В один момент времени движок выполняет **одну** функцию до return (или ошибки). Вложенные вызовы складываются в **call stack**:

```javascript
function c() {
  console.log("in c");
}
function b() {
  c();
}
function a() {
  b();
}
a();
```

```text
| c() |
| b() |
| a() |
| main |
```

Пока в стеке крутится тяжёлая работа, **ничего другого** из JS не выполняется:

```javascript
console.log("start");
const t0 = Date.now();
while (Date.now() - t0 < 3000) {
  // пустой цикл 3 секунды
}
console.log("end");
```

В браузере не отрисуется анимация и не ответит клик; в Node не обработаются другие запросы в том же процессе.

Сеть, таймеры, чтение диска в Node делегируются **окружению** (браузерные Web APIs, libuv). По готовности результат не «врывается» в середину вашей функции — в очередь ставится **колбэк**, который event loop заберёт, когда стек опустеет.

---

## Откуда берётся асинхронность

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

console.log("4");
```

**Вывод:** `1`, `4`, `3`, `2`.

Пошагово:

1. `console.log("1")` — синхронно.
2. `setTimeout` регистрирует колбэк в окружении; по истечении 0 ms колбэк попадёт в **macrotask** (task) очередь.
3. `Promise.resolve().then(...)` ставит колбэк в **microtask** очередь.
4. `console.log("4")` — синхронно.
5. Стек пуст → движок **полностью опустошает microtasks** → печатается `3`.
6. Берётся следующая **macrotask** → печатается `2`.

**Правило (упрощённо для браузера и Node):** после каждой macrotask движок выполняет **все** накопившиеся microtasks, затем может отрисовать кадр (браузер), затем следующая macrotask.

---

## Microtasks vs macrotasks

| Тип | Примеры | Когда выполняется |
|-----|---------|-------------------|
| **Синхронный код** | вызовы функций, `console.log` | сразу, в текущем стеке |
| **Microtask** | `Promise.then/catch/finally`, `queueMicrotask`, `MutationObserver` | после текущего стека, до следующей macrotask |
| **Macrotask** | `setTimeout`, `setInterval`, I/O callback (Node), `setImmediate` (Node) | одна задача за «тик» loop (после microtasks) |

```javascript
queueMicrotask(() => console.log("micro"));
console.log("sync");
// sync, micro
```

`queueMicrotask` — тот же приоритет, что у `Promise.then` ([26-promises.md](26-promises.md)).

### Почему `setTimeout(fn, 0)` не «сразу»

Минимальная задержка в браузерах часто **4 ms** и больше (исторически); даже при 0 ms колбэк — **macrotask** и выполнится после синхронного кода и всех microtasks.

Использовать `setTimeout(..., 0)` для «отложить на потом» — допустимо, но для «после текущих Promise» точнее `queueMicrotask` или `Promise.resolve().then(...)`.

---

## Цепочка Promise и microtasks

```javascript
Promise.resolve()
  .then(() => console.log("A"))
  .then(() => console.log("B"));

console.log("C");
// C, A, B
```

Каждый `then` ставит новую microtask. Порядок в цепочке сохраняется.

Вложенный `then` внутри `then`:

```javascript
Promise.resolve().then(() => {
  console.log("1");
  Promise.resolve().then(() => console.log("2"));
  console.log("3");
});
// 1, 3, 2 — внутренний then ждёт опустошения текущей волны microtasks
```

Детали могут отличаться в edge cases; для курса достаточно: **microtasks выполняются пакетами до следующей macrotask**.

---

## `async/await` и event loop

`async` функция до первого `await` выполняется **синхронно**:

```javascript
async function demo() {
  console.log("inside start");
  await Promise.resolve();
  console.log("after await");
}

console.log("before");
demo();
console.log("after");
```

**Вывод:** `before`, `inside start`, `after`, `after await`.

После `await` продолжение функции ставится в **microtask** очередь ([27-async-await.md](27-async-await.md)).

---

## Браузер vs Node.js

| Аспект | Браузер | Node.js |
|--------|---------|---------|
| Долгий sync код | блокирует UI, вкладку | блокирует весь процесс |
| Таймеры | Web APIs → task queue | libuv timers |
| I/O | fetch, XHR | fs, net, dns — libuv thread pool |
| Отрисовка | между tasks (rendering) | нет UI |
| Доп. фазы | упрощённая модель | timers, pending, poll, check, close (libuv) |

В Node фаза **poll** ждёт I/O; `setImmediate` выполняется в фазе **check** после poll — на собеседованиях иногда сравнивают с `setTimeout(0)`. Для junior-достаточно: **I/O колбэки — macrotasks; Promise — microtasks**.

Сравнение с Python asyncio — [python-async](../python-async/README.md); углублённый Node — [nodejs-basic](../javascript-path.md).

---

## Блокировка event loop в Node

Опасные синхронные операции:

- `JSON.parse` / `JSON.stringify` на мегабайтных строках
- `fs.readFileSync`, `crypto.pbkdf2Sync`
- тяжёлые циклы на CPU без разбиения

**Решения:**

- асинхронные API (`fs.promises`, streams)
- **worker threads** для CPU-bound
- разбиение работы на чанки с `setImmediate` / `queueMicrotask` (редко, лучше worker)

В браузере аналог — **Web Workers**.

---

## Практические выводы для разработчика

1. **Не блокируйте loop** — парсинг, крипта, большие циклы выносите или дробите.

2. **Не синхронизируйте логику через порядок `setTimeout(0)`** — гонки и нестабильный порядок.

3. **`Promise.then` раньше `setTimeout(0)`** — если нужно «сразу после текущего кода», используйте microtasks осознанно.

4. **Ошибки в microtasks** — необработанный reject в Promise может дать unhandled rejection ([26-promises.md](26-promises.md)).

5. **Тесты** — `await Promise.resolve()` или `await new Promise(setImmediate)` в Node для «дождаться всех microtasks» (паттерны в javascript-testing).

---

## Визуальная схема (упрощённо)

```text
        ┌─────────────────┐
        │   Call Stack    │  ← синхронный JS
        └────────┬────────┘
                 │ stack empty
                 ▼
        ┌─────────────────┐
        │ Microtask Queue │  ← Promise, queueMicrotask
        └────────┬────────┘
                 │ drain all
                 ▼
        ┌─────────────────┐
        │ Macrotask Queue │  ← setTimeout, I/O, …
        └────────┬────────┘
                 │
                 └──► (browser: maybe render) ──► repeat
```

---

## Связь с курсом

- [01-landscape.md](01-landscape.md) — первое знакомство с `setTimeout` и однопоточностью.
- [25-callbacks.md](25-callbacks.md) — колбэки из таймеров и I/O попадают в очереди.
- [26-promises.md](26-promises.md) — microtasks от `.then`.
- [27-async-await.md](27-async-await.md) — `await` и продолжения.
- [28-lab-async.md](28-lab-async.md) — лаба на порядок вывода.

---

## Типичные ошибки

1. **Думать, что `setTimeout(0)` выполняется «на следующей строке»** — только после sync + microtasks.

2. **Путать «асинхронно» и «параллельно»** — в одном потоке JS параллелизма нет; параллельны только I/O и workers.

3. **Бесконечный цикл microtasks** — если каждый `then` ставит ещё `then` без macrotask, macrotasks и UI могут голодать (редко, но возможно в багах).

4. **Тяжёлая работа в `click` handler** — пользователь видит freeze.

5. **Игнорировать разницу Node/браузер** — в Node один процесс на много запросов; блокировка бьёт по всем.

---

## Резюме

JavaScript выполняет синхронный код в одном call stack. Асинхронные колбэки ждут в очередях: **microtasks** (Promise, `queueMicrotask`) обрабатываются полностью после каждого куска синхронного кода и перед следующей **macrotask** (`setTimeout`, I/O). Поэтому в классическом примере порядок `1, 4, 3, 2`. `async/await` продолжает функцию через microtasks. Долгий синхронный код блокирует всё остальное — выносите в workers или асинхронные API.

---

## Чек-лист

- Почему `while` на 3 секунды блокирует интерфейс?
- Воспроизведите порядок вывода в примере с `setTimeout(0)` и `Promise.then`
- Чем microtask отличается от macrotask? Приведите по два примера каждого
- Что выведет `async` функция до и после первого `await` относительно вызывающего кода?
- Зачем в Node избегать `readFileSync` на больших файлах?
- Почему `queueMicrotask` и `Promise.then` близки по приоритету?

Следующий урок: [25. Колбэки](25-callbacks.md).
