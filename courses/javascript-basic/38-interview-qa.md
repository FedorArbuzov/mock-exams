# 38. Interview Q&A: разбор топ-35 вопросов

## Введение: зачем эта глава

На собеседовании по JavaScript вас редко просят «перечислить методы массива». Чаще — **объяснить поведение кода**, найти баг в snippet, описать порядок вывода или спроектировать маленькую утилиту словами. Эта глава — **развёрнутые ответы** к вопросам из [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать с главой:**

1. Прочитайте вопрос, **закройте** ответ и ответьте вслух 1–2 минуты.
2. Откройте разбор и сравните: не только «что», но и **почему**.
3. Если провалились — вернитесь к уроку из колонки «Где в курсе».

---

## Блок 1. Типы и синтаксис

### 1. Семь примитивов? Почему `typeof null === "object"`?

**Ответ.** Примитивы ES2020+: `undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`. Всё остальное — объекты (включая массивы, функции, `Date`).

`typeof null === "object"` — **баг первой версии JS** (1995): внутренний тег для `null` совпадал с тегом объекта. Исправление ломало бы существующий веб. Надёжная проверка на `null`: `value === null`.

**Где в курсе:** [04-primitives.md](04-primitives.md).

---

### 2. Все falsy значения?

**Ответ.** Ровно восемь значений приводятся к `false` в `Boolean(x)`:

`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.

**Важно:** `[]`, `{}`, `"0"` — **truthy**. Пустой массив в `if (items)` — true; проверяйте `items.length`.

**Где в курсе:** [04-primitives.md](04-primitives.md), [05-coercion-comparison.md](05-coercion-comparison.md).

---

### 3. `==` vs `===`? Когда допустим `== null`?

**Ответ.** `===` сравнивает **без приведения типов**. `==` применяет алгоритм Abstract Equality Comparison (строки ↔ числа, `null == undefined`, и т.д.).

В новом коде — **всегда `===`**, кроме идиомы:

```javascript
if (value == null) {
  // value === null || value === undefined
}
```

**Почему не `==` везде:** `"5" == 5` → true; `"" == 0` → true — скрытые баги в формах и API.

**Где в курсе:** [05-coercion-comparison.md](05-coercion-comparison.md).

---

### 4. `||` vs `??` на `0` и `""`?

**Ответ.**

| Выражение | Результат | Причина |
|-----------|-----------|---------|
| `0 \|\| 3000` | `3000` | `0` falsy |
| `0 ?? 3000` | `0` | только null/undefined |
| `"" \|\| "default"` | `"default"` | `""` falsy |
| `"" ?? "default"` | `""` | пустая строка задана намеренно |

`||` — «первый truthy»; `??` — «если nullish, подставить дефолт». Для портов, счётчиков, цен используйте `??`.

**Где в курсе:** [05-coercion-comparison.md](05-coercion-comparison.md), [19-optional-nullish.md](19-optional-nullish.md).

---

### 5. `let` vs `const` vs `var`?

**Ответ.**

| | Область | Переприсвоение | Hoisting |
|---|---------|----------------|----------|
| `var` | функция | да | да, как `undefined` |
| `let` | блок | да | TDZ до объявления |
| `const` | блок | нет binding* | TDZ |

\* `const obj = {}; obj.x = 1` — OK; `obj = {}` — TypeError.

**Правило:** `const` по умолчанию, `let` если переприсваиваете, `var` — не использовать.

**Где в курсе:** [02-variables-strict.md](02-variables-strict.md).

---

### 6. Что такое TDZ?

**Ответ.** **Temporal Dead Zone** — интервал от начала блока до строки `let x = …`, где `let`/`const` уже «знают» переменную, но доступ к ней — `ReferenceError`. Защита от использования до инициализации.

```javascript
console.log(a); // ReferenceError (не undefined!)
let a = 1;
```

У `var` hoisting даёт `undefined` без ошибки — источник багов.

**Где в курсе:** [02-variables-strict.md](02-variables-strict.md), [11-scope-hoisting.md](11-scope-hoisting.md).

---

## Блок 2. Функции и scope

### 7. Что такое closure? Пример?

**Ответ.** **Замыкание** — функция + лексическое окружение, в котором она создана. Внутренняя функция читает переменные внешней **после** того, как внешняя вернулась.

```javascript
function makeCounter() {
  let n = 0;
  return () => ++n;
}
const inc = makeCounter();
inc(); // 1
inc(); // 2
```

**Применение:** приватное состояние, фабрики, debounce, memoize, колбэки с контекстом.

**Где в курсе:** [12-closures.md](12-closures.md).

---

### 8. Arrow vs function — `this`, `arguments`, `new`?

**Ответ.**

| | `function` | Arrow |
|---|------------|-------|
| `this` | динамический (от вызова) | лексический (снаружи) |
| `arguments` | есть | нет (rest `...args`) |
| `new` | можно (если не arrow) | TypeError |
| `prototype` | есть | нет |

Методы объекта с `this` — обычные функции; колбэки внутри методов — часто стрелки.

**Где в курсе:** [10-functions.md](10-functions.md), [14-this.md](14-this.md).

---

### 9. `obj.method()` vs `const f = obj.method; f()`?

**Ответ.** В первом случае вызов **как метод** — `this = obj`. Во втором — **голая функция** — в strict/module `this = undefined`. Отсюда баги `setTimeout(obj.save)` и `array.map(obj.transform)`.

**Fix:** стрелка-обёртка, `bind`, или `call`.

**Где в курсе:** [14-this.md](14-this.md).

---

### 10. `call`, `apply`, `bind`?

**Ответ.** Все задают `this` явно:

- `fn.call(ctx, a, b)` — аргументы списком;
- `fn.apply(ctx, [a, b])` — массив аргументов;
- `fn.bind(ctx, a)` — **новая** функция с зафиксированным `this` (и частично аргументами).

`bind` не вызывает функцию сразу — удобно для колбэков.

**Где в курсе:** [14-this.md](14-this.md).

---

## Блок 3. Объекты и прототипы

### 11. Shallow vs deep copy?

**Ответ.** `{ ...obj }` и `Object.assign` — **поверхностная** копия: вложенные объекты общие.

```javascript
const a = { nested: { x: 1 } };
const b = { ...a };
b.nested.x = 2;
a.nested.x; // 2
```

Глубокая — `structuredClone` (простые данные), или явное копирование вложенностей, или библиотека.

**Где в курсе:** [07-objects.md](07-objects.md).

---

### 12. Цепочка прототипов?

**Ответ.** У объекта есть скрытая ссылка `[[Prototype]]`. Поиск свойства: объект → прототип → … → `null`. Методы массивов живут на `Array.prototype`.

**Где в курсе:** [20-prototypes.md](20-prototypes.md).

---

### 13. `class` vs конструктор?

**Ответ.** `class` — синтаксический сахар над прототипами: методы на `ClassName.prototype`, `extends` настраивает цепочку. Поведение `new` и `instanceof` то же семейство.

**Где в курсе:** [20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md).

---

### 14. Что делает `new`?

**Ответ.** (1) Создать объект с `[[Prototype]] = Fn.prototype`. (2) Вызвать `Fn` с `this` = этот объект. (3) Если `Fn` не вернул объект — вернуть созданный.

**Где в курсе:** [20-prototypes.md](20-prototypes.md).

---

### 15. `hasOwnProperty` vs `in`?

**Ответ.** `in` — свойство **где угодно** в цепочке. `Object.hasOwn(obj, key)` — только **собственное**. Для перечисления «своих» полей — `hasOwn`, не `for...in` без проверки.

**Где в курсе:** [07-objects.md](07-objects.md), [20-prototypes.md](20-prototypes.md).

---

## Блок 4. Асинхронность

### 16. Порядок: sync, `Promise.then`, `setTimeout(0)`?

**Ответ.** Синхронный код → **все microtasks** (Promise) → **одна macrotask** (setTimeout). Классика: `1, 4, 3, 2`.

**Где в курсе:** [24-event-loop.md](24-event-loop.md).

---

### 17. Microtask vs macrotask?

**Ответ.** Micro: `Promise.then`, `queueMicrotask`. Macro: `setTimeout`, I/O callbacks Node, `setImmediate`. Microtasks выполняются **пакетом** после текущего стека, до следующей macro.

**Где в курсе:** [24-event-loop.md](24-event-loop.md).

---

### 18. `Promise.all` vs `allSettled` vs `race`?

**Ответ.**

- `all` — все успешны или первая ошибка отменяет смысл «все»;
- `allSettled` — всегда массив `{ status, value|reason }` — отчёты, bulk;
- `race` — первый settled (успех или ошибка).

**Где в курсе:** [26-promises.md](26-promises.md).

---

### 19. Пять `fetch` параллельно?

**Ответ.**

```javascript
const results = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));
```

Без `Promise.all` — массив Promise, не результатов.

**Где в курсе:** [27-async-await.md](27-async-await.md), [29-fetch.md](29-fetch.md).

---

### 20. Reject ли `fetch` на 500?

**Ответ.** **Нет.** Reject только на сетевой сбой. HTTP 4xx/5xx — `response.ok === false`. Проверяйте вручную.

**Где в курсе:** [29-fetch.md](29-fetch.md).

---

### 21. Зачем `AbortController`?

**Ответ.** Отмена запроса (таймаут, уход пользователя со страницы, смена фильтра). `fetch(url, { signal: controller.signal })`, `controller.abort()`.

**Где в курсе:** [29-fetch.md](29-fetch.md).

---

## Блок 5. Модули и runtime

### 22. ESM vs CommonJS?

**Ответ.** ESM: `import`/`export`, статический анализ, async загрузка, `"type":"module"`. CJS: `require`, sync, `module.exports`. В одном проекте — предпочтительно один стиль.

**Где в курсе:** [30-es-modules.md](30-es-modules.md).

---

### 23. Event loop в одном предложении?

**Ответ.** Однопоточный цикл: выполнить синхронный код до конца стека, опустошить microtasks, взять одну macrotask, повторить.

**Где в курсе:** [24-event-loop.md](24-event-loop.md).

---

### 24. Однопоточен ли JavaScript?

**Ответ.** **Ваш JS-код** в одном потоке. Параллельность — I/O в других потоках ОС/libuv, Web Workers, worker_threads. Два `await fetch` «параллельны» по ожиданию сети, не по CPU.

**Где в курсе:** [24-event-loop.md](24-event-loop.md).

---

## Блок 6. Практика

### 25. Фильтр без мутации?

**Ответ.** `items.filter(predicate)` или `items.filter(...).map(...)` — новый массив. Не `splice` на исходном, если он shared state.

**Где в курсе:** [08-arrays.md](08-arrays.md).

---

### 26. Debounce словами?

**Ответ.** Closure хранит `timerId`. При новом вызове — `clearTimeout`, новый `setTimeout` на `fn` через `ms`. Функция выполнится **после паузы** в вводе (поиск, resize).

**Где в курсе:** [12-closures.md](12-closures.md), [13-lab-closures.md](13-lab-closures.md).

---

### 27. `map` + async без `Promise.all`?

**Ответ.** `map` вернёт массив **Promise**, не данных. `await` на массиве Promise без `all` — бесполезен. Нужно `await Promise.all(arr.map(async ...))`.

**Где в курсе:** [27-async-await.md](27-async-await.md).

---

### 28. JSON.parse без throw?

**Ответ.** `try/catch` или Result-объект `{ ok, value|error }` — [32-error-handling.md](32-error-handling.md).

---

### 29. Map vs Object для кэша?

**Ответ.** Map: любые ключи (объекты), частые add/delete, `.size`, порядок вставки. Object: JSON, литералы конфига. Кэш по object key — Map.

**Где в курсе:** [34-map-set.md](34-map-set.md).

---

### 30. Optional chaining?

**Ответ.** `a?.b?.c` — если `a` или `b` nullish, выражение `undefined`, без TypeError. `fn?.()` — безопасный вызов.

**Где в курсе:** [19-optional-nullish.md](19-optional-nullish.md).

---

## Блок 7. Системное

### 31. JS кроме браузера?

**Ответ.** Node (API, CLI, tooling), serverless, Electron, React Native, embedded scripting. Один язык — разные runtime API.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 32. CORS — кто блокирует?

**Ответ.** **Браузер**, политика same-origin. Node/curl/postman — не блокируют. Сервер должен отдать заголовки `Access-Control-*`.

**Где в курсе:** [29-fetch.md](29-fetch.md).

---

### 33. Дебаг Node?

**Ответ.** `node --inspect-brk script.js`, Chrome `chrome://inspect`, `debugger`, `console` с объектами, логирование стека `err.stack`.

