# Go learning path (plan)

Go (Golang) course plan for the mock-exams repository.

**Status:** [`go-basic`](go-basic/README.md) (**11 lessons**) and [`go-intermediate`](go-intermediate/README.md) (**25 lessons** + [`deploy/go-api`](../deploy/go-api/README.md) `:8099`) are implemented; the rest are in planning.

Relation to existing tracks: [fastapi](fastapi/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [microservices-patterns](microservices-patterns/README.md), [kuber-intermediate](kuber-intermediate/README.md). Overall course map: [README.md](README.md). DevOps route: [devops-path.md](devops-path.md). JavaScript branch: [javascript-path.md](javascript-path.md).

## Context

The repository has a strong **DevOps + Python backend** track; there are **no dedicated Go courses**. Go is a natural addition:

- **backend API** — a mirror of [fastapi](fastapi/README.md) (Chi/Gin, pgx, JWT, OpenAPI);
- **concurrency** — a mirror of [python-async](python-async/README.md) (goroutines, channels, `context`);
- **cloud-native** — client-go, controllers, operators after [kuber-intermediate](kuber-intermediate/README.md);
- **gRPC** — internal services from [api-design](api-design/README.md) and [microservices-patterns](microservices-patterns/05-sync-communication.md);
- **CLI** — cobra/urfave for utilities alongside [linux-shell](linux-shell/README.md) and GitLab CI.

| Stack | Port | Purpose |
|-------|------|------------|
| [`deploy/go-api`](../deploy/go-api/README.md) | 8099 | REST API "shop" in Go |
| [deploy/fastapi](../deploy/fastapi/README.md) | 8090 | Contract comparison, contract tests |
| [deploy/postgres](../deploy/postgres/README.md) | 5432 | pgx, sqlc, migrations |
| [deploy/redis](../deploy/redis/README.md) | 6379 | Cache, asynq, rate limit |
| [deploy/rabbitmq](../deploy/rabbitmq/README.md) | 5672 | Queues (analog of [python-celery](python-celery/README.md)) |
| `mockctl` + cluster | — | client-go, deployment, observability |

## Path diagram

```text
go-basic  →  go-intermediate  →  go-advanced
    │              │                    │
    │              ├── fastapi :8090 (contract, stack comparison)
    │              ├── postgresql-developer, sqlc / goose
    │              ├── api-design, OpenAPI
    │              └── observability-basic (Prometheus)
    │
    ├── go-concurrency (spec., after basic or in parallel with intermediate)
    │         │
    │         └── python-async (comparison of concurrency models)
    │
    ├── go-testing (spec., after intermediate)
    ├── go-algorithms (in parallel, interviews)
    │
    └── kuber-intermediate  →  go-cloud-native
              │                      │
              └── gitops-*           client-go, informers, operator-lite

go-cli (spec., after basic)  —  cobra, flags, CI utilities
grpc-go (spec. or go-advanced phase)  —  protobuf, streaming
```

## Core (must-have)

| Course | Level | Hours | Description |
|------|---------|------|----------|
| `go-basic` | Junior | ~6–8 | Fast on-ramp: toolchain, types, structs, interfaces, errors, packages, `go test`, JSON/files, mini-CLI. No web framework — bridge straight to `go-intermediate`. |
| `go-intermediate` | Middle | ~20–24 | Chi, middleware, env config, layered architecture, pgx + sqlc, goose, JWT, validation, `slog`, graceful shutdown. Stand [`deploy/go-api`](../deploy/go-api/README.md) `:8099`. |
| `go-advanced` | Middle+ | ~22–30 | Redis cache-aside, asynq/river workers, rate limit, health/readiness, Prometheus metrics, OpenTelemetry, multi-stage Docker, nginx, security checklist. Capstone — a production-ready API. |

**Strong tie to the ecosystem:** the Go API covers the same "shop" domain as [fastapi](fastapi/README.md) and [django](django/README.md); contracts are verified via [api-design/32](../fastapi/32-contract-tests.md) and OpenAPI.

## Specializations

| Course | Hours | Description |
|------|------|----------|
| `go-concurrency` | ~16–22 | Goroutines, channels, `select`, `sync`, worker pools, `context` (cancel, deadline, values), errgroup, race detector, patterns vs [python-async](python-async/README.md). The Go analog of `python-async`. |
| `go-testing` | ~14–18 | Table-driven tests, testify, mocks (`gomock`/`mockery`), httptest, testcontainers (Postgres/Redis), benchmarks, `-race`, coverage, CI. Analog of [python-testing](python-testing/README.md). |
| `go-algorithms` | ~30–40 | LeetCode patterns in Go: slices, maps, heap, trees, graphs, DP. Analog of [python-algorithms](python-algorithms/README.md). |
| `go-cloud-native` | ~18–24 | client-go, RESTConfig, typed clients, informers, leader election, controller-runtime (overview), health probes in a Pod, deployment to `mockctl`. After [kuber-intermediate](kuber-intermediate/README.md). |
| `go-cli` | ~8–12 | `flag`, cobra, subcommands, stdin/stdout, exit codes, cross-compile, goreleaser. For DevOps utilities and CI. |
| `grpc-go` | ~10–14 | protobuf, buf, unary/streaming RPC, metadata, interceptors, REST gateway (grpc-gateway). Relation to [microservices-patterns/05](microservices-patterns/05-sync-communication.md). |

## Theory (no stack or with a minimal lab)

| Course | Hours | Description |
|------|------|----------|
| `go-internals` | ~12–16 | Memory model, escape analysis, GC, scheduler (GMP), interface internals, when not to use Go. Analog of [python-deep-dive](python-deep-dive/README.md). |
| `go-interviews` | ~12–16 | System design in Go, typical questions (interfaces, channels, context), mock coding. Alongside [behavioral-interviews](behavioral-interviews/README.md). |

## Recommended rollout order

| Stage | Course | Why |
|------|------|-------|
| 1 | `go-basic` | Foundation; only the Go toolchain on the host. |
| 2 | `go-intermediate` + `deploy/go-api` | REST API "shop"; immediate tie to fastapi and api-design. |
| 3 | `go-concurrency` | Key Go competency; comparison with python-async. |
| 4 | `go-testing` | Reinforces intermediate; CI in gitlab-basic. |
| 5 | `go-advanced` | Redis, workers, observability, capstone. |
| 6 | `go-cloud-native` | After kuber-intermediate; client-go in the cluster. |
| 7 | `grpc-go`, `go-cli`, `go-algorithms`, `go-internals` | By goal: microservices, DevOps CLI, interviews, language depth. |

## New stacks (`deploy/`)

| Stack | Port | Integration |
|-------|------|------------|
| `deploy/go-api` | ~8099 | Postgres + Redis in compose; the same schema/contract as fastapi |
| `deploy/go-grpc` *(optional)* | ~8100 | gRPC service + grpc-gateway HTTP; calls from fastapi/nodejs |

Reused: [deploy/postgres](../deploy/postgres/README.md), [deploy/redis](../deploy/redis/README.md), [deploy/rabbitmq](../deploy/rabbitmq/README.md), [deploy/nginx](../deploy/nginx/README.md), [deploy/observability](../deploy/observability/README.md), [gitlab-*](gitlab-basic/README.md) for CI, `mockctl` for cloud-native labs.

## Environment requirements (draft)

| Course | What's needed |
|------|-----------|
| `go-basic` | Go 1.22+ on the host; `go mod`, an IDE with gopls |
| `go-intermediate`, `go-advanced` | `deploy/go-api`; Docker; postgres/redis from compose |
| `go-concurrency` | Go on the host; optionally `deploy/go-api` for HTTP labs |
| `go-testing` | Go + Docker (testcontainers); examples/ analogous to python-testing |
| `go-algorithms` | Go + examples/ + `go test` |
| `go-cloud-native` | `mockctl up`, kubectl; the go-api image in the cluster |
| `go-cli`, `grpc-go` | Go toolchain; grpc — Docker for dependencies |
| `go-internals`, `go-interviews` | Reading only + local examples |

## Relation to the Python and DevOps routes

```text
containers-basic + postgresql-basic
       │
       ├── fastapi (:8090)     ←── go-intermediate (the same API contract)
       ├── python-async        ←── go-concurrency (model comparison)
       ├── python-celery       ←── go-advanced (asynq / river)
       ├── python-testing      ←── go-testing (parallel branch)
       ├── python-algorithms   ←── go-algorithms
       ├── api-design          ←── go-intermediate, grpc-go
       ├── microservices-patterns ←── grpc-go, go-advanced
       └── observability-*     ←── go-advanced (OTel, metrics)

kuber-intermediate
       │
       ├── kuber-advanced      ←── go-cloud-native (operators, client-go)
       └── gitops-*            ←── deploying go-api via Argo
```

## Stack comparison (for the "landscape" lessons)

| Topic | Python (mock-exams) | Go (plan) |
|------|---------------------|-----------|
| Web framework | FastAPI / Django | Chi / Gin |
| ORM / SQL | SQLAlchemy / Django ORM | pgx + sqlc / GORM |
| Async | asyncio | goroutines + channels |
| Queues | Celery | asynq / river |
| Tests | pytest | `testing` + testify |
| AWS SDK | boto3 ([python-aws](python-aws/README.md)) | aws-sdk-go-v2 *(a separate course — optional)* |
| K8s | kubectl, Helm | client-go, controller-runtime |

Optional later: `go-aws` — a mirror of [python-aws](python-aws/README.md) on aws-sdk-go-v2 + LocalStack.

## Course format

As in [fastapi](fastapi/README.md):

1. **Theory** — a work scenario → concepts → code → common mistakes.
2. **Lab** — a `deploy/*` stack or `go run` / `go test` on the host.
3. **Capstone** + `interview-cheatsheet.md` at the end of the track.
4. **~50–70 minutes** per "theory + lab" pair.

Recommended core size: **~36–42 lessons** for `go-intermediate` + `go-advanced` (like fastapi/django), **~10–12** for `go-basic` (fast ramp), **~28–36** for `go-concurrency`.

## PDF group

The `golang` group in `scripts/build-courses-pdf.py` (as the courses are implemented):

```python
"golang": (
    "go-basic",
    "go-intermediate",
    "go-advanced",
    "go-concurrency",
    "go-testing",
    "go-algorithms",
    "go-cloud-native",
    "go-cli",
    "grpc-go",
),
```

Implemented today: `go-basic`, `go-intermediate`. Add the rest to the PDF script as those courses land.
