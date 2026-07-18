# 01. Ландшафт: JavaScript, ECMAScript, браузер и Node

## Введение: сценарий с работы

Утро понедельника. В Jira тикет: «Починить баг в checkout — легаси на ES5, не трогать остальное». В merge request коллега добавил `user?.address?.city` — reviewer пишет: «optional chaining не поддерживается в нашем WebView на Android 7». На созвоне product спрашивает: «Можем переписать админку на Node, раз explore оставить в React?» Это один язык или два? В параллельном чате HR присылает вакансию: «Нужен JavaScript, ES6+, TypeScript желательно» — и вы не уверены, чем **JavaScript** отличается от **ECMAScript**, от **TypeScript** и от «просто React».

Без карты ландшафта каждый такой разговор превращается в угадайку. Вы путаете **спецификацию языка**, **реализацию в движке**, **среду выполнения** (браузер vs Node) и **фреймворк** (React). В Python-треке mock-exams вы уже различали WSGI и ASGI ([`fastapi/01-landscape`](../fastapi/01-landscape.md)); здесь — тот же уровень абстракции, только для JS.

Ещё один реальный эпизод: джун запускает `setTimeout(() => console.log("done"), 0)` сразу после `console.log("start")` и удивляется, что порядок `start`, `done`, а не наоборот. «Разве ноль миллисекунд — это не сразу?» — спрашивает он. Ответ лежит в **event loop** и однопоточной модели — фундамент, без которого Promises и `async/await` (уроки 24–27) кажутся магией.

Эта глава — **карта местности** перед синтаксисом. Вы не должны заучивать таблицу версий ES2024 наизусть; вы должны уметь за минуту объяснить, где выполняется код, кто его парсит и почему `"5" + 1` ведёт себя иначе, чем `"5" - 1`.

## Что вы узнаете

- Разницу между **ECMAScript** (стандарт) и **JavaScript** (реализация).
- Как устроена цепочка: исходник → парсер → **движок** → **среда** (браузер / Node).
- Почему JavaScript **однопоточный** для вашего кода и что такое **event loop** (обзор).
- **Динамическую** и **слабую** типизацию — откуда берутся классические баги сравнения.
- Мультипарадигменность: императивный, функциональный, ОО, асинхронный стиль в одном языке.
- Место курса в экосистеме mock-exams: shop-домен, FastAPI `:8090`, путь к React и Node.

## JavaScript и ECMAScript: стандарт vs язык в голове

**ECMAScript (ES)** — документ, который описывает синтаксис, типы, встроенные объекты (`Array`, `Promise`, …). Его ведёт комитет **TC39**; номер стандарта — **ECMA-262**. **JavaScript** — самая известная **реализация** этой спецификации. На собеседовании короткий ответ: «JavaScript — язык; ECMAScript — спецификация, которой он следует (с небольшими расхождениями исторически)».

С 2015 года TC39 выпускает **ежегодные** обновления. Их называют ES2015, ES2016, … ES2024. Разговорное **ES6** = **ES2015** — переломный год: `let`/`const`, классы, стрелочные функции, modules.

| Версия | Год | Что принесла (выгибко, не исчерпывающе) |
|--------|-----|----------------------------------------|
| ES5 | 2009 | `strict mode`, `JSON`, методы массивов `forEach`/`map` |
| ES2015 (ES6) | 2015 | `let`/`const`, классы, стрелки, `import`/`export` |
| ES2020 | 2020 | `?.`, `??`, `BigInt`, `Promise.allSettled` |
| ES2022 | 2022 | top-level `await` в modules, `#private` в классах |
| ES2023 | 2023 | `toSorted`, `toReversed` — немutating методы массивов |

