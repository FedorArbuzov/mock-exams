# 05. `process.nextTick`, `queueMicrotask` и `setImmediate`

## Сценарий с работы

Code review BFF: senior просит заменить `process.nextTick(() => sendMetrics())` на `setImmediate`, потому что «nextTick голодит I/O». Джун спрашивает: «А `queueMicrotask` не то же самое?» В логах теста порядок `nextTick → Promise → setImmediate → setTimeout` не совпадает с ожиданиями из [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md). На собеседовании классика для Node: объяснить разницу **nextTick**, **microtask** и **setImmediate** на одном файле.

Эта глава — углубление [04-event-loop-libuv.md](04-event-loop-libuv.md). Три механизма «выполнить позже», но **не в одной очереди**. Путаница ломает метрики, тесты и отладку async middleware перед Express ([22-middleware.md](22-middleware.md)).

## Что вы узнаете

- Очередь **`process.nextTick`** — приоритет и риск starvation.
- **`queueMicrotask`** и **`Promise.then`** — одна семья microtasks V8.
- **`setImmediate`** vs **`setTimeout(0)`** — check vs timers phase.
- Порядок вывода в комбинированных примерах.
- Когда что использовать в прикладном коде BFF.
- Антипatterns и связь с [`python-async`](../python-async/README.md) (`call_soon` / `await asyncio.sleep(0)`).

---

## Карта очередей (Node)

После текущего синхронного кода (call stack пуст):

```text
1. process.nextTick queue     ← drain до конца (осторожно!)
2. microtask queue            ← Promise, queueMicrotask (до конца)
3. macrotask / фаза libuv     ← setTimeout, I/O, setImmediate, …
```

Между **фазами** libuv снова пункты 1–2. Поэтому nextTick и microtasks «везде между» macrotasks.

| API | Тип очереди | Фаза libuv |
|-----|-------------|------------|
| `process.nextTick(fn)` | nextTick | между любыми фазами |
| `queueMicrotask(fn)` | microtask | после nextTick, до macrotask |
| `Promise.then(fn)` | microtask | то же |
| `setTimeout(fn, 0)` | timer macrotask | timers |
| `setImmediate(fn)` | check macrotask | check (после poll) |

---

## process.nextTick

Исторический API Node — **раньше** microtasks V8:

```javascript
console.log("sync start");

process.nextTick(() => {
  console.log("nextTick 1");
  process.nextTick(() => console.log("nextTick 2"));
});

Promise.resolve().then(() => console.log("promise"));

console.log("sync end");
```

**Типичный вывод:**

```text
sync start
sync end
nextTick 1
nextTick 2
promise
```

`nextTick 2` внутри nextTick выполняется **до** Promise — потому что очередь nextTick не отдаёт управление microtasks, пока не опустеет (на практике — осторожно с рекурсией).

### Зачем nextTick в реальном коде

- Эмуляция «async» до Promises в старом коде.
- Передать ошибку асинхронно: `process.nextTick(() => { throw err; })`.
- **Не** для defer тяжёлой работы — голодит I/O.

### Starvation (голодание I/O)

```javascript
function spinNextTick() {
  process.nextTick(spinNextTick);
}
spinNextTick();
// setImmediate и I/O никогда не получат control
```

В production так делать нельзя. Для «отложить на следующий tick loop» предпочтительнее **`setImmediate`**.

---

## queueMicrotask и Promise

Стандарт ECMAScript; в Node ведут себя как в браузере ([javascript-basic/24](../javascript-basic/24-event-loop.md)):

```javascript
queueMicrotask(() => console.log("microtask A"));
Promise.resolve().then(() => console.log("microtask B"));
console.log("sync");
// sync, microtask A, microtask B (порядок регистрации)
```

`async/await`:

```javascript
async function f() {
  console.log("f start");
  await Promise.resolve();
  console.log("f after await");
}

console.log("before f");
f();
console.log("after f");
// before f, f start, after f, f after await
```

Продолжение после `await` — microtask. Для «run after current sync code» в современном коде предпочитайте **queueMicrotask** или **Promise**, не nextTick — если нет причины Node-specific.

---

## setImmediate vs setTimeout(0)

Классический пример **из main module** (не из I/O callback):

```javascript
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
console.log("sync");
```

