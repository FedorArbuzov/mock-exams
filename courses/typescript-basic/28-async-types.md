# 28. Async types: `Promise`, async functions

## Сценарий с работы

Code review async handler в Node BFF:

```typescript
async function loadCatalog(): Promise<Item[]> { ... }
```

Коллега написал `async function loadCatalog(): Item[]` — TypeScript молчит? Нет — ошибка: async **всегда** возвращает Promise. Втор/GUI вы `await store.save()` забыли — тип `Promise<void>`, lint не поймал, данные не сохранились. В generic `retry<T>` забыли `await` внутри — вернули `Promise<Promise<T>>`.

Async в TypeScript — те же Promises, что в [javascript-basic/26-promises.md](../javascript-basic/26-promises.md) performance и event loop — [javascript-basic/27-async-await.md](../javascript-basic/27-async-await.md), но с **явными** типами на границах.

## Что вы узнаете

- Тип `Promise<T>` и что возвращает `async function`
- Аннотации return type для async
- `Awaited<T>` utility type
- Типизация `then` / `catch` / `finally`
- `Promise.all`, `allSettled`, `race` с generics
- Async iterators (обзор)
- Типичные ошибки с двойным Promise

---

## `Promise<T>`

```typescript
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(url: string): Promise<string> {
  return fetch(url).then((r) => r.text());
}
```

Generic параметр — тип **fulfilled value**, не Response и не Error.

---

## Async function return types

```typescript
async function getItem(id: number): Promise<Item> {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  const json: unknown = await res.json();
  return ItemSchema.parse(json);
}
```

**Правило:** если функция `async`, return type **почти всегда** `Promise<...>`.

```typescript
// Ошибка TS1064:
async function bad(): Item {
  return { id: 1, name: "x", price: 0, description: null };
}
// Фактически возвращается Promise<Item>
```

Можно опустить аннотацию — TS выведет `Promise<Item>`. Явная анnotation на **public API** улучшает сообщения об ошибках.

### Sync throw vs async reject

```typescript
async function load(): Promise<Task[]> {
  throw new Error("disk full"); // → rejected Promise
  return [];
}
```

Тип тот же: `Promise<Task[]>`.

---

## `Awaited<T>`

Рекурсивно «разворачивает» Promise (TS 4.5+):

```typescript
type A = Awaited<Promise<string>>;           // string
type B = Awaited<Promise<Promise<number>>>;  // number
type C = Awaited<string | Promise<string>>;  // string
```

Полезно в generic utilities:

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  // ...
}
type Result = Awaited<ReturnType<typeof loadCatalog>>;
```

---

## Thenable и union с Promise

```typescript
type MaybePromise<T> = T | Promise<T>;

async function ensure<T>(value: MaybePromise<T>): Promise<T> {
  return await value;
}
```

---

## Promise combinators

```typescript
const [health, items] = await Promise.all([
  getHealth(),
  listItems(),
] as const);
// health: Health, items: Item[] — при tuple нужен as const или overload
```

Типизация `Promise.all`:

```typescript
function all<T extends readonly unknown[] | []>(
  values: T
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
```

`Promise.allSettled` — массив `{ status: 'fulfilled' | 'rejected', ... }`.

`Promise.race` — тип union элементов массива.

---

## Catch и unknown

```typescript
async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await writeFile(path, JSON.stringify(tasks, null, 2));
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Save failed: ${err.message}`);
    }
    throw err;
  }
}
```

Не типизируйте `catch (err: any)`.

---

## Async arrow и methods

```typescript
class TaskStore {
  async load(path: string): Promise<void> { ... }

  save = async (): Promise<void> => { ... }; // this лексический
}
```

Return type методов класса — явно `Promise<...>`.

---

## Double Promise anti-pattern

```typescript
// Плохо:
async function wrap(): Promise<Promise<Item>> {
  return fetchItem(1); // forgot await — но async оборачивает ещё раз?
}
// На самом деле async + return Promise → flatten to Promise<Item>
```

```typescript
// Плохо в generic helper:
function identity<T>(x: T): T {
  return x;
}
const p = identity(Promise.resolve(1)); // T inferred as Promise<number>
```

Явный `await` внутри async обычно flatten. Проблема чаще в **забытом await** у вызывающего:

```typescript
store.save(); // Promise<void> ignored — floating promise
void store.save(); // явно fire-and-forget
await store.save();
```

ESLint `@typescript-eslint/no-floating-promises` — [31-tooling-migration.md](31-tooling-migration.md).

---

## Async generators (обзор)

```typescript
async function* readLines(path: string): AsyncGenerator<string, void, void> {
  // ...
}

for await (const line of readLines("data.log")) {
  console.log(line);
}
```

Node streams + `Readable`/`AsyncIterable` — подробнее в **nodejs-intermediate**.

---

## Типизация callback API в Promise

```typescript
function readJsonFile(path: string): Promise<unknown> {
  return readFile(path, "utf-8").then(
    (text) => JSON.parse(text) as unknown
  );
}
```

После parse — Zod ([26-zod-basics.md](26-zod-basics.md)).

---

## Связь с курсом

- JS Promises: [javascript-basic/26-promises.md](../javascript-basic/26-promises.md)
- async/await: [javascript-basic/27-async-await.md](../javascript-basic/27-async-await.md)
- Lab async: [javascript-basic/28-lab-async.md](../javascript-basic/28-lab-async.md)
- Typed fetch: [29-fetch-typed.md](29-fetch-typed.md)
- TaskStore save/load: [24-lab-strict.md](24-lab-strict.md), [33-capstone.md](33-capstone.md)

---

## Типичные ошибки

1. **Return type без Promise у async** — TS1064.

2. **Floating promise** — не awaited save/load.

3. **`map(async () => ...)` без Promise.all** — массив Promise.

4. **`catch (e: any)`** — теряете strict catch.

5. **Тип `Promise<Response>` вместо данных** — забыли json()+parse.

6. **Union T | Promise<T> без await** — ветки ведут себя по-разному.

---

## Резюме

Async functions возвращают `Promise<T>`. Аннотируйте public API как `Promise<...>`. `Awaited` разворачивает вложенные Promise. Combinators сохраняют generics при правильных tuple. На границе async IO — `unknown` + Zod. Контролируйте floating promises через await или void + lint.

---

## Чек-лист

- Какой return type у `async function f(): Promise<number>` vs забытый Promise?
- Что делает `Awaited<Promise<Promise<T>>>`?
- Почему `store.save()` без await опасен?
- Тип результата `Promise.all([a(), b()])`?
- Reject в async — exception или return?

Следующий урок: [29. Typed fetch](29-fetch-typed.md).
