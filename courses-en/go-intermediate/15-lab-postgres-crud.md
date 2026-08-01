# 15. Lab: items in Postgres

## Goal

Extend the stand (or your lab copy) so items support create/get/delete against Postgres — not only list.

## Tasks

1. Implement `Create`, `GetByID`, `Delete` in the store with pgx (or sqlc if you set it up).

2. Wire handlers:

- `POST /api/v1/items`
- `GET /api/v1/items/{id}`
- `DELETE /api/v1/items/{id}`

3. Map `pgx.ErrNoRows` → 404.

4. Rebuild compose and verify with curl.

## Success criteria

- [ ] Create returns 201 + body with id
- [ ] Get unknown id → 404
- [ ] Delete then get → 404
- [ ] List still shows Demo seed (until deleted)

## Tip

Use transactions later when create spans multiple tables; for a single insert, one query is enough.

Next: [16. Pagination and filters](16-pagination-filters.md).
