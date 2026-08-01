# JavaScript learning path (plan)

Course plan for JavaScript / TypeScript / Node.js / React for the mock-exams repository.

**Status:** in progress — [`javascript-basic`](javascript-basic/README.md), [`typescript-basic`](typescript-basic/README.md), [`nodejs-basic`](nodejs-basic/README.md), [`react-basic`](react-basic/README.md), [`react-intermediate`](react-intermediate/README.md) and [`nextjs-basic`](nextjs-basic/README.md) are implemented; the remaining courses in the branch are in planning.

Relation to the existing backend track: [fastapi](fastapi/README.md), [django](django/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [python-testing](python-testing/README.md). Overall course map: [README.md](README.md). DevOps route: [devops-path.md](devops-path.md).

## Context

Right now the repository has a strong **DevOps + Python backend** track, but there are **no dedicated JS courses**. The proposed branch covers the frontend and Node.js and plugs into the already existing stacks:

| Stack | Port | Purpose |
|-------|------|------------|
| [deploy/fastapi](../deploy/fastapi/README.md) | 8090 | REST API for Node/React labs |
| [deploy/django](../deploy/django/README.md) | 8092 | Catalog, admin, DRF |
| [deploy/redis](../deploy/redis/README.md) | 6379 | Cache, sessions, BullMQ |
| [deploy/rabbitmq](../deploy/rabbitmq/README.md) | 5672 | Queues (analog of celery) |
| [deploy/postgres](../deploy/postgres/README.md) | 5432 | DB for a Node ORM |

## Path diagram

```text
javascript-basic  →  typescript-basic
       │                    │
       └──────────┬─────────┘
                  ▼
           nodejs-basic  →  nodejs-intermediate  →  nodejs-advanced
                  │              │                      │
                  │              ├── fastapi / django API (BFF, JWT)
                  │              ├── postgresql-developer
                  │              └── python-celery / rabbitmq (BullMQ)
                  │
                  └── react-basic  →  react-intermediate
                           │              │
                           ├── fastapi :8090, django :8092
                           └── api-design (CORS, OpenAPI client)

javascript-testing  —  after react-basic or nodejs-basic
javascript-algorithms  —  in parallel (frontend interviews)
```

## Core (must-have)

| Course | Level | Hours | Description |
|------|---------|------|----------|
| `javascript-basic` | Junior | ~12–16 | Types, scope, closures, `this`, prototypes, Promises/async, modules, `fetch`, error handling. Without frameworks — "like linux-basic for JS". |
| `typescript-basic` | Junior+ | ~10–14 | Types, union/intersection, generics, `strict`, tsconfig, Zod. Practically mandatory for the other courses. |
| `nodejs-basic` | Middle | ~14–18 | Event loop (comparison with [python-async](python-async/README.md)), Express/Fastify, middleware, env, HTTP client to FastAPI. Stack `deploy/nodejs` → proxy to :8090. |
| `nodejs-intermediate` | Middle+ | ~18–24 | Layers as in fastapi: routes, DI, Prisma/Drizzle + Postgres, JWT, validation, project structure, tests. |
| `nodejs-advanced` | Senior | ~18–24 | BullMQ (analog of [python-celery](python-celery/README.md)), Redis cache, observability (Prometheus), rate limit, graceful shutdown, Docker/nginx. |

**Strong tie to the ecosystem:** the Node courses are a mirror of [fastapi](fastapi/README.md) in JS; the React courses are a client to the same APIs.

## Frontend

| Course | Level | Hours | Description |
|------|---------|------|----------|
| `react-basic` | Middle | ~14–18 | Components, hooks, state, forms, React Router, `fetch` + TanStack Query to `deploy/fastapi`. |
| `react-intermediate` | Middle+ | ~16–20 | Auth flow (JWT refresh), error boundaries, performance, code splitting, MSW for API mocks. |
| [`nextjs-basic`](nextjs-basic/README.md) | Middle+ | ~20–24 | App Router, SSR/SSG, Route Handlers, Server Actions, deployment in Docker. A fullstack branch alongside [django](django/README.md). |

**Capstone:** a catalog admin panel for `deploy/django` (:8092) — it complements the django lessons about a landing page without React.

## Specializations

| Course | Hours | Description |
|------|------|----------|
| `javascript-testing` | ~14–18 | Vitest, Testing Library, MSW, Playwright e2e against fastapi. Analog of [python-testing](python-testing/README.md). |
| `javascript-algorithms` | ~30–40 | Two pointers, sliding window, trees, graphs in JS for frontend interviews. Analog of [python-algorithms](python-algorithms/README.md). |
| `browser-platform` | ~10–14 | Event loop in the browser, rendering, CORS/cookies, storage, security (XSS/CSRF). Complements [api-design](api-design/README.md) from the client side. |
| `websockets-frontend` | ~6–8 | A client to [fastapi/25-websockets-sse](fastapi/25-websockets-sse.md): reconnect, backoff, SSE vs WebSocket. |

## Theory (no stack)

| Course | Hours | Description |
|------|------|----------|
| `frontend-architecture` | ~12–16 | SPA vs SSR, BFF, state management, micro-frontends. Alongside [microservices-patterns](microservices-patterns/README.md). |
| `frontend-interviews` | ~12–16 | UI system design, behavioral + technical. Alongside [behavioral-interviews](behavioral-interviews/README.md). |

## Recommended rollout order

| Stage | Course | Why |
|------|------|-------|
| 1 | `javascript-basic` + `typescript-basic` | Foundation; little infrastructure (Node on the host). |
| 2 | `nodejs-basic` + stack `deploy/nodejs` | BFF to FastAPI; the tie to the backend track is immediately visible. |
| 3 | `react-basic` | UI to the same API; an end-to-end "shop" project like the Python branch. |
| 4 | `nodejs-intermediate`, `react-intermediate` | A deeper dive after the core. |
| 5 | `javascript-testing` | After react-basic or nodejs-basic. |
| 6 | `nodejs-advanced`, `nextjs-basic`, `javascript-algorithms` | After a working core and the deploy stacks. |

## New stacks (`deploy/`)

| Stack | Port | Integration |
|-------|------|------------|
| `deploy/nodejs` | ~8096 | BFF → fastapi :8090 |
| `deploy/react` | ~8097 | Vite SPA → fastapi / django |
| `deploy/nextjs` | ~8098 | Optional, later |

Reused: [deploy/postgres](../deploy/postgres/README.md), [deploy/redis](../deploy/redis/README.md), [deploy/rabbitmq](../deploy/rabbitmq/README.md), [deploy/nginx](../deploy/nginx/README.md), [gitlab-*](gitlab-basic/README.md) for CI.

## Environment requirements (draft)

| Course | What's needed |
|------|-----------|
| `javascript-basic`, `typescript-basic` | Node.js LTS on the host; optionally `nvm` |
| `nodejs-*` | `deploy/nodejs` + [deploy/fastapi](../deploy/fastapi/README.md); intermediate+ — postgres |
| `react-*` | `deploy/react` + backend API (:8090 or :8092) |
| `javascript-testing` | Vitest/Playwright in examples; integration — the fastapi or nodejs stack |
| `javascript-algorithms` | Node + examples/ (analogous to python-algorithms) |
| `browser-platform`, `frontend-architecture`, `frontend-interviews` | Reading only |

## Relation to the Python route

```text
containers-basic + postgresql-basic
       │
       ├── fastapi (:8090)  ←── nodejs-basic (BFF), react-basic (client)
       ├── django (:8092)   ←── react-intermediate (admin panel)
       ├── python-async     ←── nodejs-basic (event loop comparison)
       ├── python-celery    ←── nodejs-advanced (BullMQ)
       ├── api-design       ←── react-basic, browser-platform
       └── python-testing   ←── javascript-testing (parallel branch)
```

## Course format

As in [fastapi](fastapi/README.md):

1. **Theory** — a work scenario → concepts → code → common mistakes.
2. **Lab** — a `deploy/*` stack or local Node.
3. **Capstone** + `interview-cheatsheet.md` at the end of the track.
4. **~50–70 minutes** per "theory + lab" pair.

## PDF group

Add a `javascript` group to `scripts/build-courses-pdf.py` (after the courses are implemented):

```python
"javascript": (
    "javascript-basic",
    "typescript-basic",
    "nodejs-basic",
    "nodejs-intermediate",
    "nodejs-advanced",
    "react-basic",
    "react-intermediate",
    "javascript-testing",
    "javascript-algorithms",
),
```

Theory courses (`browser-platform`, `frontend-architecture`, `frontend-interviews`) — in the `theory` group.
