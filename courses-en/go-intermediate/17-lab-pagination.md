# 17. Lab: filtered list

## Tasks

1. Support `limit`, `offset`, and `q` (title substring) on `GET /api/v1/items`.

2. Response shape:

```json
{"items":[...],"limit":20,"offset":0}
```

3. Reject `limit > 100` with 400.

## Success criteria

- [ ] `?q=Demo` returns the seeded item
- [ ] `?limit=1` returns at most one row
- [ ] Invalid limit handled cleanly

Next: [18. JWT auth](18-jwt-auth.md).
