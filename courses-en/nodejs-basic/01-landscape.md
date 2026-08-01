# 01. Landscape: Node.js, BFF, and the mock-exams ecosystem

## Introduction: a scenario from work

Sprint planning. Product says: "A React storefront for the shop, catalog and cart — just like the Python demo." The architect sketches a diagram: browser → **Node BFF** → **FastAPI** `:8090` → Postgres. A junior asks, "Why Node, if the API already exists?" DevOps chimes in: "Nginx on `:3096`, CORS for the frontend, JWT refresh — all of it lives in the BFF." In a side chat, someone suggests **Deno** "because no node_modules," and someone else pushes **Bun** "because it's faster than npm."

Without a map of the landscape, you'll mix up the **V8 engine**, the **Node.js runtime**, the **HTTP framework** (Express/Fastify), and the **role of the BFF** in the mock-exams shop domain. In [`javascript-basic`](../javascript-basic/01-landscape.md) you already learned to tell ECMAScript apart from the runtime environment. Here it's the **server-side** picture: a single Node process serves many HTTP requests through the event loop, while FastAPI on Python handles business logic and the database.

## What you'll learn

- What **Node.js** is as a runtime (V8 + libuv + built-in modules).
- The role of the **BFF** (Backend for Frontend) between React and FastAPI.
- The **shop** domain in mock-exams and the ports its stands use.
- An overview of **Express** and **Fastify** — no deep API dive yet (chapters 21–27).
- Where **Deno** and **Bun** sit on the map — alternatives, not the focus of this course.
- The connection to [`typescript-basic`](../typescript-basic/README.md), [`react-basic`](../react-basic/README.md), and [`python-async`](../python-async/README.md).

---

## Node.js as a runtime

**Node.js** is neither a language nor a framework. It's a **JavaScript runtime** outside the browser:

```text
Your code (.js / .ts after compilation)
        │
        ▼
   V8 (parsing, JIT, GC) — the same engine that powers Chrome
        │
        ▼
   libuv (event loop, thread pool, async I/O)
        │
        ▼
   Built-in modules: http, fs, crypto, process, …
        │
        ▼
   npm packages: express, pino, …
```

| Component | Job |
|-----------|--------|
| **V8** | Runs your JavaScript, a single-threaded call stack for your code |
| **libuv** | Event loop, timers, network I/O, some file operations |
| **Node bindings** | The JS ↔ C++ bridge (fs, http, crypto) |
| **npm** | The library ecosystem |

The JavaScript syntax is the same as in [`javascript-basic`](../javascript-basic/README.md). What's different are the **global APIs**: `process`, `node:fs`, `node:http`, no `document`, and no "server-side CORS" (CORS is something the BFF configures for the browser — [`api-design`](../api-design/README.md)).

```javascript
// server.js — a minimal illustration (covered in depth in chapters 15–21)
import { createServer } from "node:http";

createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "nodejs-basic-bff", ok: true }));
}).listen(3096, () => {
  console.log("BFF listening on :3096");
});
```

---

## BFF: why a layer between React and FastAPI

A **BFF** adapts the backend to the needs of a **specific client** (an SPA, a mobile app):

| Without a BFF | With a BFF |
|---------|-------|
| React has to know every FastAPI URL, version, and aggregation | React talks to a single origin (`localhost:3096`) |
| CORS and cookies get messier on the Python API | The BFF exposes CORS for `:5173` |
| Multiple frontend requests for a single screen | The BFF aggregates `/api/v1/items` + `/api/v1/cart` |
| JWT refresh on the client | Refresh cookie, httpOnly, handled by the BFF |

The typical chain in mock-exams:

```text
Browser (React :5173)
    │  fetch /api/shop/items
    ▼
Node BFF (:3096 / deploy/nodejs :8096)
    │  proxy + transform + auth stub
    ▼
FastAPI shop API (:8090)
    │  SQLAlchemy, Pydantic
    ▼
Postgres (:5432)
```

The Python track: [`deploy/fastapi`](../../deploy/fastapi/README.md). This Node course doesn't replace FastAPI — it **complements** the frontend branch. For a comparison of the async models, see [07-python-async-comparison.md](07-python-async-comparison.md).

---

## The shop domain and API contracts

A shared teaching domain, **shop** (products, cart, orders), ties the courses together:

| Resource | FastAPI example | BFF's job |
|--------|----------------|------------|
| Catalog | `GET /api/v1/items` | Proxy, cache (later) |
| Product | `GET /api/v1/items/{id}` | Proxy |
| Health | `GET /health` | BFF + upstream aggregation |

