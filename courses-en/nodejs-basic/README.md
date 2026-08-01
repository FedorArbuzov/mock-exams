# Node.js — Basic

An in-depth **Node.js** course for backend and BFF work: the event loop and libuv, built-in modules, streams, HTTP from scratch, **Express** with a **Fastify** overview, middleware, env config, structured logging, and an HTTP client to [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`. **40 lessons** (00–39) plus an interview cheatsheet.

> Start of the JS track: [`javascript-path.md`](../javascript-path.md). **Prerequisite** — [`javascript-basic`](../javascript-basic/README.md) (async/await, modules, `fetch`, event loop overview); [`typescript-basic`](../typescript-basic/README.md) is recommended too. Next up — [`nodejs-intermediate`](../javascript-path.md), [`react-basic`](../react-basic/README.md).

**Prerequisites:** Node.js **LTS** (20 or 22), solid JS (Promises, `async/await`, ES modules, error handling). Basic HTTP knowledge — [`api-design`](../api-design/README.md) chapter 01 is useful here.

**Locally:** the [`examples/`](examples/package.json) directory. The FastAPI stand `:8090` is optional through chapter 20, and required starting with chapter 20 and the capstone.

```bash
cd courses/nodejs-basic/examples
npm install
npm run dev              # Express BFF on :3096 (labs 23+)
# in another terminal — FastAPI :8090 (deploy/fastapi)
curl http://localhost:3096/health
```

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheat sheet. The author works from a **real-world scenario** (a prod incident, a code review, a "the BFF is slow" ticket) toward concepts, code, and common mistakes — same approach as in [`javascript-basic`](../javascript-basic/README.md).

1. **Theory** — "Scenario from work" → explanation → examples → "Common mistakes" → "Checklist". Restate the checklist **in your own words** before the lab.
2. **Lab** — hands-on work in [`examples/`](examples/package.json): `node lab/….js`, `npm run dev`, success criteria, a "if something went wrong" table.
3. After block 37 — [`interview-cheatsheet.md`](interview-cheatsheet.md), **without peeking** back at the chapters.
4. [39-capstone.md](39-capstone.md) — **6–8 hours**, a "Shop Proxy" BFF in front of FastAPI `:8090`.

**Time:** **~50–70 minutes** per "theory + lab" pair. The whole course is **~16–20 hours**; the capstone is separate.

## Syllabus (40 lessons, 00–39)

### Phase 1. Environment and landscape (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: npm, Node project structure](00-environment.md) |
| 01 | [Landscape: Node.js, BFF, the mock-exams ecosystem](01-landscape.md) |
| 02 | [`process`: argv, env, exit codes, signals](02-process.md) |
| 03 | [Lab: CLI scripts and diagnostics](03-lab-cli.md) |

### Phase 2. Event loop and libuv (04–08)

| 04 | [The event loop in Node: libuv phases](04-event-loop-libuv.md) |
| 05 | [`process.nextTick` and `setImmediate`](05-nexttick-setimmediate.md) |
| 06 | [Lab: output order and blocking the loop](06-lab-event-loop.md) |
| 07 | [Comparison with python-async](07-python-async-comparison.md) |
| 08 | [Async I/O: callbacks, Promises, async/await](08-async-io-patterns.md) |

### Phase 3. Modules and built-in APIs (09–14)

| 09 | [CJS vs ESM in Node](09-modules-cjs-esm.md) |
| 10 | [`fs` and `path`](10-fs-path.md) |
| 11 | [Lab: reading and writing files](11-lab-fs.md) |
| 12 | [Buffers and encodings](12-buffers-encoding.md) |
| 13 | [Streams: Readable, Writable, pipeline](13-streams.md) |
| 14 | [Lab: readline and stream processing](14-lab-streams.md) |

### Phase 4. HTTP from scratch (15–20)

| 15 | [The `http` module: server and requests](15-http-module.md) |
| 16 | [Lab: a raw HTTP server](16-lab-http-server.md) |
| 17 | [URL, query strings, manual routing](17-url-routing.md) |
| 18 | [HTTP client: `fetch` and headers](18-http-client.md) |
| 19 | [Lab: a client for the local server](19-lab-http-client.md) |
| 20 | [Client for FastAPI `:8090`](20-fastapi-client.md) |

### Phase 5. Express (21–26)

| 21 | [Express: routes and `Router`](21-express-routing.md) |
| 22 | [Middleware: chain and order](22-middleware.md) |
| 23 | [Lab: basic Express](23-lab-express.md) |
| 24 | [Error handling and async handlers](24-express-errors.md) |
| 25 | [Body parser, static, CORS](25-express-body-cors.md) |
| 26 | [Lab: shop routes in Express](26-lab-express-shop.md) |

### Phase 6. Configuration and logging (27–31)

| 27 | [Fastify: overview and comparison with Express](27-fastify-overview.md) |
| 28 | [Environment variables: dotenv and validation](28-env-config.md) |
| 29 | [Lab: env configuration](29-lab-env.md) |
| 30 | [Structured logging: pino](30-logging-pino.md) |
| 31 | [Lab: request logging](31-lab-logging.md) |

### Phase 7. BFF and architecture (32–35)

| 32 | [The BFF pattern: why proxy in front of FastAPI](32-bff-pattern.md) |
| 33 | [Proxying, aggregation, timeouts](33-proxy-aggregation.md) |
| 34 | [Lab: BFF for `:8090`](34-lab-bff.md) |
| 35 | [Node project structure](35-project-structure.md) |

### Phase 8. Security, debugging, wrap-up (36–39)

| 36 | [Security: helmet, basic rate limiting](36-security-basics.md) |
| 37 | [Debugging Node: `--inspect`, breakpoints](37-debugging.md) |
| 38 | [Interview Q&A (top 35)](38-interview-qa.md) |
| 39 | [Capstone: Shop BFF](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should walk away with

- You can explain **Node's event loop** (libuv, microtasks, `nextTick`, `setImmediate`) and compare it to **asyncio**.
- You work with **`fs`**, **`path`**, **streams**, and **Buffers** without blocking the loop.
- You can stand up an **HTTP server** with `http` and with **Express**; you understand the request/response lifecycle.
- You write **middleware** (logging, an auth stub, an error handler) and know the chain order.
- You read **`process.env`**, validate config, and never commit secrets.
- You log through **pino** in JSON, not just `console.log`.
- You build an **HTTP client** for FastAPI `:8090`, handling statuses and timeouts.
- You assemble a **BFF**: proxying `/api/v1/items`, health checks, CORS for React `:5173`.
- You debug with **`node --inspect`** and know the common interview questions.

## Relation to other courses

| Course | Connection |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | the language, Promises, event loop overview |
| [`typescript-basic`](../typescript-basic/README.md) | typed routes, Zod env |
| [`python-async`](../python-async/README.md) | event loop comparison |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090` |
| [`api-design`](../api-design/README.md) | REST, statuses, errors |
| [`react-basic`](../react-basic/README.md) | a client for your BFF |
| [`nodejs-intermediate`](../javascript-path.md) | Prisma, JWT, layering |
| [`observability-basic`](../observability-basic/README.md) | metrics, traces (later) |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/package.json`](examples/package.json) | Express, pino, dotenv, scripts |
| [`examples/.env.example`](examples/.env.example) | env template for the labs |
| [`examples/lab/`](examples/lab/) | starter files for the labs |
| [`examples/src/`](examples/src/) | Express BFF (labs 23+) |
| [`examples/solutions/`](examples/solutions/) | reference solutions — check after your own attempt |
