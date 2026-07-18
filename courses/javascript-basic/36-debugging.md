# 36. Отладка: console, DevTools, breakpoints

## Сценарий с работы

«У меня локально работает» — классика. В prod `total` приходит `NaN`, в логах тишина. Коллега за пять минут в DevTools находит: `fetch` вернул 500, но код всё равно вызвал `.json()`. Вы добавляете `console.log` в десять мест — вывод нечитаемый. Нужна **система**: воспроизвести, локализовать, проверить гипотезу, исправить, убедиться.

Отладка — навык не менее важный, чем синтаксис. Эта глава — инструменты **Node** и **браузера**, плюс привычки, которые экономят часы.

## Мышление отладчика

```text
1. Воспроизведение  — стабильные шаги, минимальный пример
2. Гипотеза         — что именно неверно (значение, порядок, тип)
3. Наблюдение       — breakpoint, log, Network tab
4. Исправление      — один change за раз
5. Регрессия        — не сломали ли другое
```

Не начинайте с «перепишу всё». Сначала **узкий** failing case — принцип из [03-lab-first-scripts.md](03-lab-first-scripts.md).

## console — первый прибор

```javascript
const user = { id: 1, name: "Ann", roles: ["admin", "user"] };

console.log("user loaded", user);
console.info("info level");
console.warn("deprecated endpoint /v1/items");
console.error(new Error("save failed"));

console.table(user.roles.map((r, i) => ({ index: i, role: r })));

console.group("HTTP request");
console.log("method", "GET");
console.log("url", "/api/items");
console.groupEnd();
```

### log vs debug vs info

| Метод | Где виден |
|-------|-----------|
| `log` | везде |
| `info` | везде (часто фильтруется) |
| `debug` | часто скрыт, пока не включён Verbose в DevTools |
| `warn` | жёлтый, предупреждения |
| `error` | красный, stack для Error |

В Node все идут в stderr/stdout; уровни — соглашение команды.

### Объекты и момент снимка

```javascript
const state = { count: 0 };
console.log("before", state);
state.count = 1;
console.log("after", state);
// в DevTools оба log могут показать count: 1 — объект по ссылке
```

Для снимка:

```javascript
console.log("snapshot", structuredClone(state));
// или JSON.stringify(state)
```

### console.time / timeEnd

```javascript
console.time("fetch-items");
const res = await fetch("/api/items");
const data = await res.json();
console.timeEnd("fetch-items");
// fetch-items: 234.567ms
```

Имена таймеров должны **совпадать**; вложенные — разные labels. Альтернатива — `performance.now()` для точных замеров.

### console.trace — стек вызовов

```javascript
function inner() {
  console.trace("who called inner");
}

function outer() {
  inner();
}

outer();
// Trace: who called inner
//   at inner (...)
//   at outer (...)
```

Показывает **цепочку вызовов** в момент trace — полезно при «откуда это вызвалось?».

### console.assert

```javascript
console.assert(total >= 0, "negative total", { total, items });
// если condition false — сообщение как warn
```

Не заменяет тесты — быстрая проверка инварианта при разработке.

## debugger — программная точка останова

```javascript
function calculateDiscount(price, percent) {
  debugger; // выполнение пауза, если инспектор подключён
  return price * (1 - percent / 100);
}
```

- **Браузер:** DevTools открыты → пауза на строке.
- **Node:** запуск с `--inspect` / `--inspect-brk`.

**Удаляйте** `debugger` перед merge — иначе prod зависнет при открытом remote debug (или пропустит, если inspector не attached).

## Отладка в Node.js

### Запуск с inspector

```bash
cd courses/javascript-basic/examples
node --inspect-brk lab/buggy.js
```

`--inspect-brk` — пауза на **первой** строке до подключения debugger.

Chrome: `chrome://inspect` → **Open dedicated DevTools for Node**.

VS Code / Cursor: конфигурация **Launch Program** с `"runtimeArgs": ["--inspect-brk"]` или кнопка «Debug» на открытом файле.

### Что смотреть в Node DevTools

| Панель | Назначение |
|--------|------------|
| **Sources** | breakpoints, step over/into/out |
| **Watch** | выражения при каждой паузе |
| **Call Stack** | цепочка функций |
| **Scope** | локальные и closure переменные |
| **Console** | REPL в контексте паузы |

### node inspect (REPL debugger)

```bash
node inspect lab/script.js
```

