# 12. pgx pool and context

## Why pgx

`database/sql` works; **pgx/v5** is the common Postgres driver in modern Go: native types, richer Postgres features, solid pool (`pgxpool`).

```go
pool, err := pgxpool.New(ctx, databaseURL)
defer pool.Close()
err = pool.Ping(ctx)
```

## Context

Pass `ctx` into every query. Cancelled request → cancelled query (when respected). Set timeouts at the server and optionally per-query:

```go
ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
defer cancel()
```

## Pool sizing

Start modest (`MaxConns` ~ few × CPU). Exhausted pool + missing timeouts = cascading latency. Close the pool on shutdown.

## Errors

Map `pgx.ErrNoRows` to your `ErrNotFound`. Wrap other errors with `%w` and log at the edge.

## Checklist

- [ ] Connect + ping on startup
- [ ] All queries take `context.Context`

Next: [13. sqlc](13-sqlc.md).
