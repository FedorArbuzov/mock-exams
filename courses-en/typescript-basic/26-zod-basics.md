# 26. Zod: runtime validation and inferring types

## Scenario from work

FastAPI on `:8090` returned catalog JSON. TypeScript in the client is "sure" that `price: number`. In production, `"79.99"` (a string) arrived — the UI showed `$NaN`, and orders went out with a zero total. Static types **disappear** after compilation; the API contract lives only in OpenAPI and in the team's heads.

**Zod** is a **runtime-schema** library: you parse unknown data and get a typed object or a clear error. The TS type is **inferred** from the schema — a single source of truth.

## What you'll learn

- Why validation at the I/O boundary
- Basic schemas: `string`, `number`, `object`, `array`
- `.parse` vs `.safeParse`
- `z.infer<typeof Schema>` — a type from a schema
- Union, enum, optional, default, refine
- Integration with TypeScript strict

---

## Installation

```bash
npm install zod
```

```typescript
import { z } from "zod";
```

---

## First schema

```typescript
const ItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  description: z.string().nullable().optional(),
});

type Item = z.infer<typeof ItemSchema>;
// { id: number; name: string; price: number; description?: string | null | undefined }
```

**Rule:** don't duplicate `interface Item` and the Zod schema by hand — **infer** from the schema.

---

## parse and safeParse

```typescript
const raw: unknown = JSON.parse(jsonString);

// parse — throws a ZodError
const item = ItemSchema.parse(raw);

// safeParse — a Result
const result = ItemSchema.safeParse(raw);
if (!result.success) {
  console.error(result.error.flatten());
  throw new Error("Invalid item payload");
}
const item = result.data;
```

At the HTTP boundary ([29-fetch-typed.md](29-fetch-typed.md)):

```typescript
async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  return ItemSchema.parse(json);
}
```

---

## Strings, numbers, dates

```typescript
const EmailSchema = z.string().email();
const UuidSchema = z.string().uuid();
const PortSchema = z.coerce.number().int().min(1).max(65535);

const IsoDateSchema = z.string().datetime({ offset: true });
// or z.coerce.date() if a timestamp arrives
```

`z.coerce.number()` — `"42"` → `42` (be careful with an empty string).

---

## Arrays and nested objects

```typescript
const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "done"]),
  createdAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  dueDate: z.string().datetime().nullable().default(null),
});

const TaskListSchema = z.array(TaskSchema);

type Task = z.infer<typeof TaskSchema>;
```

The same shape as in [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md) — preparation for [33-capstone.md](33-capstone.md).

---

## Optional, nullable, default

| Zod | TS (infer) | Meaning |
|-----|------------|-------|
| `z.string().optional()` | `string \| undefined` | the key may be absent |
| `z.string().nullable()` | `string \| null` | the key exists, the value is null |
| `.default([])` | always an array | if undefined — substitutes [] |

```typescript
const CreateItemSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).default([]),
});
CreateItemSchema.parse({ name: "Kb" }); // tags: []
```

With `exactOptionalPropertyTypes` in tsconfig, watch `undefined` vs an absent key — Zod's `.optional()` is usually consistent.

---

## Union and discriminated union

```typescript
const ApiErrorSchema = z.object({
  detail: z.union([z.string(), z.array(z.record(z.unknown()))]),
});

const CommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("add"), title: z.string() }),
  z.object({ kind: z.literal("list"), status: z.enum(["todo", "done"]).optional() }),
]);
```

A discriminated union is convenient for CLI commands ([24-lab-strict.md](24-lab-strict.md)).

---

## refine and superRefine

Business rules on top of the structure:

```typescript
const TaskCreateSchema = z
  .object({
    title: z.string().min(1),
    dueDate: z.string().datetime().nullable(),
  })
  .refine(
    (data) => data.title.trim().length > 0,
    { message: "Title cannot be whitespace", path: ["title"] }
  );
```

---

## Errors for the user and logs

```typescript
try {
  TaskSchema.parse(raw);
} catch (err) {
  if (err instanceof z.ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    console.error(fieldErrors);
  }
  throw err;
}
```

FastAPI 422 returns a similar structure — you can map it into UI forms (react-basic).

---

## Zod vs TypeScript

| | TypeScript | Zod |
|---|------------|-----|
| When | compile time | runtime |
| JSON from an API | doesn't see it | parse |
| Refactor | IDE | schema + infer |
| Performance | zero | cost on parse |

**Course pattern:** Zod at the **boundaries** (HTTP, file, env); inside the domain — pure TS types from `z.infer`.

---

## Env variables (overview)

```typescript
const EnvSchema = z.object({
  API_BASE: z.string().url().default("http://localhost:8090"),
  PORT: z.coerce.number().default(3000),
});

export const env = EnvSchema.parse(process.env);
```

Parse env **once** at startup, not in every handler.

---

## Related courses

- `unknown` vs `any`: [29-fetch-typed.md](29-fetch-typed.md)
- FastAPI JSON lab: [27-lab-zod.md](27-lab-zod.md)
- Strict null: [23-strict-mode.md](23-strict-mode.md)
- OpenAPI / Pydantic: [fastapi](../fastapi/README.md), [api-design](../api-design/README.md)

---

## Common mistakes

1. **Duplicating an interface and Zod** — they diverge within a week.

2. **`as Item` after json()** — bypassing validation.

3. **`.parse` without try/catch on user input** — an unhandled ZodError.

4. **`z.any()` in a schema** — you lose the point of validation.

5. **Coerce without understanding** — `"abc"` → NaN passes `z.coerce.number()` without `.finite()`.

6. **Validation in every component** — one parse at the module's entry.

---

## Summary

Zod describes the shape of data at runtime; `z.infer` gives a TypeScript type from the same schema. Use `.safeParse`/`parse` at the I/O boundary after `JSON.parse` or `res.json()`. Enum, default, refine cover the domain rules of the Task Tracker and shop API. TS strict + Zod = compile-time and runtime protection.

---

## Checklist

- Why doesn't an `interface` protect against invalid JSON?
- How does `.parse` differ from `.safeParse`?
- How do you get the `Task` type from Zod without a hand-written interface?
- Where in the client architecture should you call parse — once or in every function?
- What does Zod return for `{ price: "79.99" }` without coerce?

Next lesson: [27. Lab: Zod](27-lab-zod.md).
