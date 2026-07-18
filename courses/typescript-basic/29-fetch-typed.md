# 29. Typed fetch: `unknown` vs `any` для JSON

## Сценарий с работы

```typescript
const data = await res.json();
console.log(data.items[0].price.toFixed(2));
```

После `tsc --noEmit` всё зелёное — если `data: any`. В runtime `items` undefined — падение в проде. Senior требует: **`json()` → `unknown` → validate → typed`**. Junior спрашивает: «Почему не `as Item[]`?» — потому что assert не проверяет runtime.

Эта глава — типобезопасный слой поверх [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md) и Zod из [26-zod-basics.md](26-zod-basics.md).

## Что вы узнаете

- Почему `res.json()` по сути не типизирован
- `unknown` vs `any` на границе IO
- Type guards и narrowing без Zod (минимально)
- Generic `api<T>` — когда безопасно, когда нет
- Typed client для `:8090`
- Обработка HTTP vs parse errors

---

## `fetch` и тип Response

```typescript
const res: Response = await fetch("http://localhost:8090/health");
const json: unknown = await res.json();
```

`Response.json()` в lib.dom возвращает `Promise<any>` — **источник any**. Первая строка после json — присвоение в `unknown`.

---

## `any` vs `unknown`

| | any | unknown |
|---|-----|---------|
| Присвоение | всем | только unknown/any |
| `.price` | OK без проверки | ошибка TS |
| Нужен narrow | нет | да |
| Strict | отключает проверки | сохраняет |

```typescript
let a: any = JSON.parse('{"x":1}');
a.foo.bar; // OK для компилятора — бомба

let u: unknown = JSON.parse('{"x":1}');
// u.foo; // TS18046
if (typeof u === "object" && u !== null && "x" in u) {
  const obj = u as { x: unknown };
}
```

**Правило курса:** внешний JSON — **unknown** до validation.

---

## Narrowing без Zod (минимальный guard)

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isItemList(value: unknown): value is Item[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (el) =>
      isRecord(el) &&
      typeof el.id === "number" &&
      typeof el.name === "string" &&
      typeof el.price === "number"
  );
}
```

Для production — Zod короче и лучше сообщения об ошибках.

---

## Typed API wrapper

```typescript
const API_BASE = "http://localhost:8090";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json", ...init?.headers },
      ...init,
    });
  } catch (err) {
    throw new Error(`Network error: ${String(err)}`);
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    throw new HttpError(res.status, body);
  }

  return body;
}
```

---

## Parse на границе (Zod)

```typescript
import { ItemListSchema, type Item } from "./schemas/item.js";

export async function listItems(): Promise<Item[]> {
  const json = await request("/api/v1/items");
  return ItemListSchema.parse(json);
}
```

Тип `Item[]` **гарантирован** после успешного parse.

### Generic `api<T>` — осторожно

```typescript
async function api<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const json = await request(path);
  return schema.parse(json);
}

const items = await api("/api/v1/items", ItemListSchema);
```

Без schema parameter generic **лжёт**:

```typescript
async function api<T>(path: string): Promise<T> {
  return (await request(path)) as T; // UNSAFE
}
```

---

## POST с typed body

```typescript
const CreateItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().nullable().optional(),
});

type CreateItem = z.infer<typeof CreateItemSchema>;

export async function createItem(input: CreateItem): Promise<Item> {
  const body = CreateItemSchema.parse(input);
  const json = await request("/api/v1/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return ItemSchema.parse(json);
}
```

Validate **вход** и **выход** — симметрия контракта.

---

## Разделение ошибок

```typescript
export async function loadCatalog(): Promise<Item[]> {
  try {
    return await listItems();
  } catch (err) {
    if (err instanceof HttpError) {
      // лог status + body
      throw err;
    }
    if (err instanceof z.ZodError) {
      throw new Error(`Invalid API response: ${err.message}`);
    }
    throw err;
  }
}
```

| Слой | Тип ошибки |
|------|------------|
| DNS, offline | network Error |
| 404, 500 | HttpError |
| JSON syntax | SyntaxError |
| Schema mismatch | ZodError |

---

## AbortController с типами

```typescript
export async function listItemsWithTimeout(
  ms: number,
  signal?: AbortSignal
): Promise<Item[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const combined = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const json = await request("/api/v1/items", { signal: combined });
    return ItemListSchema.parse(json);
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## Browser vs Node

В Node 18+ глобальный `fetch` типизирован через `@types/node` / DOM lib. CORS — только браузер ([javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)). CLI capstone — Node, CORS не мешает.

---

## Связь с курсом

- JS fetch: [javascript-basic/29-fetch.md](../javascript-basic/29-fetch.md)
- Zod: [26-zod-basics.md](26-zod-basics.md), [27-lab-zod.md](27-lab-zod.md)
- Async: [28-async-types.md](28-async-types.md)
- Lab fetch: [30-lab-fetch.md](30-lab-fetch.md)
- Стенд: [deploy/fastapi/README.md](../../deploy/fastapi/README.md)

---

## Типичные ошибки

1. **`as Item[]` сразу после json()** — главный антипаттерн.

2. **Доверять generic без schema** — `<T>` не магия.

3. **Не проверять res.ok** — parse error body как success.

4. **any в одном месте** — расползается по проекту.

5. **Двойной parse body** — clone Response если нужно дважды.

6. **Игнор ZodError в UI** — показывайте «invalid server response».

---

## Резюме

`fetch` + `json()` не даёт типов — используйте `unknown`. Narrow через Zod (предпочтительно) или type guards. Wrapper centralizes HTTP errors. Generic API без runtime schema — unsafe cast. Validate input и output для POST. Разделяйте network, HTTP и schema errors.

---

## Чек-лист

- Почему `res.json()` не даёт `Item[]`?
- Чем `unknown` лучше `any` для JSON?
- Безопасен ли `api<T>` без Zod?
- Что делать при HTTP 200 и невалидном JSON?
- Где в клиенте shop вызывать parse — один раз?

Следующий урок: [30. Лаба: fetch + Zod](30-lab-fetch.md).
