# 19. Lab: auth flow

## Seed user

Stand init inserts `demo@course.local`. Set/reset the password hash to a known bcrypt of `demo` for the lab (document the password in your README note).

## Tasks

1. `POST /api/v1/auth/login` → `{ "access_token": "..." }`

2. Protect `POST /api/v1/items` with JWT middleware.

3. Create item with and without token — expect 201 vs 401.

## Success criteria

- [ ] Bad password → 401
- [ ] Good login → token
- [ ] Create without token → 401
- [ ] Create with token → 201

Next: [20. slog](20-slog.md).