**Важно:** браузеры и Node **не обновляются синхронно**. Chrome 120 и Node 22 поддерживают разные подмножества «последнего ES». Перед продакшеном проверяют [caniuse.com](https://caniuse.com) (браузер) и [node.green](https://node.green) (Node). В mock-exams учебный стенд FastAPI не диктует версию JS — но **legacy WebView** в мобильном приложении может диктовать вам ES5 и Babel.

**TypeScript** не заменяет JavaScript: TS **компилируется** в JS. Это надстройка со статическими типами — курс [`typescript-basic`](../javascript-path.md) после этого.

## От исходника до выполнения

```text
Исходный код (.js / .ts после компиляции)
        │
        ▼
   Парсер (syntax → AST)
        │
        ▼
   Компилятор / JIT (V8, SpiderMonkey, …)
        │
        ▼
   Движок выполняет байткод / машинный код
        │
        ├── Браузер: DOM, fetch, Web APIs, event loop UI
        └── Node.js: fs, http, process, тот же V8 + libuv
```

| Среда | Движок | Типичное применение |
|-------|--------|---------------------|
| Chrome, Edge | V8 | SPA, DevTools |
| Firefox | SpiderMonkey | веб-приложения |
| Safari | JavaScriptCore | iOS/macOS web |
| Node.js | V8 + libuv | API, CLI, tooling, CI |
| Deno, Bun | V8 (+ свои API) | альтернативы Node |

Один и тот же синтаксис `const price = 79.99` выполняется везде; **глобальные объекты** разные. В браузере есть `document`; в Node — `process` и `node:fs`. Урок [00-environment.md](00-environment.md) уже показал таблицу отличий.

```javascript
// Одинаково в Node (модуль) и современном браузере
const shopApiBase = "http://localhost:8090/api/v1";
console.log(typeof shopApiBase); // "string"
```

## Однопоточность и event loop (обзор)

JavaScript **не создаёт поток на каждый запрос**, как sync worker в gunicorn. В одном потоке выполняется **ваш синхронный** код. Операции ввода-вывода (сеть, таймер, диск в Node) **делегируются** окружению (libuv в Node, браузерным API). Когда I/O готов, **колбэк** попадает в очередь; event loop подставляет его, когда стек вызовов пуст.

Классическая демонстрация:

```javascript
console.log("1 — синхронно");
setTimeout(() => console.log("2 — из очереди макрозадач"), 0);
console.log("3 — синхронно");

// Вывод:
// 1 — синхронно
// 3 — синхронно
// 2 — из очереди макрозадач
```

`setTimeout(..., 0)` **не** означает «выполнить немедленно». Это «выполнить **не раньше**, чем текущий синхронный код и уже стоящие в очереди задачи завершатся». Подробная модель (microtasks, `Promise.then`, `async/await`) — [24-event-loop.md](24-event-loop.md). Сравнение с asyncio в Python — [`python-async`](../python-async/README.md).

Для backend-разработчика аналогия: один **uvicorn worker** с event loop vs пул sync workers. JS «async by default» в экосистеме Node — но **ваш** CPU-bound цикл `for` всё равно блокирует поток, пока не отдадите работу в worker thread или очередь.

## Динамическая и слабая типизация

**Динамическая типизация:** тип привязан к **значению**, не к имени переменной. Переменная может ссылаться на разные типы в разное время:

```javascript
let payload = 42;        // number — например, id товара
payload = "42";          // string — так пришло из query string
payload = { id: 42 };    // object — так вернул FastAPI /items/42
// Все три присваивания легальны. В TypeScript это было бы ошибкой компиляции.
```

**Слабая (weak) типизация:** движок **приводит** типы в операциях, часто неявно:

```javascript
"5" + 1;   // "51" — если есть string, + склонен к конкатенации
"5" - 1;   // 4 — минус требует number, "5" → 5
"5" * 2;   // 10
true + 1;  // 2 — boolean → number
```

Отсюда баги в формах («склеились» цена и количество) и в сравнениях (`==` vs `===`) — полный разбор в [05-coercion-comparison.md](05-coercion-comparison.md) и [04-primitives.md](04-primitives.md). Статические типы в [`typescript-basic`](../javascript-path.md) ловят многие такие ошибки **до** запуска.

## Мультипарадигменность: один язык — разные стили

JavaScript не заставляет выбрать «только ООП» или «только функциональное». На практике код **смешивает** парадигмы:

**Императивный** — пошаговые инструкции, циклы `for`, мутация переменных:

```javascript
let total = 0;
for (const price of [79.99, 29.99, 199.0]) {
  total += price;
}
```

**Функциональный** — функции как значения, `map`/`filter`, избегание мутаций (особенно в React):

```javascript
const prices = [79.99, 29.99, 199.0];
const withTax = prices.map((p) => Math.round(p * 1.2 * 100) / 100);
```

**Объектно-ориентированный** — объекты, прототипы, классы ES6 ([20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md)):

```javascript
class CartItem {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }
}
```

**Асинхронный** — колбэки, Promises, `async/await` для I/O к API shop:

```javascript
// Обзор; синтаксис — уроки 25–27
// const res = await fetch(`${shopApiBase}/items`);
// const data = await res.json();
```

На собеседовании редко спрашивают «к какой парадигме относится JS». Чаще — «как вы организуете async без callback hell» или «почему не мутируете state в React».

## Экосистема: где этот курс в стеке

| Слой | Примеры | Курс mock-exams |
|------|---------|-----------------|
| Язык ES2020+ | типы, функции, async | **javascript-basic** (вы здесь) |
| Статические типы | TypeScript, Zod | typescript-basic |
| Runtime сервер | Node.js, Fastify | nodejs-basic |
| UI | React, Vite | react-basic |
| Сборка | Vite, webpack | react-basic / nodejs |
| Тесты | Vitest, Playwright | javascript-testing |
| Backend API | FastAPI, Django | fastapi, django |

**Сейчас — ни один фреймворк.** Только язык. Так проще понять, что React делает с массивами и closures «под капотом», и не путать проблему языка с проблемой библиотеки.

## Версии языка на практике: что писать в резюме и в `package.json`

Когда в вакансии «ES6+», имеют в виду: вы знаете `let`/`const`, стрелки, classes, modules, destructuring, async/await — не что вы застряли в 2015. Когда «современный JS (ES2020)» — ждут optional chaining, nullish coalescing, `BigInt`, `globalThis`.

В **новом** коде mock-exams (Node 20+, Vite, Vitest) можно опираться на ES2020–2023 без Babel. Для **legacy** WebView или старых corporate browsers — transpile (esbuild, Babel) или polyfills — тема react/nodejs, не этой главы.

Проверка перед merge:

```bash
node --version          # LTS в CI и локально
# node.green — для конкретной фичи, например top-level await
```

Не путайте **версию Node** (runtime) и **версию ECMAScript** (язык). Node 18 поддерживает большой набор ES2022; Node 22 — ещё больше. Языковая фича может быть в спецификации, но **выключена** флагом или **отсутствовать** в вашей версии Node — всегда smoke-test.

## Связь с mock-exams: shop-домен и :8090

Backend-трек отдаёт JSON по HTTP. Типичный фрагмент ответа FastAPI стенда (упрощённо):

```json
{
  "items": [
    { "id": 1, "title": "Keyboard", "price": 79.99 }
  ],
  "total": 1
}
```

Frontend или BFF на JavaScript **потребляет** те же контракты — см. [`api-design`](../api-design/README.md). Этот курс даёт:

- работу с **JSON** как с объектами и массивами ([07-objects.md](07-objects.md), [08-arrays.md](08-arrays.md));
- **`fetch`** и разбор статусов ([29-fetch.md](29-fetch.md));
- **обработку ошибок** при парсинге ([32-error-handling.md](32-error-handling.md)).

Стенд [`deploy/fastapi`](../../deploy/fastapi/README.md) на порту **8090** подключим в nodejs/react; на этапе javascript-basic достаточно знать, что «где-то есть REST API shop», и моделировать данные локально в лабе [09-lab-objects-arrays.md](09-lab-objects-arrays.md).

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [00. Окружение](00-environment.md) | Node как среда для первых скриптов |
| [02. Переменные](02-variables-strict.md) | `let`/`const` из ES2015 |
| [05. Coercion](05-coercion-comparison.md) | следствие слабой типизации |
| [24. Event loop](24-event-loop.md) | углубление однопоточной модели |
| [29. fetch](29-fetch.md) | HTTP к `:8090` |
| [`fastapi/01-landscape`](../fastapi/01-landscape.md) | параллель: карта backend-стека |

## Типичные ошибки в понимании

**«JavaScript = только фронтенд».** Node powers CLI, serverless, CI scripts, webpack, Prisma migrations. В mock-exams Node — BFF между React и FastAPI.

**«ES6 устарел».** ES6 — **база** современного синтax; дальше идут ES2017, ES2020… «Знать ES6+» значит «знать современный JS», не «застрять в 2015».

**«TypeScript заменяет JavaScript».** TS transpile → JS. Браузер и Node выполняют JS. TS ловит ошибки раньше — не меняет семантику `==` и event loop.

**«async/await делает код многопоточным».** Нет — не блокируете **ожидание** I/O, но один поток JS остаётся. CPU-bound без `worker_threads` блокирует всё.

**«Caniuse зелёный — можно в прод».** Проверьте **минимальную** версию клиентов и Node в CI, не только последний Chrome.

## Резюме

JavaScript — реализация стандарта **ECMAScript**, выполняемая **движком** (чаще V8) в **среде** (браузер или Node). Язык однопоточный для вашего кода; I/O и таймеры идут через **event loop**. Динамическая и слабая типизация объясняют часть «странного» поведения — к ним вернёмся в блоке типов. Этот курс — фундамент без фреймворков; дальше TypeScript, Node BFF к FastAPI `:8090` и React для shop UI.

## Чек-лист

- [ ] Объясните разницу **ECMAScript** и **JavaScript** одним предложением
- [ ] Назовите **движок** Chrome и **runtime** Node.js
- [ ] Предскажите порядок вывода для `console.log` + `setTimeout(..., 0)` + `console.log`
- [ ] Что значит «динамическая типизация» на примере `let x = 1; x = "a"`
- [ ] Почему `"5" + 1` и `"5" - 1` дают разный результат
- [ ] Где в mock-exams живёт shop API и какой порт у FastAPI стенда

Следующий урок: [02. Переменные и strict mode](02-variables-strict.md).
