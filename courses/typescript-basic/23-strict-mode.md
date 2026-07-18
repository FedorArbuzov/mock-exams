# 23. Strict mode: `strictNullChecks`, `noImplicitAny` и семейство флагов

## Сценарий с работы

Junior мигрирует JS-модуль корзины в TypeScript с `"strict": false`. PR зелёный. На staging: `Cannot read properties of undefined (reading 'price')` — `item` был `undefined`, потому что `find` не нашёл SKU. Senior включает `strictNullChecks`: 847 ошибок. Через неделю — 40 осмысленных правок и ноль таких NPE в этом модуле.

**Strict mode TypeScript** — не путать с `"use strict"` JavaScript ([javascript-basic/02-variables-strict.md](../javascript-basic/02-variables-strict.md)). Это набор **флагов компилятора**, которые запрещают неявные `any`, небезопасный `null`/`undefined` и другие дыры, через которые JS-баги проходят «с зелёной галочкой типов».

## Что вы узнаете

- Что включает `"strict": true`
- `strictNullChecks` и работа с `null` / `undefined`
- `noImplicitAny` и явная типизация
- `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`
- Дополнительные «строгие» флаги вне `strict`
- Стратегия включения strict в существующем проекте

---

## `"strict": true` — umbrella

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Включает **все** флаги ниже (актуально для TS 5.x):

| Флаг | Суть |
|------|------|
| `noImplicitAny` | ошибка, если тип выводится как `any` |
| `strictNullChecks` | `null`/`undefined` — отдельные значения в union |
| `strictFunctionTypes` | контравariantность параметров функций |
| `strictBindCallApply` | типы для `bind`/`call`/`apply` |
| `strictPropertyInitialization` | поля класса инициализированы в constructor |
| `noImplicitThis` | `this` с неявным `any` — ошибка |
| `alwaysStrict` | emit `"use strict"` в каждый файл |
| `useUnknownInCatchVariables` | `catch (e)` → `unknown`, не `any` |

**Правило курса:** новые проекты — `"strict": true` с первого коммита. Легаси — см. [31-tooling-migration.md](31-tooling-migration.md) и лабу [24-lab-strict.md](24-lab-strict.md).

---

## `noImplicitAny`

Без флага:

```typescript
function add(a, b) {
  return a + b;
}
// a, b: any — склеит строки и числа как в JS
```

С `noImplicitAny`:

```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

Явный `any` **разрешён**, если вы осознанно пишете:

```typescript
function legacyBridge(payload: any): void {
  // TODO: типизировать после миграции
}
```

Но `any` **заражает** цепочку: результат `legacyBridge` снова `any`. Минимизируйте; на границах API используйте `unknown` ([29-fetch-typed.md](29-fetch-typed.md)).

---

## `strictNullChecks`

Без флага `null` и `undefined` «прилипают» ко всем типам (кроме `void` в старых версиях).

С флагом:

```typescript
type User = { name: string; email: string | null };

function sendWelcome(user: User) {
  console.log(user.email.toLowerCase());
  //              ~~~~~ Object is possibly 'null'
}
```

Исправления:

```typescript
if (user.email !== null) {
  console.log(user.email.toLowerCase());
}

console.log(user.email?.toLowerCase() ?? "no email");
```

### `find`, `[]`, optional properties

```typescript
const items = [{ id: "1", name: "Keyboard" }];
const item = items.find((i) => i.id === "999");
// item: { id: string; name: string } | undefined

if (!item) {
  throw new Error("Not found");
}
console.log(item.name);
```

Optional `?` ≠ «может быть null»:

```typescript
interface Task {
  dueDate?: string; // string | undefined
  tags: string[];   // обязателен; [] если пусто
}
```

Для «может отсутствовать или null» — `string | null | undefined` или нормализация на границе (Zod — [26-zod-basics.md](26-zod-basics.md)).

---

## `strictFunctionTypes`

Запрещает несовместимые callback-и при присваивании:

```typescript
type AnimalHandler = (animal: Animal) => void;