A simplified catalog JSON (same as in javascript-basic's [01-landscape](../javascript-basic/01-landscape.md)):

```json
{
  "items": [
    { "id": 1, "title": "Keyboard", "price": 79.99 }
  ],
  "total": 1
}
```

The BFF can add fields for the UI (price formatting, locale) without touching the Python service — the topic of [33-proxy-aggregation.md](33-proxy-aggregation.md). REST conventions live in [`api-design`](../api-design/README.md).

---

## Express and Fastify: a framework overview

This course does **not** start with Express in week one — first comes `process`, the event loop, and `http` from scratch. But you need the lay of the land early:

| | **Express** | **Fastify** |
|---|-------------|-------------|
| Style | minimalist, middleware chain | schemas, hooks, faster out of the box |
| Ecosystem | huge, tons of tutorials | growing, plugin-based |
| In mock-exams | the main framework for labs 21–26 | overview in [27-fastify-overview.md](27-fastify-overview.md) |
| Python parallel | Flask-like | closer to FastAPI (validation, schema) |

An Express example (preview):

```javascript
import express from "express";

const app = express();
app.get("/health", (_req, res) => {
  res.json({ status: "ok", layer: "bff" });
});
// app.listen(3096);
```

A Fastify example (preview):

```javascript
import Fastify from "fastify";

const app = Fastify();
app.get("/health", async () => ({ status: "ok", layer: "bff" }));
// await app.listen({ port: 3096 });
```

The production choice is covered in [`nodejs-intermediate`](../javascript-path.md); for now it's enough to know that **both** sit on the same Node HTTP server and event loop.

---

## Deno and Bun: alternatives on the map

| Runtime | Idea | In this course |
|---------|------|----------|
| **Deno** | TypeScript out of the box, security permissions, no node_modules by default | mentioned |
| **Bun** | JS runtime + bundler + npm compatibility, focused on speed | mentioned |
| **Node.js** | the de facto standard, used in the mock-exams deploy, the most material available | **the focus** |

The shop BFF code in the repo and in CI targets **Node LTS**. Skills transfer: the event loop, HTTP, and async I/O are conceptually shared; module APIs (`node:fs` vs `Deno.readFile`) differ.

---

## Where this course sits in javascript-path

```text
javascript-basic  →  typescript-basic (recommended)
       │
       ▼
nodejs-basic  ←── you are here (phase 1: environment, process, event loop)
       │
       ├── nodejs-intermediate (Prisma, JWT, layering)
       ├── react-basic (UI for the BFF)
       └── python-async (a parallel comparison with asyncio)
```

**Prerequisites:** Promises, `async`/`await`, ES modules, the event loop overview from javascript-basic 24–30. **Useful alongside this course:** the REST and status-code chapter in [`api-design`](../api-design/README.md).

---

## Single-threadedness and scaling (overview)

Node handles many **concurrent** connections, but **your JS** runs on a single thread per process. I/O doesn't block the loop; a CPU-bound loop blocks every client of that process. Scaling in production means:

- multiple **worker processes** (cluster, PM2, Kubernetes replicas);
- **worker_threads** for heavy computation;
- queues (BullMQ, in [`nodejs-advanced`](../javascript-path.md)) — the equivalent of Celery.

Details in [04-event-loop-libuv.md](04-event-loop-libuv.md) and [06-lab-event-loop.md](06-lab-event-loop.md).

---

## Common mistakes

**"Node = Express."** Express is a library; Node works fine without it (`node:http`). This confusion gets in the way of understanding middleware and the request lifecycle.

**"The BFF duplicates all the business logic."** The BFF does **not** replace FastAPI; it adapts the protocol, auth, and aggregation. Duplicating pricing rules across two languages is an anti-pattern.

**"Let's write the BFF in Deno for the training repo."** You'll lose compatibility with the mock-exams examples and CI. Save experiments for pet projects.

**Ignoring `:8090`.** A BFF with no upstream is just an empty proxy. Bring up the FastAPI stand before chapters 20 and 34.

**Mixing up ports.** `:8090` is FastAPI; `:3096` (or `:8096` in deploy) is the Node BFF; `:5173` is Vite/React. Write the commands down in your README.

---

## Summary

Node.js is a **runtime** (V8 + libuv) for server-side JS, npm, and HTTP. In mock-exams, Node plays the **BFF** role in front of the FastAPI shop API on **8090**, preparing data for **React**. Express is the course's primary framework; Fastify is a fast alternative covered later. Deno/Bun are on the map but not the focus. Next up: `process`, CLI labs, and a deep dive into the event loop.

## Checklist

- [ ] Explain the difference between **V8**, **Node.js**, and **Express** in one sentence each
- [ ] Draw the chain Browser → BFF → FastAPI → Postgres
- [ ] Know the FastAPI port (**8090**) and the future BFF port (**3096**)
- [ ] Understand why you need a BFF instead of `fetch`-ing directly from React to `:8090`
- [ ] Name the course's two HTTP frameworks and one runtime alternative
- [ ] Connect nodejs-basic to javascript-basic and python-async

Next lesson: [02. The process object](02-process.md).
