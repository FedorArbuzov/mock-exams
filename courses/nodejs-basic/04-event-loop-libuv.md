# 04. Event loop в Node: фазы libuv

## Сценарий с работы

BFF «замирает» на десять секунд — в middleware кто-то вызвал `fs.readFileSync` на большом JSON каталога shop. Load balancer помечает инстанс unhealthy, хотя CPU не 100%: event loop **занят** синхронным кодом. На code review джун ставит `setImmediate` «чтобы не блокировать», не понимая фаз. В тесте порядок логов снова `1, 4, 3, 2` — вы уже видели это в [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md), но коллега из Python спрашивает: «Где у вас аналог `await asyncio.sleep(0)`?»

В браузере event loop описывают через **macrotasks** и **microtasks**. В Node та же V8-модель microtasks, но **macrotasks** разбиваются на **фазы libuv** — цикл, который управляет таймерами, I/O и `setImmediate`. Без этой карты нельзя объяснить, почему BFF перестаёт принимать запросы или почему порядок `setTimeout` vs `setImmediate` зависит от контекста.

## Что вы узнаете

- Как **libuv** дополняет V8 в Node.js runtime.
- Шесть **фаз** event loop: timers, pending, poll, check, close, и «между фазами».
- Где в Node **microtasks** (Promise, `queueMicrotask`).
- Сравнение с **браузерной** моделью из javascript-basic/24.
- Почему sync I/O и CPU-циклы **блокируют** весь процесс.
- Практические выводы для HTTP-сервера и BFF к `:8090`.

---

## V8 + libuv: два слоя

```text
┌─────────────────────────────────────────┐
│  JavaScript (ваш код, один поток)       │
│  Call Stack                             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  V8: microtasks (Promise, queueMicrotask)│
│  + process.nextTick (отдельная очередь)  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  libuv: event loop (фазы macrotasks)    │
│  + thread pool (часть fs, crypto, dns)  │
└─────────────────────────────────────────┘
```

| Слой | Ответственность |
|------|-----------------|
| **V8** | Выполнение JS, microtask queues |
| **libuv** | Таймеры OS, сетевой I/O (epoll/kqueue/IOCP), файлы, loop phases |
| **Thread pool** (default 4) | Некоторые sync-looking async fs/crypto операции |

Сетевой I/O (HTTP к FastAPI `:8090`) в Node **не блокирует** поток JS — колбэк придёт в фазе **poll**. Синхронный `while` или `readFileSync` — блокирует **всё**, включая обработку других клиентов BFF.

---

## Фазы event loop (упрощённая модель)

Один **tick** libuv (упрощённо):

```text
   ┌──────────────┐
   │   timers     │  setTimeout, setInterval (due callbacks)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ pending I/O  │  системные отложенные I/O callbacks
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    idle      │  внутренние задачи libuv
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    poll      │  новые I/O события; fetch sockets; fs read complete
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    check     │  setImmediate callbacks
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ close cb     │  e.g. socket.on('close', …)
   └──────────────┘
```

Между **каждой** фазой (и после poll) Node **опустошает microtasks** и **`process.nextTick` queue** — поэтому Promise `.then` может «обогнать» `setTimeout(0)`.

### timers

Колбэки таймеров, у которых истёк threshold. `setTimeout(fn, 0)` попадает сюда **не мгновенно** — минимум после текущего sync-кода и microtasks.

```javascript
setTimeout(() => console.log("timer phase"), 0);
```

### pending callbacks

Редкие системные отложенные операции (например, некоторые TCP ошибки). На практике думайте «системная очередь», не планируйте сюда свой код.

### poll

Самая «тёплая» фаза для backend:

- ждёт новые I/O (входящие HTTP на BFF);
- выполняет колбэки готовых I/O (ответ от FastAPI пришёл);
- может **блокироваться** ожиданием, если нет других задач.

Если в poll queue пусто и есть `setImmediate`, loop может перейти к **check** — отсюда путаница порядка `setTimeout(0)` vs `setImmediate` ([05-nexttick-setimmediate.md](05-nexttick-setimmediate.md)).

### check

**`setImmediate(fn)`** — «выполнить после текущей фазы poll».

```javascript
setImmediate(() => console.log("check phase"));
```

### close callbacks

Например `socket.on('close', handler)`. Важно для graceful shutdown ([02-process.md](02-process.md)).

---

## Microtasks в Node vs браузер

