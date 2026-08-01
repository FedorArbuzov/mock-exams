# 22. Lab: shutdown and timeouts

## Tasks

1. Confirm the stand's `main` already shuts down on SIGTERM (read the code).

2. Add `ReadHeaderTimeout` if missing.

3. Add a slow test handler `GET /debug/sleep?ms=3000` (dev only) and verify:

- request completes if under shutdown grace
- or is cancelled when context ends — observe behavior, document it

4. Remove or guard the debug route behind `LOG_LEVEL=debug` before finishing.

## Success criteria

- [ ] `docker stop mock-go-api` exits cleanly (check logs “shutdown complete”)
- [ ] Timeouts documented in a short comment in `main.go`

Next: [23. OpenAPI and smoke](23-openapi-smoke.md).
