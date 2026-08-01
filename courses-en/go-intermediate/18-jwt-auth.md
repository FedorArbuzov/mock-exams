# 18. JWT login and protected routes

## Flow

1. `POST /api/v1/auth/login` with email/password
2. Verify password hash (bcrypt)
3. Issue JWT (HMAC with `JWT_SECRET`) containing `sub` (user id) and `exp`
4. Client sends `Authorization: Bearer <token>`
5. Middleware validates JWT and puts claims on context

## Middleware sketch

```go
func Auth(secret []byte) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // parse Bearer, jwt.Parse, set user id in context
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
```

Protect groups:

```go
r.Group(func(r chi.Router) {
    r.Use(Auth([]byte(cfg.JWTSecret)))
    r.Post("/items", createItem)
})
```

Public: health, login, maybe list. Write: authenticated (and later owned-by-user).

## Security basics

- Short expiry + refresh strategy (refresh can wait for advanced)
- Compare hashes with bcrypt; never log passwords
- Use a strong secret in real deployments

## Checklist

- [ ] Login issues JWT
- [ ] Protected route rejects missing/invalid token with 401

Next: [19. Lab: auth](19-lab-auth.md).
