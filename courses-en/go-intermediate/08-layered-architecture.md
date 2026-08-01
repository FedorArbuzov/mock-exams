# 08. Layers: handler → service → store

## Responsibilities

```text
HTTP handler  →  parse/validate, map errors to status, call service
Service       →  business rules, transactions across stores
Store         →  SQL / persistence only
```

Handlers should not embed SQL. Stores should not know about JWT or HTTP.

## Interfaces at boundaries

```go
type ItemService interface {
    List(ctx context.Context) ([]Item, error)
    Create(ctx context.Context, in CreateItem) (Item, error)
}
```

Handlers depend on interfaces; `main` wires concrete types. Makes unit tests of handlers easy with fakes.

## Package sketch

```text
internal/httpapi/   # Chi, DTOs, middleware
internal/service/   # use cases
internal/store/     # pgx / sqlc
```

Start small: if a “service” is a one-liner pass-through, it is still fine for consistency — or fold until complexity appears. Prefer consistency over premature packages.

## Checklist

- [ ] Can draw the three layers
- [ ] Know where validation vs business rules live

Next: [09. Lab: in-memory CRUD](09-lab-inmemory-crud.md).
