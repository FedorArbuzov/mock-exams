# 11. Lab: env-driven settings

## Tasks

1. Add `APP_NAME` env (default `go-api`) and return it from `/version`.

2. Change `LOG_LEVEL=debug`, rebuild/restart, confirm more verbose logs.

3. Start without `DATABASE_URL` on a local binary — expect a clear fatal error (or documented default for the lab).

## Success criteria

- [ ] `/version` reflects `APP_NAME`
- [ ] Log level toggles without code edits
- [ ] Missing critical config fails loudly

Next: [12. pgx pool](12-pgx-pool.md).
