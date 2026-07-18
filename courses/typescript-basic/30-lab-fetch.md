# 30. Лаба: fetch на localhost:8090 с Zod

## Сценарий

Соберите **минимальный typed API client** к FastAPI shop: health, список товаров, один товар по id, опционально POST. Все ответы проходят Zod; ошибки HTTP и schema разделены. Это прототип слоя, который в capstone заменит файловый store на HTTP ([33-capstone.md](33-capstone.md)).

Опирается на [29-fetch-typed.md](29-fetch-typed.md), [27-lab-zod.md](27-lab-zod.md), стенд `:8090`.

## Что вы сделаете

- Client с `unknown` → parse
- Retry на flaky network (опционально)
- CLI demo: print catalog / health
- Тест на offline / invalid JSON (mock)

**Время:** ~45–60 минут.  
**Где код:** `courses/typescript-basic/examples/lab-fetch/`.

---

## Подготовка

```bash
cd deploy/fastapi && docker compose up -d --build
curl http://localhost:8090/health
```

```text
lab-fetch/
├── package.json
├── tsconfig.json
└── src/
    ├── schemas/
    ├── http.ts
    ├── shop-client.ts
    └── main.ts
```

```bash
cd courses/typescript-basic/examples/lab-fetch
npm install
npm start
```

---

## Задание 1. HTTP layer

`src/http.ts`:

```typescript
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
  }
}

export async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<unknown> {
  // network try/catch
  // res.ok check
  // return unknown from res.json()
}
```

Base URL: `http://localhost:8090`.

---

## Задание 2. Schemas

Переиспользуйте или скопируйте из [27-lab-zod.md](27-lab-zod.md):

- `ItemSchema`, `ItemListSchema`
- `HealthSchema`

---

## Задание 3. ShopClient class

```typescript
// src/shop-client.ts
export class ShopClient {
  constructor(private readonly baseUrl: string) {}

  async health(): Promise<Health> { ... }

  async listItems(): Promise<Item[]> { ... }

  async getItem(id: number): Promise<Item> {
    const json = await fetchJson(`${this.baseUrl}/api/v1/items/${id}`);
    return ItemSchema.parse(json);
  }
}
```

---

## Задание 4. main.ts CLI

```typescript
const client = new ShopClient("http://localhost:8090");

async function main() {
  const health = await client.health();
  console.log("API:", health);

  const items = await client.listItems();
  console.log(`Items: ${items.length}`);
  for (const item of items.slice(0, 10)) {
    console.log(`  ${item.id}  ${item.name}  $${item.price}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

---

## Задание 5. Обработка 404

```typescript
try {
  await client.getItem(999999);
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    console.log("Item not found");
  }
}
```

Распарсите `err.body` через `NotFoundSchema` из lab-zod.

---

## Задание 6. (Опционально) Retry

Порт [javascript-basic/28-lab-async.md](../javascript-basic/28-lab-async.md):

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 200
): Promise<T> { ... }
```

Оберните `listItems` — полезно при старте Docker.

---

## Задание 7. Mock без API

`src/mock-server.ts` или fixture JSON для CI без Docker:

```typescript
const FIXTURE_ITEMS: unknown = [ /* ... */ ];
ItemListSchema.parse(FIXTURE_ITEMS);
```

Документируйте `npm run demo:offline`.

---

## Критерии успеха

- [ ] `npm start` при живом `:8090` печатает health + items
- [ ] Нет `any` в src (eslint или ручная проверка)
- [ ] `getItem(badId)` — осмысленная ошибка, exit 1
- [ ] ZodError при подмене fixture с string price
- [ ] README с командами Docker и npm

---

## Типичные ошибки

1. **Hardcode URL без trailing slash issues** — используйте `new URL(path, base)`.

2. **Parse до проверки ok** — 404 JSON не Item.

3. **Floating promise в main** — всегда await + catch.

4. **Копипаста schema из OpenAPI без сверки** — id type mismatch.

5. **CORS confusion** — в Node CORS нет; не тратьте время на headers Origin.

---

## Связь с capstone

В [33-capstone.md](33-capstone.md) расширение B: `TaskStore` читает/пишет через HTTP вместо `tasks.json`. ShopClient из этой лабы — образец слоя `api/`.

---

## Резюме лабы

Typed fetch = HttpError + unknown json + Zod parse. Вы готовы подключить Task Tracker и shop CLI к одному FastAPI стенду, что связывает JS, TS и Python треки mock-exams.

---

## Чек-лист перед сдачей

- Где единственная точка parse для items?
- Что видит пользователь при ZodError vs HttpError?
- Работает ли offline режим?

Следующий урок: [31. Tooling и migration](31-tooling-migration.md).
