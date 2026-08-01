# Go learning path (план)

План курсов по Go (Golang) для репозитория mock-exams.

**Статус:** [`go-basic`](go-basic/README.md) реализован (**11 уроков**, быстрый вход ~6–8 ч); остальные курсы — в планировании.

Связь с существующими треками: [fastapi](fastapi/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [microservices-patterns](microservices-patterns/README.md), [kuber-intermediate](kuber-intermediate/README.md). Общая карта курсов: [README.md](README.md). DevOps-маршрут: [devops-path.md](devops-path.md). JavaScript-ветка: [javascript-path.md](javascript-path.md).

## Контекст

В репозитории сильный **DevOps + Python backend** трек; **отдельных Go-курсов нет**. Go — естественное дополнение:

- **backend API** — зеркало [fastapi](fastapi/README.md) (Chi/Gin, pgx, JWT, OpenAPI);
- **concurrency** — зеркало [python-async](python-async/README.md) (goroutines, channels, `context`);
- **cloud-native** — client-go, контроллеры, операторы после [kuber-intermediate](kuber-intermediate/README.md);
- **gRPC** — внутренние сервисы из [api-design](api-design/README.md) и [microservices-patterns](microservices-patterns/05-sync-communication.md);
- **CLI** — cobra/urfave для утилит рядом с [linux-shell](linux-shell/README.md) и GitLab CI.

| Стенд | Порт | Назначение |
|-------|------|------------|
| `deploy/go-api` *(план)* | ~8099 | REST API «shop» на Go |
| [deploy/fastapi](../deploy/fastapi/README.md) | 8090 | Сравнение контрактов, contract tests |
| [deploy/postgres](../deploy/postgres/README.md) | 5432 | pgx, sqlc, миграции |
| [deploy/redis](../deploy/redis/README.md) | 6379 | Кэш, asynq, rate limit |
| [deploy/rabbitmq](../deploy/rabbitmq/README.md) | 5672 | Очереди (аналог [python-celery](python-celery/README.md)) |
| `mockctl` + кластер | — | client-go, деплой, observability |

## Схема маршрута

```text
go-basic  →  go-intermediate  →  go-advanced
    │              │                    │
    │              ├── fastapi :8090 (контракт, сравнение стеков)
    │              ├── postgresql-developer, sqlc / goose
    │              ├── api-design, OpenAPI
    │              └── observability-basic (Prometheus)
    │
    ├── go-concurrency (спец., после basic или параллельно intermediate)
    │         │
    │         └── python-async (сравнение моделей concurrency)
    │
    ├── go-testing (спец., после intermediate)
    ├── go-algorithms (параллельно, собесы)
    │
    └── kuber-intermediate  →  go-cloud-native
              │                      │
              └── gitops-*           client-go, informers, operator-lite

go-cli (спец., после basic)  —  cobra, флаги, CI-утилиты
grpc-go (спец. или фаза go-advanced)  —  protobuf, streaming
```

## Ядро (must-have)

| Курс | Уровень | Часы | Описание |
|------|---------|------|----------|
| `go-basic` | Junior | ~6–8 | Быстрый вход: toolchain, типы, structs, interfaces, errors, пакеты, `go test`, JSON/файлы, мини-CLI. Без веб-фреймворка — сразу мост к `go-intermediate`. |
| `go-intermediate` | Middle | ~20–28 | Chi или Gin, middleware, конфиг (`env`, viper), слоистая архитектура, pgx + sqlc или GORM, миграции (goose/atlas), JWT, валидация, structured logging (`slog`), graceful shutdown. Стенд `deploy/go-api`. |
| `go-advanced` | Middle+ | ~22–30 | Redis cache-aside, asynq/river workers, rate limit, health/readiness, Prometheus metrics, OpenTelemetry, multi-stage Docker, nginx, security checklist. Capstone — production-ready API. |

**Сильная связка с экосистемой:** Go API — тот же домен «shop», что у [fastapi](fastapi/README.md) и [django](django/README.md); контракты сверяются через [api-design/32](../fastapi/32-contract-tests.md) и OpenAPI.

## Специализации

| Курс | Часы | Описание |
|------|------|----------|
| `go-concurrency` | ~16–22 | Goroutines, channels, `select`, `sync`, worker pools, `context` (cancel, deadline, values), errgroup, race detector, patterns vs [python-async](python-async/README.md). Аналог `python-async` для Go. |
| `go-testing` | ~14–18 | Table-driven tests, testify, mocks (`gomock`/`mockery`), httptest, testcontainers (Postgres/Redis), benchmarks, `-race`, coverage, CI. Аналог [python-testing](python-testing/README.md). |
| `go-algorithms` | ~30–40 | Паттерны LeetCode на Go: slices, maps, heap, trees, graphs, DP. Аналог [python-algorithms](python-algorithms/README.md). |
| `go-cloud-native` | ~18–24 | client-go, RESTConfig, typed clients, informers, leader election, controller-runtime (обзор), health probes в Pod, деплой в `mockctl`. После [kuber-intermediate](kuber-intermediate/README.md). |
| `go-cli` | ~8–12 | `flag`, cobra, subcommands, stdin/stdout, exit codes, cross-compile, goreleaser. Для DevOps-утилит и CI. |
| `grpc-go` | ~10–14 | protobuf, buf, unary/streaming RPC, metadata, interceptors, REST gateway (grpc-gateway). Связь с [microservices-patterns/05](microservices-patterns/05-sync-communication.md). |

## Теория (без стенда или с минимальной лабой)

| Курс | Часы | Описание |
|------|------|----------|
| `go-internals` | ~12–16 | Memory model, escape analysis, GC, scheduler (GMP), interface internals, when not to use Go. Аналог [python-deep-dive](python-deep-dive/README.md). |
| `go-interviews` | ~12–16 | System design на Go, типовые вопросы (interfaces, channels, context), mock coding. Рядом с [behavioral-interviews](behavioral-interviews/README.md). |

## Рекомендуемый порядок внедрения

| Этап | Курс | Зачем |
|------|------|-------|
| 1 | `go-basic` | Фундамент; только Go toolchain на хосте. |
| 2 | `go-intermediate` + `deploy/go-api` | REST API «shop»; сразу связь с fastapi и api-design. |
| 3 | `go-concurrency` | Ключевая компетенция Go; сравнение с python-async. |
| 4 | `go-testing` | Закрепление intermediate; CI в gitlab-basic. |
| 5 | `go-advanced` | Redis, workers, observability, capstone. |
| 6 | `go-cloud-native` | После kuber-intermediate; client-go в кластере. |
| 7 | `grpc-go`, `go-cli`, `go-algorithms`, `go-internals` | По цели: microservices, DevOps CLI, собесы, глубина языка. |

## Новые стенды (`deploy/`)

| Стенд | Порт | Интеграция |
|-------|------|------------|
| `deploy/go-api` | ~8099 | Postgres + Redis в compose; тот же schema/контракт, что fastapi |
| `deploy/go-grpc` *(опционально)* | ~8100 | gRPC service + grpc-gateway HTTP; вызовы из fastapi/nodejs |

Переиспользуются: [deploy/postgres](../deploy/postgres/README.md), [deploy/redis](../deploy/redis/README.md), [deploy/rabbitmq](../deploy/rabbitmq/README.md), [deploy/nginx](../deploy/nginx/README.md), [deploy/observability](../deploy/observability/README.md), [gitlab-*](gitlab-basic/README.md) для CI, `mockctl` для cloud-native лаб.

## Требования к окружению (черновик)

| Курс | Что нужно |
|------|-----------|
| `go-basic` | Go 1.22+ на хосте; `go mod`, IDE с gopls |
| `go-intermediate`, `go-advanced` | `deploy/go-api`; Docker; postgres/redis из compose |
| `go-concurrency` | Go на хосте; опционально `deploy/go-api` для HTTP-лаб |
| `go-testing` | Go + Docker (testcontainers); examples/ по аналогии с python-testing |
| `go-algorithms` | Go + examples/ + `go test` |
| `go-cloud-native` | `mockctl up`, kubectl; образ go-api в кластере |
| `go-cli`, `grpc-go` | Go toolchain; grpc — Docker для зависимостей |
| `go-internals`, `go-interviews` | Только чтение + локальные примеры |

## Связь с Python- и DevOps-маршрутами

```text
containers-basic + postgresql-basic
       │
       ├── fastapi (:8090)     ←── go-intermediate (тот же API-контракт)
       ├── python-async        ←── go-concurrency (сравнение моделей)
       ├── python-celery       ←── go-advanced (asynq / river)
       ├── python-testing      ←── go-testing (параллельная ветка)
       ├── python-algorithms   ←── go-algorithms
       ├── api-design          ←── go-intermediate, grpc-go
       ├── microservices-patterns ←── grpc-go, go-advanced
       └── observability-*     ←── go-advanced (OTel, metrics)

kuber-intermediate
       │
       ├── kuber-advanced      ←── go-cloud-native (operators, client-go)
       └── gitops-*            ←── деплой go-api через Argo
```

## Сравнение стеков (для уроков «ландшафт»)

| Тема | Python (mock-exams) | Go (план) |
|------|---------------------|-----------|
| Web framework | FastAPI / Django | Chi / Gin |
| ORM / SQL | SQLAlchemy / Django ORM | pgx + sqlc / GORM |
| Async | asyncio | goroutines + channels |
| Очереди | Celery | asynq / river |
| Тесты | pytest | `testing` + testify |
| AWS SDK | boto3 ([python-aws](python-aws/README.md)) | aws-sdk-go-v2 *(отдельный курс — опционально)* |
| K8s | kubectl, Helm | client-go, controller-runtime |

Опционально позже: `go-aws` — зеркало [python-aws](python-aws/README.md) на aws-sdk-go-v2 + LocalStack.

## Формат курсов

Как у [fastapi](fastapi/README.md):

1. **Теория** — сценарий с работы → концепции → код → типичные ошибки.
2. **Лаба** — стенд `deploy/*` или `go run` / `go test` на хосте.
3. **Capstone** + `interview-cheatsheet.md` в конце трека.
4. **~50–70 минут** на пару «теория + лаба».

Рекомендуемый объём ядра: **~36–42 урока** на `go-intermediate` + `go-advanced` (как fastapi/django), **~10–12** на `go-basic` (быстрый ramp), **~28–36** на `go-concurrency`.

## Группа для PDF

Группа `golang` в `scripts/build-courses-pdf.py` (по мере реализации курсов):

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

Теоретические курсы (`go-internals`, `go-interviews`) — в группу `theory`.
