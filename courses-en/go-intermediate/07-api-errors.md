# 07. API errors and response shape

## Convention

Pick one error JSON shape and stick to it:

```json
{"error":{"code":"validation_failed","message":"title is required"}}
```

Or a list of field errors for 422. Document status codes:

| Status | When |
|--------|------|
| 400 | Malformed JSON |
| 401 | Missing/invalid token |
| 403 | Authenticated but not allowed |
| 404 | Resource missing |
| 409 | Conflict (unique email) |
| 422 | Semantically invalid body |
| 500 | Unexpected — log detail, hide internals |

## Mapping domain errors

```go
var ErrNotFound = errors.New("not found")

// in handler
if errors.Is(err, store.ErrNotFound) {
    writeError(w, http.StatusNotFound, "not_found", "item not found")
    return
}
```

Wrap with `%w` in lower layers; unwrap with `errors.Is` / `As` at the edge.

## Do not

- Return raw `err.Error()` from Postgres to clients
- Use 500 for “user sent bad input”
- Mix string-only and structured errors randomly

## Checklist

- [ ] One writeError helper
- [ ] Domain sentinel errors mapped to HTTP

Next: [08. Layered architecture](08-layered-architecture.md).
