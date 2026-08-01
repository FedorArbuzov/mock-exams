# 02. Handlers, routing, Mount

## Handlers

```go
func health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    _, _ = w.Write([]byte(`{"status":"ok"}`))
}
```

Always set `Content-Type` for JSON. Prefer a small `writeJSON` helper (see the stand) over copy-paste.

## Chi routing

```go
r := chi.NewRouter()
r.Get("/health", health)
r.Get("/version", version)

r.Route("/api/v1", func(r chi.Router) {
    r.Get("/items", listItems)
    r.Post("/items", createItem)
    r.Get("/items/{id}", getItem)
})
```

URL params:

```go
id := chi.URLParam(r, "id")
```

## Mount

Split routers by area:

```go
r.Mount("/api/v1/items", itemsRouter())
r.Mount("/api/v1/auth", authRouter())
```

`Mount` attaches a sub-`http.Handler` at a prefix — useful when teams own different packages.

## Context

`r.Context()` carries deadlines and values (request ID, user claims). Pass it into store methods. Do not stash request-scoped data in globals.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Writing body before headers/status | Set headers → `WriteHeader` → encode |
| Ignoring method | Use Chi method routes (`Get`/`Post`) |
| Parsing path with string splits | `chi.URLParam` |

## Checklist

- [ ] Can register nested `/api/v1` routes
- [ ] Can read a path param
- [ ] Understand `Mount` vs `Route`

Next: [03. Lab: health and version](03-lab-health.md).