**Где в курсе:** [36-debugging.md](36-debugging.md).

---

### 34. unhandledRejection?

**Ответ.** Promise rejected без `.catch` / `try await`. В Node может завершить процесс. Ловите на верхнем уровне: `main().catch(...)` и `process.on("unhandledRejection")`.

**Где в курсе:** [26-promises.md](26-promises.md), [32-error-handling.md](32-error-handling.md).

---

### 35. После basic — TypeScript или Node?

**Ответ (пример).** Оба нужны; порядок зависит от цели:

- **Frontend / fullstack UI** → сначала **TypeScript** (типы поверх JS), параллельно **fetch** к `:8090`, затем React.
- **Backend BFF** → **nodejs-basic** сразу после basic (event loop, HTTP), TypeScript на второй неделе.

Аргумент: basic даёт runtime-модель; TS ловит ошибки на этапе компиляции; Node даёт сервер и интеграцию с mock-exams backend.

**Где в курсе:** [javascript-path.md](../javascript-path.md).

---

## Резюме

Сильный кандидат **объясняет механизм**, приводит **контрпример** (`0 ||` vs `0 ??`) и связывает с **prod** (потеря `this`, `fetch` + 500, shallow copy config). Пройдите все 35 вслух за 2–3 сессии.

---

## Чек-лист перед capstone

- [ ] 5+ вопросов ответили без подглядывания
- [ ] Можете нарисовать event loop на доске
- [ ] Можете объяснить closure на примере счётчика
- [ ] Знаете, почему `fetch` + 404 не throw

Следующий шаг: [39-capstone.md](39-capstone.md).
