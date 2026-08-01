# 03. Lab: health and version

## Goal

Add a `/version` endpoint and keep `/health` green. Practice the edit → rebuild → curl loop on the stand.

## Setup

```bash
cd deploy/go-api
docker compose up -d --build
```

Or edit `stack/api` and rebuild:

```bash
docker compose up -d --build api
```

## Tasks

1. Add `GET /version` returning JSON:

```json
{"service":"go-api","version":"0.1.0"}
```

2. Keep `GET /health` as `{"status":"ok"}`.

3. Document both in a short comment at the top of `internal/httpapi/router.go`.

## Success criteria

- [ ] `curl localhost:8099/health` → ok
- [ ] `curl localhost:8099/version` → includes `0.1.0`
- [ ] Smoke still passes

## If stuck

| Symptom | Check |
|---------|-------|
| Old binary | rebuild `--build` |
| 404 | route registered on the Chi mux you actually serve |

Next: [04. Middleware](04-middleware.md).
