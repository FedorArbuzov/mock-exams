# 06. Лаба: порядок вывода и блокировка event loop

## Зачем эта лаба

На production «всё тормозит», а CPU 15% — часто **заблокирован event loop**, не «мало ядер». На собеседовании просят воспроизвести **1, 4, 3, 2** из [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md) и объяснить microtasks vs timers. Теория [04–05](04-event-loop-libuv.md) без рук не закрепляется: порядок логов кажется магией, пока не запустите файл десять раз и не добавите `nextTick` / `setImmediate`.

Лаба — **без HTTP и npm-пакетов**, только `node lab/…` из `examples/`. Домен shop не обязателен; навык переносится на BFF: почему sync парсинг каталога убивает `:3096` под нагрузкой.

## Предварительно

- Прочитаны [04. Event loop libuv](04-event-loop-libuv.md) и [05. nextTick / setImmediate](05-nexttick-setimmediate.md).
- Каталог: `courses/nodejs-basic/examples/`.
- Полезно освежить javascript-basic [24-event-loop](../javascript-basic/24-event-loop.md).

```bash
cd courses/nodejs-basic/examples
node --version
```

Эталоны — `solutions/` — после своей попытки.

---

## Задание 1. Классика 1, 4, 3, 2

**Контекст:** unit-тест в CI проверяет, что разработчик понимает microtasks.

Создайте `lab/06-classic-order.js`:

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

```bash
node lab/06-classic-order.js
```

**В комментарии в файле** (5–8 предложений): пошагово, почему порядок **1 → 4 → 3 → 2**. Упомяните call stack, microtasks, macrotasks (timers phase).

**Критерий:** вывод ровно четыре строки в указанном порядке.

---

## Задание 2. Расширенный порядок: nextTick и queueMicrotask

**Контекст:** логи BFF с mix API из [05-nexttick-setimmediate.md](05-nexttick-setimmediate.md).

`lab/07-full-order.js` — воспроизведите код:

```javascript
console.log("A sync");

process.nextTick(() => console.log("B nextTick"));

Promise.resolve().then(() => console.log("C promise"));

queueMicrotask(() => console.log("D microtask"));

setTimeout(() => console.log("E timeout"), 0);

setImmediate(() => console.log("F immediate"));

console.log("G sync");
```

Запишите **фактический** вывод вашей версии Node. В комментарии:

1. Почему `B` раньше `C` и `D`.
2. Почему `A` и `G` первые.
3. Почему `E` и `F` в конце и может ли их порядок меняться.

**Критерий:** файл запускается; комментарий согласован с выводом.

---

## Задание 3. async/await и event loop

**Контекст:** Express handler с `async` — когда выполняется код после `await`?

`lab/08-async-order.js`:

```javascript
async function loadLabel() {
  console.log("loadLabel: start");
  await Promise.resolve();
  console.log("loadLabel: after await");
  return "shop-catalog";
}

console.log("main: before");
loadLabel().then((v) => console.log("main: then", v));
console.log("main: after");
```

**Критерий:** предсказать вывод **до** запуска, затем сверить. В комментарии связать с [javascript-basic/27-async-await](../javascript-basic/27-async-await.md).

---

## Задание 4. Блокировка loop (обязательно)

**Контекст:** «BFF завис» — sync busy-wait в middleware.

`lab/09-block-loop.js`:

```javascript
console.log("block demo: start");

setTimeout(() => console.log("block demo: timer fired"), 100);

const deadline = Date.now() + 2000;
while (Date.now() < deadline) {
  // intentionally block event loop ~2s
}

console.log("block demo: sync end");
```

Запустите и зафиксируйте **задержку** появления `timer fired` относительно `sync end`.

**В комментарии:** почему таймер ~2 s опоздал; что было бы с вторым HTTP-запросом к BFF в это время. Ссылка на [04-event-loop-libuv.md](04-event-loop-libuv.md).

**Критерий:** три строки лога; таймер после `sync end`; понимание блокировки.

---

## Задание 5. Неблокирующая альтернатива (опционально)

**Контекст:** разбить работу через `setImmediate` (учебный паттерн; в production — workers).

`lab/10-yield-immediate.js` — посчитать от 0 до 1_000_000 **без** 2-секундного freeze таймера:

```javascript
let n = 0;
const limit = 1_000_000;
const chunk = 100_000;

console.log("yield: start");
setTimeout(() => console.log("yield: timer OK"), 50);

function work() {
  const end = Math.min(n + chunk, limit);
  while (n < end) n++;
  if (n < limit) {
    setImmediate(work);
  } else {
    console.log("yield: done", n);
  }
}

setImmediate(work);
```

**Критерий:** `timer OK` печатается **до** `yield: done`; в комментарии — почему `setImmediate`, а не `process.nextTick` в цикле.

---

## Критерии успеха (сводка)

- [ ] `06-classic-order.js` — порядок 1,4,3,2 и комментарий
- [ ] `07-full-order.js` — полный вывод и объяснение B/C/D/E/F
- [ ] `08-async-order.js` — предсказание + сверка
- [ ] `09-block-loop.js` — демонстрация блокировки таймера
- [ ] (Опционально) `10-yield-immediate.js` — timer до done
- [ ] Можете объяснить коллеге разницу «async I/O» и «blocked loop»

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Порядок 1,4,3,2 не тот | Лишний `await` top-level? Чистый Node без bundler |
| `queueMicrotask is not defined` | Node 11+; обновите LTS |
| Таймер в lab 09 срабатывает сразу | Убрали while? Должен быть ~2s block |
| setImmediate vs timeout одинаково | Нормально в main; смотрите комментарий в lab 07 |
| Процесс не завершается | `setImmediate`/`setTimeout` ещё в очереди — добавьте или подождите |
| Flaky порядок E/F | Документируйте версию Node в комментарии |

---

## Связь с курсом

| Материал | Связь |
|----------|-------|
| [07-python-async-comparison.md](07-python-async-comparison.md) | asyncio sleep(0) vs setImmediate |
| [08-async-io-patterns.md](08-async-io-patterns.md) | fs.promises вместо sync |
| [javascript-basic/28-lab-async](../javascript-basic/28-lab-async.md) | параллельная лаба в браузерной ветке |

---

## Типичные ошибки

**Смотреть эталон до своего вывода** — сначала предсказание, потом `node`.

**Путать «таймер 100 ms» и «блок 2000 ms»** — таймер не может fire пока loop занят sync.

**Использовать nextTick в lab 10 вместо setImmediate** — таймер может опоздать сильнее (starvation).

---

## Резюме

Лаба закрепила **1,4,3,2**, очереди **nextTick / microtask / timer / immediate**, порядок **async/await** и **блокировку loop** vs **setImmediate yield**. Это база для async I/O к FastAPI `:8090` и Express handlers без «мистических» зависаний.

## Чек-лист

- [ ] Все обязательные lab-файлы (06–09) созданы
- [ ] Комментарии в коде своими словами, не copy-paste из урока
- [ ] Запускали из `examples/`
- [ ] Можете нарисовать схему: sync → nextTick → microtasks → macrotask

Следующий урок (теория): [07. Сравнение с python-async](07-python-async-comparison.md).
