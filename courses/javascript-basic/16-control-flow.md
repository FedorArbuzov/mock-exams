# 16. Условия, циклы, `switch`

## Введение: «обработали заказ дважды»

Скрипт синхронизации заказов с FastAPI ([deploy/fastapi](../../deploy/fastapi/README.md)) обходит очередь в `while` и внутри вызывает `process(order)` без `break` после успеха. При сбое сети заказ возвращается в очередь, но флаг `processed` не проверяется — ветка `switch (status)` без `break` «проваливается» в `case "cancelled"` и отменяет уже оплаченный заказ. В другом файле джун использует `for…in` по массиву ID и получает индексы `"0"`, `"1"` плюс лишние ключи из прототипа. **Управление потоком** в JS — не только синтаксис: от выбора `for…of` vs `map`, от явных проверок `===` vs truthy, от `break` в `switch` зависят деньги и целостность данных. Эта глава — мост между типами ([04](04-primitives.md)–[05](05-coercion-comparison.md)) и асинхронными циклами ([27](27-async-await.md)).

## Что вы узнаете

- `if` / `else`, тернарный оператор и читаемость.
- **Truthy / falsy** и когда нужны явные сравнения.
- `switch`, **fall-through** и объект-маппинг вместо длинных веток.
- Циклы: `for`, `for…of`, `for…in`, `while`, `do…while`.
- `break`, `continue`, метки (и почему их избегают).
- `await` в цикле: последовательно vs параллельно.
- Выбор между циклом и методами массива ([08](08-arrays.md)).

## Условия: `if` и `else`

```javascript
function gradeFromScore(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "F";
  }
}
```

**Почему ранний return:** меньше вложенности, проще читать guard clauses:

```javascript
function processOrder(order) {
  if (!order) return;
  if (order.status === "cancelled") return;
  if (!order.items.length) return;
  // основная логика на одном уровне
}
```

### Тернарный оператор

```javascript
const label = isActive ? "ON" : "OFF";
const price = hasDiscount ? base * 0.9 : base;
```

**Правило:** не вкладывайте тернарники глубже одного уровня — используйте `if` или отдельную функцию.

```javascript
// Плохо
const x = a ? b ? c : d : e;

// Лучше
function pick() {
  if (!a) return e;
  return b ? c : d;
}
```

## Truthy, falsy и явные проверки

Falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.

```javascript
if (items.length) {
  renderList(items);
}

if (user?.id) {
  loadProfile(user.id);
}
```

**Почему `length` ок:** `0` — пустой список, условие ложно — ожидаемо.

Опасные случаи:

```javascript
if (port) { /* 3000 пропустит — 0 falsy */ }
if (name) { /* "" — гостевое имя потеряется */ }
```

Для API и конфигов — явно:

```javascript
if (response.status === 404) { /* ... */ }
if (value === null || value === undefined) { /* ... */ }
if (config.port != null) { /* 0 допустим */ }
```

См. `??` в [19](19-optional-nullish.md).

## `switch`: сравнение через `===`

```javascript
function handleCommand(command) {
  switch (command) {
    case "start":
      startWorker();
      break;
    case "stop":
      stopWorker();
      break;
    case "pause":
      pauseWorker();
      break;
    default:
      console.warn("unknown command:", command);
  }
}
```

`switch` использует **строгое** равенство `===` без приведения типов (кроме особого случая `switch` с выражениями — редко).

### Fall-through

```javascript
switch (tier) {
  case "gold":
  case "silver":
    applyDiscount(0.15);
    break;
  case "bronze":
    applyDiscount(0.05);
    break;
  default:
    applyDiscount(0);
}
```

Без `break` выполнение **проваливается** в следующий `case`. Иногда намеренно (как выше), всегда **комментируйте** или изолируйте блок.

**Типичный баг:**

```javascript
switch (action) {
  case "save":
    save();
  case "delete":  // save провалится сюда!
    delete();
    break;
}
```

### Объект-маппинг вместо длинного `switch`

```javascript
const handlers = {
  start: startWorker,
  stop: stopWorker,
  pause: pauseWorker,
};

function dispatch(command) {
  const fn = handlers[command];
  if (fn) {
    fn();
  } else {
    console.warn("unknown command:", command);
  }
}
```

**Почему удобнее:** таблица данных, легко тестировать, нет fall-through. Для TypeScript — `satisfies Record<Command, Handler>`.

## Цикл `for`: классический счётчик

```javascript
for (let i = 0; i < items.length; i++) {
  console.log(i, items[i]);
}
```

Используйте `let` — отдельный binding на итерацию при вложенных колбэках ([11](11-scope-hoisting.md)).

## `for…of`: значения итерируемого

```javascript
for (const item of items) {
  console.log(item.name);
}

for (const [index, item] of items.entries()) {
  console.log(index, item);
}
```

Работает с массивами, строками, Map, Set, NodeList — всё с `Symbol.iterator` ([23](23-iterators-generators.md)).

**Почему предпочтительнее индекса:** меньше off-by-one, не нужен доступ к `length` вручную.

## `for…in`: перечисляемые ключи объекта

```javascript
const config = { host: "localhost", port: 3000 };
for (const key in config) {
  console.log(key, config[key]);
}
```

**Не используйте `for…in` по массивам:**