const dogHandler: AnimalHandler = (dog: Dog) => {
  console.log(dog.breed);
};
// Ошибка: DogHandler не assignable к AnimalHandler
// (параметр contravariant — нельзя сужать)
```

На практике чаще всплывает при generic колбэках и event handlers. Если застряли — упростите сигнатуру или используйте overload.

---

## `strictPropertyInitialization`

```typescript
class TaskStore {
  private tasks: Task[]; // Error: no initializer

  constructor() {
    this.tasks = [];
  }
}
```

Или definite assignment assertion (осторожно):

```typescript
private config!: AppConfig; // «инициализирую позже в init()»
```

Предпочитайте инициализацию в constructor или поле с default.

---

## `useUnknownInCatchVariables`

```typescript
try {
  await saveTasks();
} catch (err) {
  // err: unknown
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
}
```

Связь с [javascript-basic/32-error-handling.md](../javascript-basic/32-error-handling.md).

---

## Флаги вне `strict` (рекомендуем включить)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

| Флаг | Эффект |
|------|--------|
| `noUncheckedIndexedAccess` | `arr[i]` → `T \| undefined` |
| `noImplicitOverride` | явный `override` в наследниках |
| `exactOptionalPropertyTypes` | `{ x?: number }` не принимает `x: undefined` явно |

`noUncheckedIndexedAccess` шумный, но спасает от `tasks[id]` без проверки — полезно в store capstone.

---

## Постепенное включение (легаси)

```json
{
  "compilerOptions": {
    "strict": false,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

Или директива в файле (не рекомендуется надолго):

```typescript
// @ts-nocheck — весь файл без проверки (крайний случай)
// @ts-expect-error — следующая строка должна дать ошибку (для тестов)
```

Лучше: `// @ts-strict` нет; используйте **eslint** `@typescript-eslint/strict` и лабу [24-lab-strict.md](24-lab-strict.md).

---

## Strict + runtime validation

TypeScript проверяет **на этапе компиляции**. JSON с `:8090` приходит **без типов**:

```typescript
const raw = await res.json(); // any или unknown
```

Compile-time strict не спасёт от `{ price: "79.99" }` вместо number. На границе — Zod ([26-zod-basics.md](26-zod-basics.md)).

---

## Связь с курсом

- Union и narrowing — уроки 05–08.
- Optional chaining — [javascript-basic/19-optional-nullish.md](../javascript-basic/19-optional-nullish.md).
- tsconfig — [22-tsconfig.md](22-tsconfig.md).
- Лаба исправления ошибок — [24-lab-strict.md](24-lab-strict.md).

---

## Типичные ошибки

1. **`as SomeType` вместо проверки** — заглушили strict, баг остался.

2. **Non-null assertion `!` везде** — `user!.email!.slice()` — маскировка, не решение.

3. **Путать `?` и `| null`** — API вернул `null`, поле optional — `undefined`.

4. **Отключить strict в monorepo package** — самый слабый пакет тянет качество вниз.

5. **Игнорировать `unknown` в catch** — `err.message` без narrowing.

6. **Думать, что strict = runtime safety** — нужен ещё Zod на IO.

---

## Резюме

`strict: true` включает семейство флагов против неявного `any`, небезопасного null и слабых сигнатур функций. `strictNullChecks` — главный источник «новых» ошибок при миграции и главный выигрыш в надёжности. Дополнительные флаги (`noUncheckedIndexedAccess`) усиливают защиту. Strict не заменяет валидацию JSON — комбинируйте с Zod.

---

## Чек-лист

- Что включает `"strict": true`?
- Чем `T | undefined` отличается от optional property `x?: T`?
- Почему `find()` требует проверки после вызова?
- Зачем `unknown` вместо `any` в catch?
- Strict ловит ошибку `JSON.parse` с неверной формой?

Следующий урок: [24. Лаба: strict](24-lab-strict.md).
