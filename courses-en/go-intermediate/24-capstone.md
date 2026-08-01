# 24. Capstone: shop API v1

## Time

**4–6 hours** across a couple of sessions.

## Build

A cohesive **shop items API** on the go-api stand (or a clean module copy):

### Required

| Feature | Notes |
|---------|-------|
| Layers | handler → service → store |
| Items CRUD | Postgres via pgx (sqlc optional) |
| List filters | `limit`, `offset`, `q` |
| Auth | login + JWT on mutating routes |
| Config | env-based |
| Logs | slog + request id |
| Shutdown | SIGTERM → `Shutdown` |
| Tests | table-driven service or store tests; handler tests with `httptest` |
| Smoke | extended script green |

### Optional stretch

- `owner_id` from JWT claims on create
- goose migration adding `sku`
- minimal `openapi.yaml`

## Layout reminder

```text
cmd/api/main.go
internal/config/
internal/db/
internal/store/
internal/service/
internal/httpapi/
migrations/          # if using goose
```

## Definition of done

- [ ] `docker compose up --build` + smoke OK
- [ ] README in your project folder: how to run, env vars, demo user
- [ ] `go test ./...` green
- [ ] `go vet ./...` clean

## Out of scope

Redis, metrics exporters, nginx, message queues — save for `go-advanced`.

## When stuck

Revisit lessons 08 (layers), 15 (CRUD), 18–19 (auth), 21 (shutdown). Prefer fixing your design over pasting large external templates.

---

**go-intermediate complete.** Next on the path: `go-advanced` or `go-concurrency` — see [`golang-path.md`](../golang-path.md).