```javascript
const ids = [10, 20, 30];
for (const k in ids) {
  console.log(k, typeof k); // "0" "string", "1" "string"…
}
```

Причины:

- ключи — строки;
- могут появиться унаследованные enumerable свойства;
- порядок не гарантирован как у `for…of` для массивов в старых двигателях.

## `while` и `do…while`

```javascript
while (queue.length > 0) {
  const job = queue.shift();
  process(job);
}
```

```javascript
let input;
do {
  input = readLine();
} while (input && !input.valid);
```

**Когда `while`:** неизвестное число итераций (очередь, поток, ожидание условия).

**`do…while`:** минимум одна итерация — меню CLI, повтор запроса до валидного ввода.

## `break` и `continue`

```javascript
for (const user of users) {
  if (!user.active) continue;
  if (user.banned) break;
  notify(user);
}
```

`continue` — следующая итерация; `break` — выход из цикла.

Метки (`outer: for`) — редко; лучше вынести во внутреннюю функцию с `return`.

## Пошагово: `await` в цикле

```javascript
async function syncAll(urls) {
  for (const url of urls) {
    const res = await fetch(url);
    await save(await res.json());
  }
}
```

1. Итерация 1: fetch → ждём → save → ждём.
2. Итерация 2: только после завершения 1.

**Последовательно** — меньше нагрузка на API, проще лимиты rate.

Параллельно:

```javascript
await Promise.all(urls.map((url) => fetchAndSave(url)));
```

**Почему не `await urls.map(async …)` без `all`:** получите массив Promise, не дождётесь завершения всех. Подробнее — [27](27-async-await.md).

### Ошибки в цикле

```javascript
for (const url of urls) {
  try {
    await fetch(url);
  } catch (e) {
    console.error(url, e.message);
    // continue или break — по бизнес-правилу
  }
}
```

Один упавший URL не обязан ронять весь batch — явная политика.

## Цикл vs методы массива

| Задача | Инструмент | Почему |
|--------|------------|--------|
| Трансформация списка | `map` | Возвращает новый массив |
| Фильтр | `filter` | Декларативно |
| Поиск | `find` / `some` / `every` | Ранний выход внутри движка |
| Сумма / агрегат | `reduce` | Один проход |
| Побочный эффект по элементам | `for…of` | `await`, `break`, читаемость |
| Ранний выход по условию | `for` + `break` | `map` не прервать |
| Много веток по строке | map handlers или `switch` | Без fall-through багов |

```javascript
const totals = orders
  .filter((o) => o.paid)
  .map((o) => o.total)
  .reduce((sum, t) => sum + t, 0);
```

## Блочный scope в `switch` (ES6+)

```javascript
switch (type) {
  case "a": {
    const detail = loadA();
    use(detail);
    break;
  }
  case "b": {
    const detail = loadB();
    use(detail);
    break;
  }
}
```

`const` в case без `{}` — SyntaxError: все case в одном блоке switch.

## Как это связано с курсом

| Урок | Связь |
|------|------|
| [05. Coercion](05-coercion-comparison.md) | Truthy, `===` в switch |
| [08. Массивы](08-arrays.md) | map/filter/for…of |
| [11. Scope](11-scope-hoisting.md) | `let` в for |
| [17. Spread](17-destructuring-spread.md) | Деструктуризация в for…of |
| [19. `??`](19-optional-nullish.md) | Дефолты в условиях |
| [27. async/await](27-async-await.md) | Циклы с await |
| [32. Ошибки](32-error-handling.md) | try/catch в циклах |

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `for…in` по массиву | Ключи, не элементы | `for…of` |
| Забытый `break` в switch | Fall-through | `break` или комментарий intentional |
| `if (port)` отсекает 0 | 0 falsy | `port != null` или `??` |
| `await` в `map` без `Promise.all` | Не ждёт | `Promise.all` |
| Бесконечный `while (true)` без break | Нет выхода | Условие или return |
| Мутация массива в `for…of` + `splice` | Сдвиг индексов | Обратный for или filter |

## В продакшене

- **Идемпотентность** в обработчиках очередей — `switch` по статусу с явным `break` и логом неизвестных веток.
- **Линтер** `no-fallthrough` для switch.
- Тяжёлые списки — не `for` с `await` на тысячи URL без concurrency limit; используйте пул (nodejs-intermediate).
- Метрики: считайте необработанные `default` в switch.

## Резюме

**`if`** и guard clauses — основа ветвления; тернарник — для простых выражений. **Truthy** удобен, но для `0` и `""` нужны явные проверки. **`switch`** — `===` и опасный fall-through; таблица handlers часто лучше. **`for…of`** для элементов; **`for…in`** — для ключей объекта, не массива. **`await` в цикле** — последовательность; параллель — `Promise.all`. Выбор цикла vs `map`/`filter` — вопрос `break`, `await` и побочных эффектов.

## Чек-лист

- Почему `for…in` по массиву — плохая идея?
- Что такое fall-through в `switch`?
- Когда `while` предпочтительнее `for`?
- Чем отличается `await` в `for…of` от `Promise.all(map)`?
- Какие значения falsy вы перечислите?
- Зачем блок `{}` внутри `case`?

Следующий урок: [17. Деструктуризация, spread, rest](17-destructuring-spread.md).
