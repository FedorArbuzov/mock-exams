# 01. Ландшафт: TypeScript, JavaScript и компиляция

## Введение: сценарий с работы

Спринт-планирование. Product: «Перепишем checkout на TypeScript — меньше багов». Backend на FastAPI `:8090` уже отдаёт OpenAPI; фронт на React с `.tsx`. Джун спрашивает: «TypeScript — это новый язык? Нужен отдельный браузер?» Senior отвечает: «Это JS с проверкой типов на этапе сборки». Через час в Slack: «У меня в рантайме всё равно `undefined is not a function`» — потому что типы **стёрлись** при компиляции, а логическая ошибка осталась.

На code review вы видите `// @ts-ignore` на строке с `price` из API. В [`javascript-basic/04-primitives`](../javascript-basic/04-primitives.md) вы уже ловили `price` как string из формы; TypeScript должен был остановить это **до** merge. Reviewer ссылается на **structural typing**: «Объект с полем `title` подойдёт туда, где ждут `Product` — и это feature, не bug».

Без карты ландшафта путают **язык**, **компилятор**, **типовую систему** и **сборщик** (Vite, esbuild). В Python-треке mock-exams вы различали runtime Python и статические подсказки mypy ([`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md)); здесь — TypeScript compiler и то, что реально выполняет V8.

## Что вы узнаете

- Чем **TypeScript** отличается от **JavaScript** (надстройка, не замена runtime).
- Цепочку **compile pipeline**: `.ts` → AST → проверка типов → emit `.js`.
- Почему типы **исчезают** в runtime и что из этого следует.
- Обзор **structural typing** (утиная типизация) vs nominal в других языках.
- Место курса после [`javascript-basic`](../javascript-basic/README.md) и перед `nodejs-basic`.
- Связь с shop-доменом и контрактами FastAPI **:8090**.

## JavaScript и TypeScript: один runtime, два этапа

**JavaScript** — язык, который выполняет **движок** (V8 в Node и Chrome). **TypeScript** — **надмножество** синтаксиса JS: те же `const`, `async/await`, `fetch`, плюс аннотации типов, `interface`, `enum`, generics.

```typescript
// product.ts — TypeScript
interface Product {
  id: number;
  title: string;
  price: number;
}

const item: Product = {
  id: 1,
  title: "Keyboard",
  price: 79.99,
};
```

После `tsc` в `product.js` останется примерно:

```javascript
const item = {
  id: 1,
  title: "Keyboard",
  price: 79.99,
};
```

**Интерфейс `Product` не существует в runtime.** Нет `instanceof Product`. Проверка — только на этапе компиляции (и в IDE). Аналогия: Pydantic-модель на FastAPI валидирует на входе HTTP; TS валидирует на входе **компилятора** — но не заменяет runtime-валидацию внешних JSON (для этого позже Zod).

| Вопрос | JavaScript | TypeScript |
|--------|------------|------------|
| Кто выполняет код? | Node / браузер | Тот же Node / браузер |
| Где типы? | Динамически в голове и тестах | Статически + emit JS |
| Нужен ли build? | Опционально (esbuild) | Да, `tsc` или bundler с TS |
| Ошибка `price: string` | В runtime при расчёте | TS2322 при `tsc` |

## Pipeline компиляции

```text
Исходники .ts / .tsx
        │
        ▼
   Парсер → AST (общий с JS + TS-узлы)
        │
        ├── Проверка типов (type checker)
        │         │
        │         ├── ошибки → exit code ≠ 0 (CI fail)
        │         └── OK
        ▼
   Emit JavaScript (.js / .mjs)
        │
        ▼
   Node / браузер (V8) — только JS
```

Инструменты на пути:

| Инструмент | Роль |
|------------|------|
| **tsc** | Официальный компилятор; typecheck + emit |
| **esbuild / swc** | Быстрый transpile; типы часто отдельно `tsc --noEmit` |
| **Vite** | Dev server + bundling для react-basic |
| **IDE (TS language service)** | Те же правила, что у `tsc`, в реальном времени |

В mock-exams **nodejs-basic** часто: `tsc` для типов, **tsx** для dev, **esbuild** для prod bundle. На typescript-basic достаточно **`tsc`** из [00-environment.md](00-environment.md).

## Что TypeScript ловит — и что нет

**Ловит (compile-time):**

```typescript
function lineTotal(price: number, qty: number): number {
  return price * qty;
}

lineTotal("79.99", 2); // TS2345: string не number
```

**Не ловит без доп. усилий:**

```typescript
const data = JSON.parse('{"price":"79.99"}') as { price: number };
lineTotal(data.price, 1); // компилируется; в runtime price — string
```

`JSON.parse` возвращает **`any`** или неточный тип — классическая дыра. Backend на `:8090` с Pydantic отдаёт корректные типы в JSON, но **граница сети** всё равно требует валидации (Zod, ручные guards) — темы поздних глав.

**Логические ошибки:**

```typescript
function discount(price: number, percent: number): number {
  return price - percent; // TS доволен; бизнес-логика неверна
}
```

TS не заменяет тесты и code review — дополняет их, как mypy для Python.

## Structural typing (структурная типизация)

TypeScript сравнивает типы **по форме** полей, не по имени класса:

```typescript
type Product = { id: number; title: string; price: number };

function printProduct(p: Product): void {
  console.log(p.title, p.price);
}

const fromApi = {
  id: 42,
  title: "Mouse",
  price: 29.99,
  inStock: true, // лишнее поле — OK при присваивании
};

printProduct(fromApi); // OK — есть нужные поля
```

Объект **с дополнительными** свойствами совместим там, где ожидается **меньший** тип (правило **excess property check** срабатывает при **literal** присваивании, не всегда при переменной — нюанс в [07-interfaces-objects.md](07-interfaces-objects.md)).

Сравнение с **nominal** (Java, C#): там `class USD` и `class EUR` — разные типы даже с одним `number` внутри. В TS без branded types `type UserId = number` и `type OrderId = number` **взаимозаменяемы** — об этом в продвинутых паттернах.

Для интеграции с FastAPI это удобно: ответ API с полями `id`, `title`, `price` **структурно** подходит под ваш `interface Item` без codegen — пока контракт не разъехался.

## Версии и совместимость с ECMAScript

TypeScript **не фиксирует** версию JS — её задаёт `target` в `tsconfig`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

Новые фичи JS (optional chaining, `??`) — сначала в ECMAScript, потом в TS как синтаксис. TS 5.x поддерживает современный JS из [`javascript-basic/01-landscape`](../javascript-basic/01-landscape.md). **Версия Node** в CI должна понимать **emit** (ES2022 на Node 20+ — ок).

## Экосистема mock-exams

```text
javascript-basic  →  typescript-basic  →  nodejs-basic  →  react-basic
       │                    │                  │
       └────────────────────┴──────────────────┴── shop API FastAPI :8090
```

| Слой | Курс | Роль типов |
|------|------|------------|
| Язык JS | javascript-basic | `typeof`, динамика |
| Статика | **typescript-basic** | interfaces, unions, narrowing |
| Сервер | nodejs-basic | typed routes, env, клиент к :8090 |
| UI | react-basic | `.tsx`, props types |

Сейчас — **без React и Express**. Только компилятор, типы и локальные модели shop (товар, статус, каталог).

## TypeScript vs JSDoc vs Zod (обзор)

| Подход | Когда |
|--------|-------|
| **`.ts` аннотации** | новый код, этот курс |
| **JSDoc `@param`** | постепенная миграция `.js` |
| **Zod / Valibot** | runtime parse JSON с :8090 |
| **OpenAPI codegen** | клиент из спеки FastAPI |

Pydantic на backend и TypeScript на BFF — **зеркальная** дисциплина контрактов; расхождение ловят integration-тесты к `:8090`.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [00. Окружение](00-environment.md) | `tsc`, tsconfig |
| [02. Аннотации и inference](02-annotations-inference.md) | первая практика типов |
| [07. Interfaces](07-interfaces-objects.md) | structural typing углублённо |
| [08. Narrowing](08-narrowing.md) | сужение после `JSON.parse` |
| [`javascript-basic/01`](../javascript-basic/01-landscape.md) | JS vs ECMAScript vs TS |
| [`fastapi/01-landscape`](../fastapi/01-landscape.md) | параллель backend-стека |

## Типичные ошибки в понимании

**«TypeScript = безопасный JavaScript».** Безопаснее на этапе разработки; runtime — тот же JS. `as`, `any`, неверный trust к API — дыры.

**«Нужно учить второй язык с нуля».** Синтаксис 95% — ваш JS из javascript-basic; добавились типы и `interface`.

**«tsc оптимизирует код как Rust».** Основная работа — **проверка типов** и **transpile**; минификация — bundler.

**«Интерфейс существует в runtime».** Нет — только в dev и `.d.ts` для библиотек.

**«Structural typing = любой объект всегда OK».** Excess property checks, exactOptionalPropertyTypes — ограничения есть.

**«Можно пропустить TS и сразу React».** В ветке mock-exams react-basic предполагает typescript-basic.

## Резюме

TypeScript — **надстройка над JavaScript**: компилятор проверяет типы и выдаёт JS для V8. Типы **стираются** в runtime; границы сети и логика — отдельная ответственность. **Structural typing** сопоставляет объекты по полям — естественно для JSON shop API. Курс идёт после javascript-basic и готовит typed слой перед Node BFF к **:8090**.

## Чек-лист

- [ ] Объясните одним предложением: TS vs JS vs runtime Node
- [ ] Нарисуйте цепочку `.ts` → tsc → `.js` → node
- [ ] Почему `interface Product` не работает с `instanceof`?
- [ ] Что такое structural typing на примере `fromApi` с лишним полем
- [ ] Назовите одну вещь, которую TS **не** ловит
- [ ] Где typescript-basic в схеме [`javascript-path`](../javascript-path.md)

Следующий урок: [02. Аннотации и вывод типов](02-annotations-inference.md).
