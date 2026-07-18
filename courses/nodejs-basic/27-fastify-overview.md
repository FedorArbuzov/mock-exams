# 27. Fastify: обзор и сравнение с Express

## Сценарий с работы

На архитектурном review спрашивают: «Почему BFF на Express, а новый internal-gateway — на Fastify?» Lead отвечает: «Express — знаком всем, экосистема огромная. Fastify — быстрее, схемы из коробки, плагины изолированы». Вам нужно понимать оба, чтобы читать чужой код и не переписывать BFF без причины. В mock-exams **основной стек лаб — Express**; Fastify — обзор для сравнения и собеседований.

## Что вы узнаете

- Минимальное приложение Fastify
- Модель плагинов и encapsulation
- JSON Schema validation на маршрутах
- Хуки (аналог middleware) и порядок
- Когда выбрать Fastify vs Express
- Миграционные заметки для BFF shop

---

## Минимальный сервер Fastify

```javascript
// fastify-demo.mjs
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "fastify-demo" };
});

app.get("/api/v1/items/:id", async (request) => {
  return { id: request.params.id, name: "Stub" };
});

await app.listen({ port: 3096, host: "0.0.0.0" });
```

Запуск:

```bash
node fastify-demo.mjs
curl http://localhost:3096/health
```

**Отличие от Express:** handler может **return object** — Fastify сериализует в JSON. Встроенный logger (Pino) — близко к [30-logging-pino.md](30-logging-pino.md).

---

## Плагины — composable units

```javascript
import Fastify from "fastify";

async function itemsPlugin(fastify, opts) {
  fastify.get("/", async () => ({ items: [] }));
  fastify.get("/:id", async (req) => ({ id: req.params.id }));
}

const app = Fastify();
await app.register(itemsPlugin, { prefix: "/api/v1/items" });
await app.listen({ port: 3096 });
```

`register` создаёт **контекст encapsulation**: декораторы и hooks плагина не «утекают» наружу (в отличие от глобального `app.use` в Express без дисциплины).

---

## JSON Schema на маршруте

```javascript
const createItemSchema = {
  body: {
    type: "object",
    required: ["name", "price"],
    properties: {
      name: { type: "string", minLength: 1 },
      price: { type: "number", minimum: 0 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
      },
    },
  },
};

fastify.post("/", { schema: createItemSchema }, async (request, reply) => {
  const item = { id: "1", ...request.body };
  reply.code(201);
  return item;
});
```

Невалидное тело → **400** с понятным message до вашего handler. В Express то же через Zod/Joi вручную ([typescript-basic](../typescript-basic/README.md)).

---

## Хуки ≈ middleware

| Express | Fastify |
|---------|---------|
| `app.use(fn)` | `addHook('onRequest', fn)` |
| error middleware 4-arg | `setErrorHandler` |
| `next()` | async hook, throw или reply |

```javascript
fastify.addHook("onRequest", async (request, reply) => {
  request.requestId = crypto.randomUUID();
});

fastify.setErrorHandler((error, request, reply) => {
  reply.status(error.statusCode ?? 500).send({
    error: error.message,
    requestId: request.requestId,
  });
});
```

---

## Async из коробки

Rejected Promise в async route handler **перехватывается** Fastify — не нужен `asyncHandler` как в Express 4:

```javascript
fastify.get("/fail", async () => {
  throw new Error("boom"); // → setErrorHandler
});
```

---

## Производительность (почему упоминают на собесах)

Fastify оптимизирует routing и сериализацию JSON (schema-based serializer). Benchmarks на hello-world дают Fastify выше RPS, чем Express. Для BFF с **I/O-bound proxy на FastAPI** узкое место обычно **сеть и Python**, не фреймворк Node. Не переписывайте ради микробенчмарка.

---

## Экосистема

| Задача | Express | Fastify |
|--------|---------|---------|
| CORS | `cors` | `@fastify/cors` |
| Static | `express.static` | `@fastify/static` |
| Env | dotenv вручную | `@fastify/env` |
| HTTP proxy | http-proxy-middleware | `@fastify/http-proxy` |

Плагины Fastify часто с prefix `@fastify/` — официальная линейка.

---

## Когда Express в mock-exams

- Уроки 21–26 и capstone уже на Express
- Больше туториалов и ответов на Stack Overflow
- Команда знакома с `Router` + middleware

## Когда рассмотреть Fastify

- Новый high-throughput gateway **без** legacy Express
- Жёсткая schema validation на каждом route
- Встроенный Pino и structured logging с day one
- TypeScript + `@fastify/type-provider-typebox`

---

## Эквивалент shop route (сравнение)

**Express** ([21-express-routing.md](21-express-routing.md)):

```javascript
app.use("/api/v1/items", itemsRouter);
```

**Fastify:**

```javascript
await app.register(itemsRoutes, { prefix: "/api/v1/items" });
```

Смысл тот же — prefix + модуль.

---

## BFF proxy на Fastify (эскиз)

```javascript
import Fastify from "fastify";

const app = Fastify({ logger: true });
const FASTAPI = process.env.FASTAPI_URL ?? "http://localhost:8090";

app.get("/api/v1/items", async () => {
  const res = await fetch(`${FASTAPI}/api/v1/items`);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
});

await app.listen({ port: 3096 });
```

Паттерн BFF не зависит от фреймворка ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Связь с курсом

- Express блок — [21-express-routing.md](21-express-routing.md) – [26-lab-express-shop.md](26-lab-express-shop.md).
- [30-logging-pino.md](30-logging-pino.md) — Fastify использует Pino natively.
- [nodejs-intermediate](../javascript-path.md) — можно выбрать Fastify + Zod.
- [`fastapi`](../../deploy/fastapi/README.md) — validation philosophy похожа (schema first).

---

## Типичные ошибки

1. **Забыть `await app.register()`** — плагин не подключён, 404.

2. **Смешивать `reply.send` и `return`** — двойной ответ.

3. **Выбрать Fastify только из benchmark** — без команды и плагинов.

4. **Игнорировать encapsulation** — декоратор «не виден» в другом плагине — by design.

5. **Портировать Express middleware без адаптера** — нужен `@fastify/express` или переписать на hooks.

6. **Schema слишком жёсткая в dev** — мешает итерации; ослабить на раннем этапе.

---

## Резюме

Fastify — альтернатива Express с плагинами, encapsulation, JSON Schema validation и встроенным Pino. Async errors ловятся без wrapper. Для mock-exams BFF учебный путь на Express; Fastify — знать для review, новых сервисов и собесов. Выбор фреймворка вторичен относительно паттернов BFF, env, логов и proxy.

---

## Чек-лист

- Чем `fastify.register` концептуально похож на `app.use(router)`?
- Как Fastify валидирует body без ручного if?
- Нужен ли `asyncHandler` в Fastify?
- Почему Pino «родной» для Fastify?
- Когда Express разумнее для этого репозитория?
- Что return object из handler в Fastify?
- Где узкое место BFF к FastAPI — CPU Node или I/O?

Следующий урок: [28. Переменные окружения: dotenv и валидация](28-env-config.md).
