# 14. goose migrations

## Why migrations

`init/*.sql` boots empty volumes once. Real apps need **versioned** schema changes: add column, new index, backfill.

[goose](https://github.com/pressly/goose) is a simple migration runner.

```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
goose -dir migrations postgres "$DATABASE_URL" up
goose -dir migrations postgres "$DATABASE_URL" status
```

## File shape

```sql
-- +goose Up
ALTER TABLE items ADD COLUMN sku TEXT;

-- +goose Down
ALTER TABLE items DROP COLUMN sku;
```

Commit migrations. Never rewrite applied files on shared environments — add a new migration instead.

## Compose note

The course stand seeds via `docker-entrypoint-initdb.d`. In labs, practice goose against a throwaway DB. Production images often run migrations as an init container or a release job.

## Checklist

- [ ] Can write Up/Down pair
- [ ] Understand “never rewrite applied migrations”

Next: [15. Lab: Postgres CRUD](15-lab-postgres-crud.md).
