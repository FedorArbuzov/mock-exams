# 04. Middleware: logging, request ID, recover

## What middleware is

```go
type Middleware func(http.Handler) http.Handler
```

It wraps the next handler: before → call next → after (or short-circuit).

```go
r.Use(middleware.RequestID)
r.Use(middleware.Recoverer)
r.Use(myLogger)
```

Order matters: **recover outermost** (or early) so panics become 500s instead of killing the process. Request ID early so all logs can include it.

## Request ID

Chi's `middleware.RequestID` sets an ID on the context. Propagate it in logs and optionally echo `X-Request-Id` on the response.

## Recover

`middleware.Recoverer` catches panics in handlers. Still prefer returning errors over panicking for expected failures.

## Custom logger middleware

Pattern from the stand:

1. Wrap `ResponseWriter` to capture status/bytes
2. Call `next`
3. Log method, path, status, duration, request ID

Keep logs **structured** (key/value) — see lesson 20 for `slog` depth.

## Common mistakes

- Logging full bodies with secrets
- Putting auth middleware after public routes by accident
- Forgetting that middleware on a `Route` group only applies inside that group

## Checklist

- [ ] Know `Use` vs per-route middleware
- [ ] Can explain recover + request ID placement

Next: [05. Lab: middleware chain](05-lab-middleware.md).
