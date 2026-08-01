# 00. Environment: stand, layout, Chi

## Goal

Get the shop API stand running and understand where code lives. Everything else in this course builds on that loop: edit → rebuild/reload → curl.

## Start the stand

```bash
cd deploy/go-api
docker compose up -d --build
```

Check:

```bash
curl http://localhost:8099/health
curl http://localhost:8099/api/v1/items
bash scripts/smoke.sh
```

| Piece | Role |
|-------|------|
| `stack/api` | Go service (Chi + pgx) |
| `init/*.sql` | Postgres bootstrap schema + seed |
| Port **8099** | Host mapping to container `:8080` |

## Layout you will use

```text
cmd/api/main.go          # process entry: config, DB, HTTP server
internal/
  config/                # env → Config
  db/                    # pgx pool
  store/                 # SQL / data access
  httpapi/               # Chi router, handlers, middleware
```

Rules of thumb:

- `cmd/` is thin — wire dependencies, start/stop the process.
- `internal/` is not importable from outside the module (compiler-enforced).
- Prefer small packages over a single `pkg/` dumping ground.

Course labs may also live under `courses-en/go-intermediate/examples/` when you practice without Docker.

## Chi in one minute

Chi is a lightweight router on top of `net/http`. Handlers are ordinary `http.Handler` / `http.HandlerFunc`. Middleware is `func(http.Handler) http.Handler`.

```go
r := chi.NewRouter()
r.Get("/health", healthHandler)
r.Route("/api/v1", func(r chi.Router) {
    r.Get("/items", listItems)
})
```

## Local run (API on host)

If Postgres is reachable:

```bash
cd deploy/go-api/stack/api
export DATABASE_URL='postgres://course:course@localhost:5432/course?sslmode=disable'
export HTTP_ADDR=':8099'
go run ./cmd/api
```

The compose Postgres is not published by default — either publish a port for learning, or keep developing against the containerized API.

## Checklist

- [ ] Smoke passes on `:8099`
- [ ] You can find `cmd/api` and `internal/httpapi`
- [ ] You know why `internal/` exists

Next: [01. Landscape](01-landscape.md).