Команды: `cont`, `next`, `step`, `repl`. Менее удобен, чем Chrome/VS Code, но работает везде.

### NODE_OPTIONS

```bash
NODE_OPTIONS='--inspect' node lab/script.js
```

## Отладка в браузере (DevTools)

Откройте F12 → вкладки:

### Sources

- Клик по номеру строки — **breakpoint**.
- **Conditional breakpoint** — пауза только если `userId === 7`.
- **Step over (F10)** — следующая строка в этой функции.
- **Step into (F11)** — войти в вызов.
- **Step out (Shift+F11)** — выйти из функции.

### Network

Для [29-fetch.md](29-fetch.md):

- статус 404/500;
- тело ответа (Preview / Response);
- timing (TTFB, download);
- при CORS-fail запрос может быть **красным** без readable body — смотрите Console.

### Console

- фильтр по level;
- **Live Expression** — pin выражение (`cart.total`).
- `$0` — последний выбранный элемент Elements.

### Application

Storage, cookies — позже в [`browser-platform`](../javascript-path.md).

## Типичные классы багов

### Неожиданный undefined

```javascript
const user = users.find((u) => u.id === id);
console.log(user.name); // TypeError если find вернул undefined
```

Breakpoint **до** строки; watch `user`. Исправление — guard или optional chaining [19-optional-nullish.md](19-optional-nullish.md).

### Порядок async

Симптом: логи «вперемешку». Связь с [24-event-loop.md](24-event-loop.md):

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 1, 4, 3, 2
```

Метки времени:

```javascript
const t = () => new Date().toISOString();
console.log(t(), "start");
await fetch(url);
console.log(t(), "after fetch");
```

### Мутация state

```javascript
function addItem(cart, item) {
  cart.items.push(item); // мутирует аргумент
  return cart;
}
```

Лог **до и после**; `structuredClone` для сравнения; в тестах — [08-arrays.md](08-arrays.md) immutability.

### fetch и JSON

```javascript
const res = await fetch(url);
const data = await res.json(); // SyntaxError если HTML error page
```

Network tab → Response. Код: проверка `res.ok` до parse.

### this и контекст

[14-this.md](14-this.md) — breakpoint в method, смотрите `this` в Scope.

## Стратегия логирования при отладке

Вместо десяти `console.log`:

```javascript
const DEBUG = process.env.DEBUG === "1";

function debug(...args) {
  if (DEBUG) console.log("[debug]", ...args);
}
```

Или structured log:

```javascript
console.log(JSON.stringify({ event: "cart.add", productId, qty, total }));
```

В production — pino/winston ([`nodejs-basic`](../javascript-path.md)), не raw console.

## Source maps (обзор)

TypeScript и bundler генерируют `.map` — DevTools показывает **исходный** TS/JSX, а не скомпилированный код. В чистом Node-курсе maps редки; в React — обязательны.

## Чего избегать

| Антипаттерн | Почему |
|-------------|--------|
| `debugger` в main | блок prod / CI |
| commit с `console.log` шумом | code review reject |
| править код «наугад» без repro | регрессии |
| игнорировать warning | часто precursors багов |

## Минимальный чек-лист перед «готово»

- [ ] Баг воспроизводится на минимальном примере
- [ ] Breakpoint или один targeted log подтвердил гипотезу
- [ ] Убраны временные `debugger` и лишние logs
- [ ] Edge case проверен (null, пустой массив, 404)

## Связь с лабами

- [37-lab-collections.md](37-lab-collections.md) — `console.table`, `console.time` на pipeline.
- [33-lab-errors.md](33-lab-errors.md) — осмысленные сообщения вместо молчаливого fail.

## Типичные ошибки

- **Смотреть только Console**, не Network — при HTTP-багах.
- **Логировать объект без clone** — misleading snapshot в DevTools.
- **Забыть `--inspect-brk`** — скрипт завершился до attach.
- **Conditional breakpoint не задан** — слишком много пауз в цикле.
- **Не читать stack trace** — первая строка вашего кода в trace часто место fix.

## Чек-лист

- Чем `console.time` удобнее ручного `Date.now()`?
- Как поставить breakpoint в Node без IDE?
- Порядок 1,4,3,2 в примере event loop — почему?
- Что покажет Network при HTTP 500 vs CORS error?
- Зачем `console.trace`?
- Что удалить перед merge в main?

Следующий урок: [37. Лаба: коллекции](37-lab-collections.md).
