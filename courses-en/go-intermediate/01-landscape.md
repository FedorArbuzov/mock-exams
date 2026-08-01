# 01. Landscape: net/http, Chi, Gin

## Goal

Pick one HTTP stack deliberately — and stick to it for the course.

## net/http is enough… until routing grows

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /health", health)
http.ListenAndServe(":8080", mux)
```

Go 1.22+ method+path patterns help, but you still hand-roll middleware composition, subrouters, and URL params. Fine for tiny services; painful for a growing API.

## Chi

- Thin wrapper around `net/http`
- Composable middleware and route groups
- Easy to test with `httptest`
- No magic DI container

This course standardizes on **Chi**.

## Gin (alternative)

Gin is popular: fast router, binding helpers, larger ecosystem. Trade-offs: more framework conventions, its own context type (`*gin.Context`), farther from stdlib.

You can read Gin code on the job. You do not need to learn both here.

## What we use later in this course

| Concern | Choice |
|---------|--------|
| Router | Chi |
| Driver | pgx |
| Query codegen | sqlc (labs) |
| Migrations | goose |
| Auth | JWT |
| Logs | slog |

ORM (GORM) is optional knowledge — explicit SQL + sqlc teaches transferable skills and matches how many production Go services are written.

## Checklist

- [ ] Explain why Chi fits teaching/stdlib style
- [ ] Know Gin exists without switching mid-course

Next: [02. Handlers and routing](02-handlers-routing.md).
