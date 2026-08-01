# Go Intermediate — Interview cheatsheet

After lessons 00–24. Not a substitute for building the API.

## HTTP

- Chi on `net/http`; middleware `func(http.Handler) http.Handler`
- Order: recover, request ID, logging, auth on protected groups
- JSON helpers; never leak internal errors

## Layers

```text
handler → service → store
```

Interfaces at boundaries; wire in `main`.

## Postgres

- `pgxpool`, pass `context.Context`
- `pgx.ErrNoRows` → not found
- sqlc for typed queries; goose for migrations

## Auth

- bcrypt verify → JWT (HMAC) → `Authorization: Bearer`
- 401 missing/invalid; put `user_id` in context

## Ops hygiene

- Config from env; `.env.example` only in git
- slog JSON + request_id
- `Server.Shutdown` + pool.Close on SIGTERM
- `ReadHeaderTimeout` set

## Common questions

1. **Why Chi over Gin?** — stdlib handlers, thin, easy teaching/testing.
2. **sqlc vs GORM?** — explicit SQL, generated types, fewer ORM surprises.
3. **Where does validation live?** — HTTP DTO at the edge; business rules in service.
4. **How to cancel DB work?** — derive context from request; timeouts.
5. **Graceful shutdown steps?** — signal → Shutdown → close pool.

## Next

[`golang-path.md`](../golang-path.md) → `go-advanced` / `go-concurrency` / `go-testing`.
