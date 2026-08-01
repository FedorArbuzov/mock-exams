# 23. OpenAPI overview and smoke contracts

## Smoke is the minimum contract

Your `scripts/smoke.sh` asserts health + items. Extend it as the API grows:

```bash
curl -sf "$BASE/health" | grep -q ok
curl -sf "$BASE/api/v1/items" | grep -q Demo
# login + create with token when auth lands
```

CI should run smoke against compose.

## OpenAPI

Options in Go:

- Hand-written `openapi.yaml` (honest, reviewable)
- Generators (`swag`, `oapi-codegen` from spec-first)

For this course: keep a **small** `openapi.yaml` describing health, items list/create, and login. Stay in sync when you change routes — or generate from annotations if you prefer one source of truth.

## Why it matters

Clients, QA, and contract tests need a stable description. Smoke catches “server is up”; OpenAPI catches “shape drifted”.

## Checklist

- [ ] Smoke covers new critical paths you added
- [ ] You know where an OpenAPI file would live (`deploy/go-api/openapi.yaml` or repo docs)

Next: [24. Capstone](24-capstone.md).
