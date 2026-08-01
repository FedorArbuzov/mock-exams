# 27. Fastify: overview and comparison with Express

## A scenario from work

At an architecture review someone asks: "Why is the BFF on Express while the new internal gateway is on Fastify?" The lead answers: "Express is familiar to everyone and has a huge ecosystem. Fastify is faster, ships with schema validation out of the box, and its plugins are isolated." You need to understand both, so you can read someone else's code without rewriting a BFF for no good reason. In mock-exams **the main lab stack is Express**; Fastify is here as a comparison and for interviews.

## What you'll learn

- A minimal Fastify application
- The plugin model and encapsulation
- JSON Schema validation on routes
- Hooks (the middleware equivalent) and their order
- When to choose Fastify vs Express
- Migration notes for the BFF shop

---

## A minimal Fastify server

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

Run it:

```bash
node fastify-demo.mjs
curl http://localhost:3096/health
```

**Difference from Express:** a handler can **return an object** — Fastify serializes it to JSON. The built-in logger (Pino) is covered closer in [30-logging-pino.md](30-logging-pino.md).

---

## Plugins — composable units

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

`register` creates an **encapsulation context**: the plugin's decorators and hooks don't "leak" outward (unlike a global `app.use` in Express without discipline).

---

## JSON Schema on a route

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

An invalid body → **400** with a clear message, before your handler even runs. In Express you'd get the same thing manually via Zod/Joi ([typescript-basic](../typescript-basic/README.md)).

---

## Hooks ≈ middleware

| Express | Fastify |
|---------|---------|
| `app.use(fn)` | `addHook('onRequest', fn)` |
| 4-arg error middleware | `setErrorHandler` |
| `next()` | async hook, throw or reply |

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

## Async out of the box

A rejected promise in an async route handler is **caught** by Fastify — you don't need an `asyncHandler` wrapper like in Express 4:

```javascript
fastify.get("/fail", async () => {
  throw new Error("boom"); // → setErrorHandler
});
```

---

## Performance (why it comes up in interviews)

Fastify optimizes routing and JSON serialization (schema-based serializer). Hello-world benchmarks show Fastify with higher RPS than Express. For a BFF with an **I/O-bound proxy to FastAPI**, the bottleneck is usually the **network and Python**, not the Node framework. Don't rewrite for the sake of a microbenchmark.

---

## Ecosystem

| Task | Express | Fastify |
|--------|---------|---------|
| CORS | `cors` | `@fastify/cors` |
| Static | `express.static` | `@fastify/static` |
| Env | dotenv by hand | `@fastify/env` |
| HTTP proxy | http-proxy-middleware | `@fastify/http-proxy` |

Fastify plugins often carry the `@fastify/` prefix — the official lineup.

---

## When Express makes sense in mock-exams

- Lessons 21–26 and the capstone are already on Express
- More tutorials and Stack Overflow answers exist for it
- The team already knows `Router` + middleware

## When to consider Fastify

- A new high-throughput gateway with **no** legacy Express
- Strict schema validation required on every route
- Built-in Pino and structured logging from day one
- TypeScript + `@fastify/type-provider-typebox`

---

## Equivalent shop route (comparison)

**Express** ([21-express-routing.md](21-express-routing.md)):

```javascript
app.use("/api/v1/items", itemsRouter);
```

**Fastify:**

```javascript
await app.register(itemsRoutes, { prefix: "/api/v1/items" });
```

Same idea — prefix plus a module.

---

## BFF proxy on Fastify (sketch)

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

The BFF pattern doesn't depend on the framework ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Ties to the course

- The Express block — [21-express-routing.md](21-express-routing.md) through [26-lab-express-shop.md](26-lab-express-shop.md).
- [30-logging-pino.md](30-logging-pino.md) — Fastify uses Pino natively.
- [nodejs-intermediate](../javascript-path.md) — you can choose Fastify + Zod there.
- [`fastapi`](../../deploy/fastapi/README.md) — a similar validation philosophy (schema first).

---

## Common mistakes

1. **Forgetting `await app.register()`** — the plugin isn't wired up, you get a 404.

2. **Mixing `reply.send` and `return`** — a double response.

3. **Choosing Fastify purely from a benchmark** — without the team or plugins to back it up.

4. **Ignoring encapsulation** — a decorator "isn't visible" in another plugin — that's by design.

5. **Porting Express middleware without an adapter** — you need `@fastify/express` or a rewrite as hooks.

6. **Schema too strict in dev** — it gets in the way of iteration; loosen it early on.

---

## Summary

Fastify is an alternative to Express with plugins, encapsulation, JSON Schema validation, and built-in Pino. Async errors are caught without a wrapper. For mock-exams the BFF learning path stays on Express; Fastify is worth knowing for reviews, new services, and interviews. The framework choice is secondary to the BFF, env, logging, and proxy patterns themselves.

---

## Checklist

- How is `fastify.register` conceptually similar to `app.use(router)`?
- How does Fastify validate the body without a manual if-check?
- Do you need `asyncHandler` in Fastify?
- Why is Pino "native" to Fastify?
- When does Express make more sense for this repo?
- What happens when a handler returns an object in Fastify?
- Where's the BFF-to-FastAPI bottleneck — Node CPU or I/O?

Next lesson: [28. Environment variables: dotenv and validation](28-env-config.md).
