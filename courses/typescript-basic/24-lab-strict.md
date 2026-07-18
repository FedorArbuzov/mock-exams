# 24. Лаба: исправление strict-ошибок в sample-проекте

## Сценарий

В репозитории лежит полумигрированный **Task Tracker** — тот же домен, что в [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md), но на TypeScript с `"strict": false`. Tech lead включил `"strict": true`. Ваша задача — довести проект до **нулевых ошибок** `tsc` без `@ts-ignore` и без массового `as any`.

Лаба опирается на [23-strict-mode.md](23-strict-mode.md) и [22-tsconfig.md](22-tsconfig.md).

## Что вы сделаете

- Включите strict в `tsconfig.json`
- Исправите типичные ошибки: implicit any, null, index access
- Типизируете store и CLI без ослабления контрактов
- Проверите, что runtime-поведение не сломалось

**Время:** ~45–60 минут.  
**Где код:** `courses/typescript-basic/examples/lab-strict/`.

---

## Подготовка

```text
lab-strict/
├── package.json          # "type": "module"
├── tsconfig.json         # strict: false (старт)
├── data/
│   └── tasks.json
└── src/
    ├── task.ts           # модель Task
    ├── store.ts          # TaskStore — много ошибок
    ├── cli.ts            # разбор argv
    ├── parse-args.ts
    └── format.ts
```

Установка:

```bash
cd courses/typescript-basic/examples/lab-strict
npm install
npm run check    # tsc --noEmit
```

Стартовый `npm run check` при `strict: false` — 0 ошибок. После включения strict — **целевое число ошибок > 0** (это задание).

---

## Задание 1. Включить strict

В `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

Запустите `npm run check`. Зафиксируйте **количество** ошибок в комментарии в `README.md` лабы (до/после).

### Критерий

- `strict: true` включён
- Список категорий ошибок записан (any, null, index, …)

---

## Задание 2. Модель `Task`

Файл `src/task.ts` — приведите к явным типам:

```typescript
export type TaskStatus = "todo" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  tags: string[];
  dueDate: string | null;
}

export interface CreateTaskOptions {
  tags?: string[];
  dueDate?: string | null;
}
```

Реализуйте `createTask(title: string, options?: CreateTaskOptions): Task`:

- пустой `title` → `throw new ValidationError(...)` (класс из `errors.ts` или inline)
- `tags` по умолчанию `[]`
- `dueDate` по умолчанию `null`

### Типичные strict-ошибки здесь

```typescript
// Было (implicit any на options):
export function createTask(title, options) { ... }

// Стало:
export function createTask(title: string, options?: CreateTaskOptions): Task { ... }
```

---

## Задание 3. `TaskStore` — null и index

Стартовый `store.ts` содержит паттерны:

```typescript
findById(id: string) {
  return this.tasks.find((t) => t.id === id); // T | undefined
}

markDone(id: string) {
  const task = this.findById(id);
  task.status = "done"; // strictNullChecks
}

getByIndex(index: number) {
  return this.tasks[index]; // noUncheckedIndexedAccess → T | undefined
}
```

### Требования

1. `findById` возвращает `Task | undefined` — **не** `Task | null`, если не договорились иначе.
2. `markDone(id): Task` — если не найден, `throw new NotFoundError(id)`.
3. `list(filter?)` — возвращает **копию** массива `[...this.tasks]`.
4. `load()` — если файла нет, пустой store; JSON parse с `unknown` + проверка формы (минимально: `Array.isArray`).

### Подсказка для load

```typescript
import { readFile } from "node:fs/promises";

async load(path: string): Promise<void> {
  try {
    const raw = await readFile(path, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid tasks.json: expected array");
    }
    // TODO: narrow each element to Task (или zod в 27-lab-zod)
    this.tasks = parsed as Task[]; // временно; замените в lab-zod
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      this.tasks = [];
      return;
    }
    throw err;
  }
}
```

Замените `as Task[]` на Zod в [27-lab-zod.md](27-lab-zod.md).

---

## Задание 4. CLI и `parse-args`

`parse-args.ts` — типизируйте результат:

```typescript
export type Command =
  | { kind: "add"; title: string; tags: string[] }
  | { kind: "list"; status?: TaskStatus; search?: string }
  | { kind: "done"; id: string }
  | { kind: "remove"; id: string };

export function parseArgv(argv: string[]): Command { ... }
```

`cli.ts`:

```typescript
async function main(): Promise<void> {
  const cmd = parseArgv(process.argv.slice(2));
  // switch (cmd.kind) с исчерпывающей проверкой
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
```

**Exhaustive check** для union:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected command: ${JSON.stringify(x)}`);
}
```

---

## Задание 5. Финальная проверка

```bash
npm run check   # 0 errors
npm run build   # tsc
node dist/cli.js add "Buy milk" --tags home
node dist/cli.js list
node dist/cli.js done <id>
```

### Критерии успеха

- [ ] `npm run check` — 0 ошибок при `strict: true`
- [ ] Нет `@ts-ignore` / `@ts-nocheck`
- [ ] Не более **3** осознанных `as` (задокументируйте в README)
- [ ] `markDone` на несуществующий id — exit 1
- [ ] `list()` не даёт мутировать внутренний массив снаружи

---

## Типичные ошибки в лабе

1. **Везде non-null assertion `!`** — reviewer отклонит PR.

2. **`as Task` на JSON без проверки** — strict формально OK, runtime — нет.

3. **Забыли `noUncheckedIndexedAccess`** — `tasks[0]` без проверки.

4. **Union command без default в switch** — TS2366 fallthrough.

5. **`catch (e: any)`** — используйте `unknown` + narrowing.

6. **Импорт без `.js`** при NodeNext — ошибка компиляции, не strict.

---

## Связь с курсом

- Strict flags: [23-strict-mode.md](23-strict-mode.md)
- Discriminated unions — урок 08
- JS capstone домен: [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md)
- Zod для load: [27-lab-zod.md](27-lab-zod.md)
- TS capstone: [33-capstone.md](33-capstone.md)

---

## Резюме лабы

Вы прошли путь «strict включили → исправили осмысленно», а не «выключили обратно». Это тот же skill, что нужен при миграции shop-модулей и Task Tracker в production monorepo.

---

## Чек-лист перед сдачей

- Сколько было ошибок сразу после strict?
- Где использовали narrowing вместо `as`?
- Что вернёт `findById` и как вы это обработали?
- README лабы описывает команды запуска?

Следующий урок: [25. Modules и declarations](25-modules-declarations.md).
