# 10. What's next

## You finished go-basic — what that means

You can read and write **ordinary** Go: types, structs, errors, packages, tests, JSON. That is enough to open **`go-intermediate`** and not spend a week on syntax.

## Next step: go-intermediate

See [`go-intermediate/README.md`](../go-intermediate/README.md) and the stand [`deploy/go-api`](../../deploy/go-api/README.md) (`:8099`):

| Topic | Where |
|-------|-------|
| HTTP API (Chi) | `go-intermediate` |
| Postgres (pgx, sqlc) | `go-intermediate` |
| JWT, middleware, slog | `go-intermediate` |
| Full path | [`golang-path.md`](../golang-path.md) |

Also useful in parallel: [`api-design`](../api-design/README.md) (REST, errors, versions).

## What was deliberately left out of basic

| Topic | Course |
|-------|--------|
| Goroutines, channels, `context` | [`go-concurrency`](../golang-path.md) |
| httptest, mocks, testcontainers | [`go-testing`](../golang-path.md) |
| GC, scheduler, escape analysis | `go-internals` |
| LeetCode patterns | `go-algorithms` |
| client-go, operators | `go-cloud-native` |

Don’t stay in basic “until I know everything” — **the best Go is learned on a real API**.

## Quick self-check before intermediate

- [ ] Explain slice vs array, value vs pointer receiver
- [ ] Write `if err != nil` without frustration
- [ ] Wrote a table-driven test
- [ ] Split `main` and an `internal/` package
- [ ] Can read someone else’s handler with `http.ResponseWriter` — at least the signature

## Interview

Short reference — [`interview-cheatsheet.md`](interview-cheatsheet.md). Full Q&A — in `go-interviews` *(planned)*.

---

**go-basic is complete.** Continue with [`go-intermediate`](../go-intermediate/README.md).
