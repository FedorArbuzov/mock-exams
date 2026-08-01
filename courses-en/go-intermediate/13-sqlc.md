# 13. sqlc: queries and generated code

## Idea

Write SQL in `.sql` files; **sqlc** generates type-safe Go. You keep control of queries without hand-writing scan boilerplate.

```sql
-- name: ListItems :many
SELECT id, title, description, owner_id, created_at
FROM items
ORDER BY id;
```

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "query/"
    schema: "schema/"
    gen:
      go:
        package: "dbgen"
        out: "internal/dbgen"
        sql_package: "pgx/v5"
```

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
sqlc generate
```

## Workflow

1. Change schema (migration)
2. Update SQL queries
3. `sqlc generate`
4. Call generated methods from `store`/`service`

Do not edit generated files by hand.

## When to skip sqlc

Tiny prototypes can use raw pgx (as the stand's first `List` does). For anything beyond a few queries, sqlc pays off.

## Checklist

- [ ] Know the sqlc generate loop
- [ ] Generated code stays out of hand edits

Next: [14. goose migrations](14-goose-migrations.md).
