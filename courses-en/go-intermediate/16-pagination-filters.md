# 16. Pagination, filters, sorting

## Query params

```text
GET /api/v1/items?limit=20&offset=0&q=key&sort=created_at&order=desc
```

Parse carefully:

```go
limit := 20
if v := r.URL.Query().Get("limit"); v != "" {
    // strconv.Atoi + clamp 1..100
}
```

Always **clamp** limits. Default sort to a stable column (`id` or `created_at`).

## SQL pattern

```sql
SELECT ... FROM items
WHERE ($1::text = '' OR title ILIKE '%' || $1 || '%')
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

Return total count optionally (`Content-Range` or `{"items":[],"total":N}`) — pick one style and document it.

## Common mistakes

- Unbounded `limit`
- String-concatenating user input into SQL (use parameters)
- Non-deterministic order without secondary key

## Checklist

- [ ] Clamped limit/offset
- [ ] Parameterized filter

Next: [17. Lab: filtered list](17-lab-pagination.md).
