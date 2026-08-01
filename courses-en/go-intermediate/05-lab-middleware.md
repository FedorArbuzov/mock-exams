# 05. Lab: middleware chain

## Goal

Prove middleware order and request IDs with curls.

## Tasks

1. Confirm responses include a request ID header (add `X-Request-Id` if missing — read from `middleware.GetReqID`).

2. Add a tiny middleware that sets `X-App: go-api` on every response.

3. Temporarily panic in `/version`, confirm Recoverer returns 500 and the process stays up. Remove the panic after.

## Commands

```bash
curl -i http://localhost:8099/health
curl -i http://localhost:8099/version
```

## Success criteria

- [ ] Request ID visible
- [ ] `X-App: go-api` present
- [ ] Panic test recovered; panic removed

Next: [06. DTO and validation](06-dto-validation.md).
