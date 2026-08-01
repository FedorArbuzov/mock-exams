# 24. Lab: fixing strict errors in a sample project

## Scenario

The repository contains a half-migrated **Task Tracker** — the same domain as in [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md), but in TypeScript with `"strict": false`. The tech lead turned on `"strict": true`. Your task is to get the project to **zero** `tsc` errors without `@ts-ignore` and without a mass of `as any`.

The lab builds on [23-strict-mode.md](23-strict-mode.md) and [22-tsconfig.md](22-tsconfig.md).

## What you'll do

- Enable strict in `tsconfig.json`
- Fix typical errors: implicit any, null, index access
- Type the store and CLI without weakening the contracts
- Verify that runtime behavior isn't broken

**Time:** ~45–60 minutes.  
**Where the code is:** `courses/typescript-basic/examples/lab-strict/`.

---

## Setup

```text
lab-strict/
├── package.json          # "type": "module"
├── tsconfig.json         # strict: false (start)
├── data/
│   └── tasks.json
└── src/
    ├── task.ts           # Task model
    ├── store.ts          # TaskStore — many errors
    ├── cli.ts            # argv parsing
    ├── parse-args.ts
    └── format.ts
```

Install:

```bash
cd courses/typescript-basic/examples/lab-strict
npm install
npm run check    # tsc --noEmit
```

The initial `npm run check` with `strict: false` — 0 errors. After enabling strict — a **target error count > 0** (that's the task).

---

## Task 1. Enable strict

In `tsconfig.json`:

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

Run `npm run check`. Record the **number** of errors in a comment in the lab's `README.md` (before/after).

### Criterion

- `strict: true` enabled
- The list of error categories recorded (any, null, index, …)

---

## Task 2. The `Task` model

File `src/task.ts` — bring it to explicit types:

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

Implement `createTask(title: string, options?: CreateTaskOptions): Task`:

- empty `title` → `throw new ValidationError(...)` (a class from `errors.ts` or inline)
- `tags` default `[]`
- `dueDate` default `null`

### Typical strict errors here

```typescript
// Was (implicit any on options):
export function createTask(title, options) { ... }

// Now:
export function createTask(title: string, options?: CreateTaskOptions): Task { ... }
```

---

## Task 3. `TaskStore` — null and index

The starting `store.ts` contains patterns:

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

### Requirements

1. `findById` returns `Task | undefined` — **not** `Task | null`, unless agreed otherwise.
2. `markDone(id): Task` — if not found, `throw new NotFoundError(id)`.
3. `list(filter?)` — returns a **copy** of the array `[...this.tasks]`.
4. `load()` — if the file is missing, an empty store; JSON parse with `unknown` + a shape check (minimally: `Array.isArray`).

### Hint for load

```typescript
import { readFile } from "node:fs/promises";

async load(path: string): Promise<void> {
  try {
    const raw = await readFile(path, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid tasks.json: expected array");
    }
    // TODO: narrow each element to Task (or zod in 27-lab-zod)
    this.tasks = parsed as Task[]; // temporary; replace in lab-zod
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      this.tasks = [];
      return;
    }
    throw err;
  }
}
```

Replace `as Task[]` with Zod in [27-lab-zod.md](27-lab-zod.md).

---

## Task 4. CLI and `parse-args`

`parse-args.ts` — type the result:

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
  // switch (cmd.kind) with an exhaustive check
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
```

**Exhaustive check** for the union:

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected command: ${JSON.stringify(x)}`);
}
```

---

## Task 5. Final check

```bash
npm run check   # 0 errors
npm run build   # tsc
node dist/cli.js add "Buy milk" --tags home
node dist/cli.js list
node dist/cli.js done <id>
```

### Success criteria

- [ ] `npm run check` — 0 errors with `strict: true`
- [ ] No `@ts-ignore` / `@ts-nocheck`
- [ ] No more than **3** deliberate `as` (document them in the README)
- [ ] `markDone` on a non-existent id — exit 1
- [ ] `list()` doesn't allow mutating the internal array from outside

---

## Common mistakes in the lab

1. **Non-null assertion `!` everywhere** — the reviewer will reject the PR.

2. **`as Task` on JSON without a check** — strict is formally OK, runtime isn't.

3. **Forgot `noUncheckedIndexedAccess`** — `tasks[0]` without a check.

4. **A union command without a default in the switch** — TS2366 fallthrough.

5. **`catch (e: any)`** — use `unknown` + narrowing.

6. **Import without `.js`** with NodeNext — a compile error, not strict.

---

## Related courses

- Strict flags: [23-strict-mode.md](23-strict-mode.md)
- Discriminated unions — lesson 08
- JS capstone domain: [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md)
- Zod for load: [27-lab-zod.md](27-lab-zod.md)
- TS capstone: [33-capstone.md](33-capstone.md)

---

## Lab summary

You went through the path of "turned strict on → fixed things meaningfully," not "turned it back off." This is the same skill needed when migrating shop modules and the Task Tracker to a production monorepo.

---

## Checklist before submitting

- How many errors were there right after enabling strict?
- Where did you use narrowing instead of `as`?
- What does `findById` return and how did you handle it?
- Does the lab's README describe the run commands?

Next lesson: [25. Modules and declarations](25-modules-declarations.md).
