# 10. Config from env

## Why env

Twelve-factor style: same binary, different environments. Never commit secrets.

```go
type Config struct {
    HTTPAddr    string
    DatabaseURL string
    JWTSecret   string
    LogLevel    slog.Level
}
```

Load with `os.Getenv` (as in the stand) or a helper library (`caarlos0/env`). Fail fast if required vars are missing in production; provide safe defaults for local learning.

## Patterns

```bash
export HTTP_ADDR=:8099
export DATABASE_URL=postgres://...
export JWT_SECRET=...
export LOG_LEVEL=debug
```

Ship `.env.example` with dummy values — not a real `.env` in git.

## Validation

After load, check:

- `JWT_SECRET` length in non-dev
- `DATABASE_URL` non-empty when DB is required
- `HTTP_ADDR` parseable

## Checklist

- [ ] Config centralized in one package
- [ ] Secrets only via env

Next: [11. Lab: config](11-lab-config.md).
