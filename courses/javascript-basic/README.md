# JavaScript — Basic

Мега-подробный курс **чистого JavaScript** без фреймворков: типы, scope, closures, `this`, прототипы, Promises, `async/await`, ES modules, `fetch`, обработка ошибок. **40 уроков** + capstone + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). Дальше — [`typescript-basic`](../typescript-basic/README.md), [`nodejs-basic`](../nodejs-basic/README.md), [`react-basic`](../react-basic/README.md).

**Предварительно:** базовый терминал ([`linux-basic`](../linux-basic/README.md) главы 02–03). HTTP на уровне «что такое GET/POST» — полезно [`api-design`](../api-design/README.md) глава 01.

**Локально:** Node.js **LTS** (20 или 22) на хосте. Код лаб — каталог [`examples/`](examples/package.json).

```bash
cd courses/javascript-basic/examples
node --version          # v20.x или v22.x
node 01-hello.js        # первый запуск
```

Опционально: [nvm](https://github.com/nvm-sh/nvm) (Linux/macOS) или [nvm-windows](https://github.com/coreybutler/nvm-windows) для переключения версий Node.

Браузер (Chrome/Firefox) — для уроков про DevTools и `fetch` к публичным API. Backend-стенды mock-exams **не обязательны** на этом этапе; позже `fetch` свяжется с [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`.

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка и не одностраничная памятка. Читайте последовательно: автор ведёт от **рабочего сценария** (тикет, code review, баг в prod) к концепциям, коду и типичным ошибкам — как в технической книге с narrative, а не как в справочнике API.

1. **Теория** (01, 02, 04, 30…) — «Сценарий с работы» → объяснение → примеры кода → «Типичные ошибки» → «Чек-лист». Закрепляйте чек-лист **своими словами** до перехода к лабе.
2. **Лаба** (03, 06, 31…) — hands-on в [`examples/`](examples/package.json): `node lab/….js`, критерии успеха, таблица «если что-то пошло не так». Лаба **продолжает сюжет** теории, а не дублирует её списком API.
3. После блока 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [39-capstone.md](39-capstone.md) — **4–6 часов**, CLI-утилита «Task Tracker»; собирает модули, ошибки, коллекции из глав 30–37.

**Время:** закладывайте **~50–70 минут** на каждую пару «теория + лаба» (чтение, эксперименты в REPL, лаба до критериев). Весь курс — **~14–18 часов**; capstone отдельно.

## Программа (40 уроков)

### Фаза 1. Среда и первые программы (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: Node.js, REPL, редактор](00-environment.md) |
| 01 | [Ландшафт: JS, ECMAScript, браузер и Node](01-landscape.md) |
| 02 | [Переменные, `let`/`const`, strict mode](02-variables-strict.md) |
| 03 | [Лаба: первые скрипты](03-lab-first-scripts.md) |

### Фаза 2. Типы и структуры данных (04–09)

| 04 | [Примитивные типы](04-primitives.md) |
| 05 | [Приведение типов и сравнение](05-coercion-comparison.md) |
| 06 | [Лаба: типы и сравнение](06-lab-types.md) |
| 07 | [Объекты: свойства, ссылки, копирование](07-objects.md) |
| 08 | [Массивы и методы высокого порядка](08-arrays.md) |
| 09 | [Лаба: объекты и массивы](09-lab-objects-arrays.md) |

### Фаза 3. Функции, scope, `this` (10–15)

| 10 | [Функции: declaration, expression, arrow](10-functions.md) |
| 11 | [Scope, hoisting, TDZ](11-scope-hoisting.md) |
| 12 | [Замыкания (closures)](12-closures.md) |
| 13 | [Лаба: closures и модули в функциях](13-lab-closures.md) |
| 14 | [`this`, call, apply, bind](14-this.md) |
| 15 | [Лаба: контекст `this`](15-lab-this.md) |

### Фаза 4. Управление потоком и современный синтаксис (16–19)

| 16 | [Условия, циклы, `switch`](16-control-flow.md) |
| 17 | [Деструктуризация, spread, rest](17-destructuring-spread.md) |
| 18 | [Лаба: современный синтаксис](18-lab-modern-syntax.md) |
| 19 | [Optional chaining, nullish coalescing](19-optional-nullish.md) |

### Фаза 5. Прототипы и классы (20–23)

| 20 | [Прототипы и цепочка `[[Prototype]]`](20-prototypes.md) |
| 21 | [Классы ES6](21-classes.md) |
| 22 | [Лаба: модель предметной области](22-lab-oop.md) |
| 23 | [Итераторы, `for...of`, генераторы](23-iterators-generators.md) |

### Фаза 6. Асинхронность (24–29)

| 24 | [Event loop: браузер и Node](24-event-loop.md) |
| 25 | [Колбэки и callback hell](25-callbacks.md) |
| 26 | [Promises: then, catch, finally](26-promises.md) |
| 27 | [`async`/`await`](27-async-await.md) |
| 28 | [Лаба: асинхронные цепочки](28-lab-async.md) |
| 29 | [`fetch` и работа с HTTP](29-fetch.md) |

### Фаза 7. Модули и ошибки (30–33)

| 30 | [ES modules: import/export](30-es-modules.md) |
| 31 | [Лаба: разбиение на модули](31-lab-modules.md) |
| 32 | [Обработка ошибок: try/catch, throw](32-error-handling.md) |
| 33 | [Лаба: надёжные функции](33-lab-errors.md) |

### Фаза 8. Коллекции, regex, отладка (34–37)

| 34 | [Map, Set, WeakMap, WeakSet](34-map-set.md) |
| 35 | [RegExp, JSON, Date, Math](35-regex-json-date.md) |
| 36 | [Отладка: console, DevTools, breakpoints](36-debugging.md) |
| 37 | [Лаба: коллекции и парсинг](37-lab-collections.md) |

### Фаза 9. Финал (38–39)

| 38 | [Interview Q&A (топ-35)](38-interview-qa.md) |
| 39 | [Capstone: Task Tracker CLI](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Пишете **читаемый** JS на ES2020+: `const`/`let`, стрелочные функции, деструктуризация, modules.
- Объясняете **приведение типов**, `===` vs `==`, почему `0.1 + 0.2 !== 0.3`.
- Строите **замыкания** (счётчики, фабрики, приватное состояние) без магии.
- Различаете **`this`** в method / arrow / `bind` / class.
- Понимаете **прототипы** и когда класс — синтаксический сахар.
- Читаете и пишете **Promise**-цепочки и **`async/await`**; знаете порядок microtasks.
- Делаете **`fetch`** к REST API, обрабатываете статусы и JSON.
- Разбиваете код на **ES modules**, ловите ошибки осмысленно.
- Отлаживаете скрипты в **Node** и **DevTools**.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`typescript-basic`](../typescript-basic/README.md) | типы поверх этого курса |
| [`nodejs-basic`](../javascript-path.md) | event loop углублённо, HTTP-сервер |
| [`react-basic`](../react-basic/README.md) | компоненты, hooks, state |
| [`fastapi`](../../deploy/fastapi/README.md) | `fetch` к `:8090` в nodejs/react |
| [`api-design`](../api-design/README.md) | REST, статусы, ошибки API |
| [`javascript-testing`](../javascript-path.md) | Vitest после nodejs/react |
| [`browser-platform`](../javascript-path.md) | CORS, storage, rendering |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | `"type": "module"`, скрипты лаб |
| [`examples/lab/`](examples/lab/) | стартовые файлы для лаб |
| [`examples/solutions/`](examples/solutions/) | эталонные решения (смотреть после попытки) |
