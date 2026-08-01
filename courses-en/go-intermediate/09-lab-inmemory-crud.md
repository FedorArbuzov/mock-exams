# 09. Lab: in-memory CRUD

## Goal

Implement items CRUD **without Postgres** to practice layers. Use a mutex-protected map/slice store in `examples/` or a branch of the stand.

## API

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/items` | list |
| POST | `/api/v1/items` | create (JSON title required) |
| GET | `/api/v1/items/{id}` | get or 404 |
| DELETE | `/api/v1/items/{id}` | delete or 404 |

## Structure

```text
examples/lab09/
  cmd/api/main.go
  internal/store/memory.go
  internal/service/items.go
  internal/httpapi/items.go
```

## Success criteria

- [ ] Create → list shows item
- [ ] Missing id → 404 with shared error shape
- [ ] Invalid body → 400/422
- [ ] Store has no `net/http` imports

Next: [10. Config from env](10-config-env.md).
