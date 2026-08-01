# 20. slog and correlation IDs

## slog

Standard library structured logging (Go 1.21+):

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
logger.Info("request", "method", "GET", "path", "/health", "status", 200)
```

JSON handlers work well with log aggregators. Use levels: Debug for noisy local, Info for requests, Error for failures.

## Correlation

Attach `request_id` (and later `user_id`) to every request log line. Middleware already has the request ID — pass the logger with attrs or read ID when logging.

```go
logger.Info("list items", "request_id", middleware.GetReqID(r.Context()))
```

## What not to log

Passwords, tokens, full card numbers, entire PII payloads. Prefer ids and error codes.

## Checklist

- [ ] JSON logs in the API process
- [ ] Request ID on request completion lines

Next: [21. Graceful shutdown](21-graceful-shutdown.md).
