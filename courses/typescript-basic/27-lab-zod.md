# 27. Лаба: валидация JSON от FastAPI через Zod

## Сценарий

Клиент shop-каталога вызывает `GET http://localhost:8090/api/v1/items`. Ответ **должен** совпадать с контрактом FastAPI/Pydantic, но сеть, прокси и ручные правки ломают payload. Ваша задача — описать Zod-схемы, распарсить реальные ответы стенда и обработать ошибки так, как в production BFF.

Опирается на [26-zod-basics.md](26-zod-basics.md), [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md), стенд [deploy/fastapi/README.md](../../deploy/fastapi/README.md).

## Что вы сделаете

- Поднимете (или проверите) FastAPI на `:8090`
- Опишете схемы Item, списка, health, ошибки 422/404
- Напишете typed client с `parse` на границе
- Протестируете на намеренно битом JSON (mock)

**Время:** ~50–65 минут.  
**Где код:** `courses/typescript-basic/examples/lab-zod/`.

---

## Подготовка

```bash
# из корня репозитория
cd deploy/fastapi
docker compose up -d --build

curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Структура лабы:

```text
lab-zod/
├── package.json
├── tsconfig.json
└── src/
    ├── schemas/
    │   ├── item.ts
    │   ├── health.ts
    │   └── errors.ts
    ├── client.ts
    ├── validate-fixtures.ts
    └── demo.ts
```

```bash
cd courses/typescript-basic/examples/lab-zod
npm install
npm run demo
```

---

## Задание 1. Схема `Item`

Изучите ответ `GET /api/v1/items`. На стенде [`deploy/fastapi`](../../deploy/fastapi/README.md) это обёртка:

```json
{
  "items": [
    { "id": 1, "title": "Demo item", "description": "From course stack" }
  ],
  "total": 1
}
```

Опишите:

```typescript
// src/schemas/item.ts
import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
});

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number().int(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;
```

**Не угадывайте** — сверьте с `/docs` Swagger или `curl http://localhost:8090/api/v1/items`.

### Критерий

- `ItemListResponseSchema.parse(await res.json())` на живом API без ZodError

---

## Задание 2. Health и корень

```typescript
// src/schemas/health.ts
import { z } from "zod";

export const HealthSchema = z.object({
  status: z.literal("ok").or(z.string()), // ослабьте, если стенд иначе
  service: z.string().optional(),
  version: z.string().optional(),
});
```

Адаптируйте под фактический `{ "status": "ok", ... }` вашего deploy.

---

## Задание 3. Ошибки FastAPI

404:

```json
{ "detail": "Not found" }
```

422:

```json
{
  "detail": [
    { "loc": ["body", "price"], "msg": "...", "type": "..." }
  ]
}
```

```typescript
// src/schemas/errors.ts
import { z } from "zod";

export const NotFoundSchema = z.object({
  detail: z.string(),
});

export const ValidationErrorSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
    })
  ),
});
```

---

## Задание 4. Typed client

```typescript
// src/client.ts
const API_BASE = "http://localhost:8090";

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await res.json();
  if (!res.ok) {
    throw new HttpError(res.status, body);
  }
  return body;
}

export async function listItems(): Promise<Item[]> {
  const json = await apiGet("/api/v1/items");
  const parsed = ItemListResponseSchema.parse(json);
  return parsed.items;
}

export async function getHealth(): Promise<Health> {
  const json = await apiGet("/health");
  return HealthSchema.parse(json);
}
```

Реализуйте `HttpError` с полем `status` и `body: unknown`. Для 404 попробуйте `NotFoundSchema.safeParse(body)`.

---

## Задание 5. Битый JSON (mock)

Файл `src/validate-fixtures.ts`:

```typescript
import { ItemListResponseSchema } from "./schemas/item.js";

const broken = {
  items: [{ id: 1, title: "Demo", description: "ok" }],
  total: "1",
};

const result = ItemListResponseSchema.safeParse(broken);
if (!result.success) {
  console.log("Expected failure:", result.error.issues[0]?.message);
}
```

### Требования

- Покажите, что **без** Zod поле `total` как string ломает арифметику (`total + 1` → `"11"`)
- Выведите `flatten()` для отладки формы

---

## Задание 6. Demo

`src/demo.ts`:

```typescript
async function main() {
  const health = await getHealth();
  console.log("Health:", health);

  const items = await listItems();
  console.table(items.slice(0, 5).map((i) => ({ id: i.id, title: i.title, description: i.description })));

  // optional: POST с невалидным телом → поймать 422 и распарсить ValidationErrorSchema
}

main().catch(console.error);
```

---

## Задание 7. (Опционально) Связь с Task Tracker

Схема для tasks.json из capstone:

```typescript
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "done"]),
  createdAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  dueDate: z.string().datetime().nullable().default(null),
});

export const TaskFileSchema = z.array(TaskSchema);
```

Используйте в [24-lab-strict.md](24-lab-strict.md) вместо `as Task[]`.

---

## Критерии успеха

- [ ] `npm run demo` при поднятом `:8090` — таблица items без ошибок
- [ ] `validate-fixtures.ts` демонстрирует fail на string price
- [ ] Типы `Item`, `Health` — только `z.infer`, без дублирующих interface
- [ ] HTTP 404/422 не маскируются как success
- [ ] README: как поднять стенд и запустить лабу

---

## Типичные ошибки

1. **Схема по памяти** — на стенде mock-exams поле `title`, не `name`; список — `{ items, total }`. Сверяйте с API.

2. **`res.json()` без проверки `res.ok`** — парсите `{ detail: "Not found" }` как items.

3. **`.parse` на всём приложении** — client.ts достаточно.

4. **Игнор optional полей** — лишние поля Zod по умолчанию strip (`strip`), unknown keys — `.strict()` если нужен контракт.

5. **Нет fallback если Docker не поднят** — документируйте skip или fixture JSON.

---

## Связь с курсом

- Zod теория: [26-zod-basics.md](26-zod-basics.md)
- Fetch: [29-fetch-typed.md](29-fetch-typed.md), [30-lab-fetch.md](30-lab-fetch.md)
- FastAPI Pydantic: зеркало схем на Python-стороне
- Capstone: [33-capstone.md](33-capstone.md)

---

## Резюме лабы

Вы связали OpenAPI-реальный backend с TypeScript через Zod: один schema — runtime check + static type. Это стандартный паттерн для react-basic (TanStack Query + parse) и nodejs BFF.

---

## Чек-лист перед сдачей

- Откуда взяли shape Item?
- Что делает client при ZodError?
- Есть ли тест на broken fixture?
- Готовы ли переиспользовать schemas в capstone?

Следующий урок: [28. Async types](28-async-types.md).
