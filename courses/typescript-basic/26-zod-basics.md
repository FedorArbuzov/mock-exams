# 26. Zod: runtime validation и infer типов

## Сценарий с работы

FastAPI на `:8090` вернул JSON каталога. TypeScript в клиенте «уверен», что `price: number`. В проде прилетело `"79.99"` (строка) — UI показал `$NaN`, заказы ушли с нулевой суммой. Статические типы **исчезают** после компиляции; контракт API живёт только в OpenAPI и в голове команды.

**Zod** — библиотека **runtime-схем**: парсите неизвестные данные, получаете типизированный объект или понятную ошибку. Тип TS **выводится** из схемы — один источник правды.

## Что вы узнаете

- Зачем validation на границе IO
- Базовые схемы: `string`, `number`, `object`, `array`
- `.parse` vs `.safeParse`
- `z.infer<typeof Schema>` — тип из схемы
- Union, enum, optional, default, refine
- Интеграция с TypeScript strict

---

## Установка

```bash
npm install zod
```

```typescript
import { z } from "zod";
```

---

## Первый schema

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

**Правило:** не дублируйте `interface Item` и Zod вручную — **infer** из схемы.

---

## parse и safeParse

```typescript
const raw: unknown = JSON.parse(jsonString);

// parse — бросает ZodError
const item = ItemSchema.parse(raw);

// safeParse — Result
const result = ItemSchema.safeParse(raw);
if (!result.success) {
  console.error(result.error.flatten());
  throw new Error("Invalid item payload");
}
const item = result.data;
```

На границе HTTP ([29-fetch-typed.md](29-fetch-typed.md)):

```typescript
async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  return ItemSchema.parse(json);
}
```

---

## Строки, числа, даты

```typescript
const EmailSchema = z.string().email();
const UuidSchema = z.string().uuid();
const PortSchema = z.coerce.number().int().min(1).max(65535);

const IsoDateSchema = z.string().datetime({ offset: true });
// или z.coerce.date() если приходит timestamp
```

`z.coerce.number()` — `"42"` → `42` (осторожно с пустой строкой).

---

## Массивы и вложенные объекты

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

Тот же shape, что в [javascript-basic/39-capstone.md](../javascript-basic/39-capstone.md) — подготовка к [33-capstone.md](33-capstone.md).

---

## Optional, nullable, default

| Zod | TS (infer) | Смысл |
|-----|------------|-------|
| `z.string().optional()` | `string \| undefined` | ключ может отсутствовать |
| `z.string().nullable()` | `string \| null` | ключ есть, значение null |
| `.default([])` | всегда массив | если undefined — подставит [] |

```typescript
const CreateItemSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).default([]),
});
CreateItemSchema.parse({ name: "Kb" }); // tags: []
```

С `exactOptionalPropertyTypes` в tsconfig следите за `undefined` vs отсутствием ключа — Zod `.optional()` обычно согласован.

---

## Union и discriminated union

```typescript
const ApiErrorSchema = z.object({
  detail: z.union([z.string(), z.array(z.record(z.unknown()))]),
});

const CommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("add"), title: z.string() }),
  z.object({ kind: z.literal("list"), status: z.enum(["todo", "done"]).optional() }),
]);
```

Discriminated union удобен для CLI команд ([24-lab-strict.md](24-lab-strict.md)).

---

## refine и superRefine

Бизнес-правила поверх структуры:

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

## Ошибки для пользователя и логов

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

FastAPI 422 возвращает похожую структура — можно маппить в UI формы (react-basic).

---

## Zod vs TypeScript

| | TypeScript | Zod |
|---|------------|-----|
| Когда | compile time | runtime |
| JSON от API | не видит | parse |
| Refactor | IDE | схема + infer |
| Performance | нулевая | cost на parse |

**Паттерн курса:** Zod на **границах** (HTTP, file, env); внутри домена — чистые TS-типы из `z.infer`.

---

## Env variables (обзор)

```typescript
const EnvSchema = z.object({
  API_BASE: z.string().url().default("http://localhost:8090"),
  PORT: z.coerce.number().default(3000),
});

export const env = EnvSchema.parse(process.env);
```

Парсите env **один раз** при старте, не в каждом handler.

---

## Связь с курсом

- `unknown` vs `any`: [29-fetch-typed.md](29-fetch-typed.md)
- Лаба FastAPI JSON: [27-lab-zod.md](27-lab-zod.md)
- Strict null: [23-strict-mode.md](23-strict-mode.md)
- OpenAPI / Pydantic: [fastapi](../fastapi/README.md), [api-design](../api-design/README.md)

---

## Типичные ошибки

1. **Дублировать interface и Zod** — расходятся через неделю.

2. **`as Item` после json()** — обход validation.

3. **`.parse` без try/catch на user input** — необработанный ZodError.

4. **`z.any()` в схеме** — теряете смысл validation.

5. **Coerce без понимания** — `"abc"` → NaN проходит `z.coerce.number()` без `.finite()`.

6. **Валидация в каждом компоненте** — один parse на входе модуля.

---

## Резюме

Zod описывает форму данных в runtime; `z.infer` даёт TypeScript-тип из той же схемы. Используйте `.safeParse`/`parse` на границе IO после `JSON.parse` или `res.json()`. Enum, default, refine покрывают доменные правила Task Tracker и shop API. TS strict + Zod = compile-time и runtime защита.

---

## Чек-лист

- Почему `interface` не защищает от неверного JSON?
- Чем `.parse` отличается от `.safeParse`?
- Как получить тип `Task` из Zod без ручного interface?
- Где в архитектуре клиента вызывать parse — один раз или в каждой функции?
- Что вернёт Zod для `{ price: "79.99" }` без coerce?

Следующий урок: [27. Лаба: Zod](27-lab-zod.md).