Порядок **`sync`**, затем **не гарантирован стабильно** между `timeout` и `immediate` — зависит от версии Node, загрузки, фаз. Часто сначала `timeout`, иногда `immediate`.

Из **I/O callback** (например, после `fs.readFile`):

```javascript
import { readFile } from "node:fs";

readFile(import.meta.filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// Почти всегда: immediate, затем timeout
```

Почему: после poll фазы loop переходит к **check** (`setImmediate`) раньше, чем снова к **timers**.

### Когда использовать setImmediate

- Разбить длинный sync-цикл на chunks (legacy pattern до worker_threads).
- «После текущих I/O» — defer без блокировки poll следующим nextTick-штормом.

```javascript
let i = 0;
function chunk() {
  while (i < 1_000_000 && Date.now() - start < 5) {
    i++;
  }
  if (i < 1_000_000) setImmediate(chunk);
  else console.log("done", i);
}
const start = Date.now();
chunk();
```

---

## Сводный пример для интервью

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

setImmediate(() => console.log("3"));

process.nextTick(() => console.log("4"));

Promise.resolve().then(() => console.log("5"));

queueMicrotask(() => console.log("6"));

console.log("7");
```

**Гарантированная часть:**

```text
1
7
4          ← nextTick
5          ← Promise microtask
6          ← queueMicrotask (после 5, порядок регистрации)
2 и 3      ← timeout vs immediate — после всего выше; порядок 2/3 может vary в main
```

Сравните с классикой **1, 4, 3, 2** из javascript-basic — там не было nextTick/setImmediate; **5 и 6** — microtasks между sync и timers.

---

## Таблица: что выбрать в BFF

| Задача | Рекомендация |
|--------|--------------|
| После текущего promise chain | `.then` / `await` |
| Одноразово после sync, стандарт ES | `queueMicrotask` |
| Node-only defer без голодания I/O | `setImmediate` |
| Legacy / emit err async | `process.nextTick` (редко) |
| Задержка N ms | `setTimeout` |
| Не блокировать loop на CPU | worker_threads, не nextTick loop |

---

## Сравнение с Python asyncio (кратко)

| Node | asyncio (см. [python-async](../python-async/README.md)) |
|------|-----------------------------------------------------------|
| `process.nextTick` | `loop.call_soon` (ближе, но не идентично) |
| `queueMicrotask` / Promise | `asyncio.create_task` / Future done callbacks |
| `await asyncio.sleep(0)` | yield control — ближе к `setImmediate`, не к nextTick |
| Sync `time.sleep` в coroutine | блокирует loop — как sync JS |

Подробно — [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Типичные ошибки

**Считать nextTick и queueMicrotask взаимозаменяемыми.** nextTick **всегда** раньше Promise; может голодить I/O.

**Рекурсивный nextTick для «async API».** Используйте Promise или `setImmediate`.

**Полагаться на порядок setTimeout vs setImmediate в main.** В тестах flaky; документируйте или фиксируйте контекст I/O.

**Дублировать defer тремя способами в одном handler.** Один стиль на проект — читаемость.

**«setImmediate = setTimeout(0)».** Разные фазы libuv; в I/O callback порядок другой.

---

## Резюме

**nextTick** — самая приоритетная «отложенная» очередь Node, опасна при злоупотреблении. **Microtasks** (`Promise`, `queueMicrotask`) — стандарт V8, как в браузере. **setImmediate** — macrotask фазы check после poll; для defer CPU-chunks предпочтительнее nextTick. **setTimeout(0)** — фаза timers. В BFF и Express чаще всего достаточно async/await; nextTick/setImmediate — для edge cases и понимания логов. Лаба [06-lab-event-loop.md](06-lab-event-loop.md) закрепит порядок вывода и блокировку.

## Чек-лист

- [ ] Какой порядок: sync, nextTick, Promise, setTimeout — в общих чертах?
- [ ] Почему рекурсивный nextTick опасен?
- [ ] Чем setImmediate отличается от setTimeout(0) после fs callback?
- [ ] Когда использовать queueMicrotask вместо nextTick?
- [ ] Связь async/await с microtasks
- [ ] Можете прочитать сводный пример 1–7 без запуска

Следующий урок: [06. Лаба: event loop](06-lab-event-loop.md).
