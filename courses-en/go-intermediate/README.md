# Go — Intermediate

Build a **REST shop API** in Go: Chi, layered architecture, pgx, migrations, JWT, validation, `slog`, graceful shutdown. **25 lessons** (00–24) + interview cheatsheet.

> Path: [`golang-path.md`](../golang-path.md). Prerequisite: [`go-basic`](../go-basic/README.md). Next: `go-advanced`, `go-concurrency`, `go-testing`.

**Prerequisites:** Go **1.22+**, Docker. Useful: [`postgresql-basic`](../postgresql-basic/README.md) (schema/SQL), [`api-design`](../api-design/README.md) (REST basics).

**Stand:** [`deploy/go-api`](../../deploy/go-api/README.md) — port **8099**.

```bash
cd deploy/go-api
docker compose up -d --build
bash scripts/smoke.sh   # or .\scripts\smoke.ps1
```

Lab sketches live in [`examples/`](examples/go.mod). The runnable stack is under `deploy/go-api/stack/api`.

## Philosophy

`go-intermediate` is the **first real backend course** on this track. You leave with a working API you can extend — not a 40-chapter encyclopedia.

Out of scope here (later courses): Redis, workers, Prometheus/OTel, nginx, deep concurrency, testcontainers.

## Curriculum (25 lessons)

### Phase 1. HTTP and skeleton (00–05)

| # | Lesson |
|---|--------|
| 00 | [Environment: stand, layout, Chi](00-environment.md) |
| 01 | [Landscape: net/http, Chi, Gin](01-landscape.md) |
| 02 | [Handlers, routing, Mount](02-handlers-routing.md) |
| 03 | [Lab: health and version](03-lab-health.md) |
| 04 | [Middleware: logging, request ID, recover](04-middleware.md) |
| 05 | [Lab: middleware chain](05-lab-middleware.md) |

### Phase 2. API layer (06–11)

| 06 | [DTO, JSON, validation](06-dto-validation.md) |
| 07 | [API errors and response shape](07-api-errors.md) |
| 08 | [Layers: handler → service → store](08-layered-architecture.md) |
| 09 | [Lab: in-memory CRUD](09-lab-inmemory-crud.md) |
| 10 | [Config from env](10-config-env.md) |
| 11 | [Lab: env-driven settings](11-lab-config.md) |

### Phase 3. Postgres (12–17)

| 12 | [pgx pool and context](12-pgx-pool.md) |
| 13 | [sqlc: queries and generated code](13-sqlc.md) |
| 14 | [goose migrations](14-goose-migrations.md) |
| 15 | [Lab: items in Postgres](15-lab-postgres-crud.md) |
| 16 | [Pagination, filters, sorting](16-pagination-filters.md) |
| 17 | [Lab: filtered list](17-lab-pagination.md) |

### Phase 4. Auth and reliability (18–22)

| 18 | [JWT login and protected routes](18-jwt-auth.md) |
| 19 | [Lab: auth flow](19-lab-auth.md) |
| 20 | [slog and correlation IDs](20-slog.md) |
| 21 | [Graceful shutdown and timeouts](21-graceful-shutdown.md) |
| 22 | [Lab: shutdown and timeouts](22-lab-shutdown.md) |

### Phase 5. Finish (23–24)

| 23 | [OpenAPI overview and smoke contracts](23-openapi-smoke.md) |
| 24 | [Capstone: shop API v1](24-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should be able to do

- Run `deploy/go-api` and pass smoke
- Structure code as **handler → service → store**
- Use **pgx** (+ sqlc/goose patterns from labs)
- Protect routes with **JWT**
- Ship structured logs and a clean process shutdown

## Stack choices (fixed for this course)

| Layer | Choice |
|-------|--------|
| Router | Chi |
| DB | pgx/v5 (+ sqlc in labs) |
| Migrations | goose |
| Auth | JWT (golang-jwt) |
| Logs | slog |
| Validation | go-playground/validator |

Gin/GORM are mentioned once in the landscape lesson as alternatives — we do not teach two stacks.