Модель из [javascript-basic/24-event-loop](../javascript-basic/24-event-loop.md):

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 1, 4, 3, 2
```

| Концепция | Браузер | Node.js |
|-----------|---------|---------|
| Microtasks | Promise, queueMicrotask, MutationObserver | Promise, queueMicrotask |
| Macrotasks | setTimeout, I/O (упрощённо) | libuv phases + timers + I/O |
| Render | между tasks | нет UI |
| `setImmediate` | нет | фаза check |
| `process.nextTick` | нет | **до** microtasks (особая очередь) |

**Правило для курса:** после sync-кода → **все nextTick** → **все microtasks** → следующая **macrotask/фаза**.

`async/await` из javascript-basic [27-async-await](../javascript-basic/27-async-await.md) — синтаксический sugar над Promise; продолжение после `await` = microtask.

---

## Блокировка loop: shop-каталог

Плохой middleware BFF:

```javascript
import { readFileSync } from "node:fs";

function loadCatalogSync() {
  const raw = readFileSync("./big-catalog.json", "utf8");
  return JSON.parse(raw);
}
```

Пока выполняется этот код, **ни один** другой запрос к BFF не обработается. Правильнее:

```javascript
import { readFile } from "node:fs/promises";

async function loadCatalog() {
  const raw = await readFile("./big-catalog.json", "utf8");
  return JSON.parse(raw);
}
```

Тяжёлый **JSON.parse** на 50 MB всё ещё CPU-bound в том же потоке — нужны streams, worker threads или вынос в Python API ([08-async-io-patterns.md](08-async-io-patterns.md)).

Демонстрация блокировки:

```javascript
console.log("start");
const t0 = Date.now();
while (Date.now() - t0 < 3000) {
  /* busy wait */
}
console.log("end");
// 3 секунды — никакой HTTP, никаких таймеров
```

---

## I/O к FastAPI и фаза poll

Когда BFF делает `fetch('http://localhost:8090/api/v1/items')`:

1. Sync-код отправляет запрос через libuv.
2. JS продолжает другие microtasks/macrotasks, пока сокет не готов.
3. Колбэк/resolver Promise срабатывает — microtasks.
4. Ваш `await` продолжается — handler Express отдаёт JSON клиенту.

Это **concurrency**, не **parallelism** JS. Параллельно работает OS и thread pool; ваш код — один поток.

---

## Сравнение с Python asyncio (preview)

| | Node libuv | asyncio |
|---|------------|---------|
| Модель | callback / Promise / async-await | coroutines / await |
| Default loop | libuv | uvloop (опционально) / selector |
| Sync blocking call | блокирует весь процесс | блокирует loop (нужен executor) |

Полное сравнение — [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Практические выводы для BFF

1. **Не используйте Sync API** на hot path (`readFileSync`, `pbkdf2Sync`).
2. **Не делайте CPU-heavy** в request handler без workers.
3. **Понимайте microtasks** — логирование «после ответа» через `Promise.then` vs `setImmediate` может отличаться.
4. **Graceful shutdown** — перестать принимать connections, дождаться poll queue ([02-process.md](02-process.md)).
5. **Мониторинг event loop lag** — симптом «API медленный, CPU низкий» часто = blocked loop.

---

## Типичные ошибки

**Думать, что «async функция» = другой поток.** Только I/O вынесено; тело `async function` до первого `await` синхронно.

**Сравнивать Node только с браузером.** `setImmediate` и фазы libuv — специфика Node; на собеседовании путают с `setTimeout(0)`.

**`setTimeout(fn, 0)` для «yield» под нагрузкой.** Под нагрузкой порядок и задержки нестабильны; для разбиения CPU — `setImmediate` или workers.

**Игнорировать thread pool exhaustion.** 4 потока по умолчанию — много `bcrypt` sync в параллель — очередь libuv растёт.

**Путать unhandledRejection с «loop завис».** Loop крутится; promise просто rejected без catch.

---

## Резюме

Node event loop = **V8 microtasks** + **фазы libuv** (timers → pending → poll → check → close). I/O к FastAPI и клиентам BFF обрабатывается асинхронно через poll; синхронный и CPU-bound код блокирует весь процесс. Браузерная модель 1-4-3-2 остаётся верной для Promise vs `setTimeout`; Node добавляет `setImmediate` и `nextTick`. Следующий урок — порядок этих очередей в деталях.

## Чек-лист

- [ ] Назовите пять фаз libuv и что выполняется в timers и check
- [ ] Почему `readFileSync` в Express middleware опасен
- [ ] Воспроизведите порядок 1, 4, 3, 2 и объясните microtasks
- [ ] Чем poll фаза важна для HTTP-сервера
- [ ] Отличие macrotask в браузере и фаз libuv в Node (в общих чертах)
- [ ] Связь с javascript-basic/24 и python-async

Следующий урок: [05. nextTick, queueMicrotask и setImmediate](05-nexttick-setimmediate.md).
