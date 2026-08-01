# PostgreSQL — Basic (Administration)

A course for DevOps, backend engineers, and junior DBAs. By the end you should be able to **install** Postgres, **connect** confidently, manage **roles and objects**, understand **MVCC** at a practical level, run **backups**, and read a query plan without panicking.

Not a reference manual — each lesson starts from something that actually breaks on the job, then walks through the fix.

**Local setup:** [`deploy/postgres`](../../deploy/postgres/README.md) — `docker compose up`, port `5432`.

**What's after this:** [`postgresql-intermediate`](../postgresql-intermediate/README.md) → [`postgresql-advanced`](../postgresql-advanced/README.md).

Full branch plan: [`postgresql-path.md`](../postgresql-path.md).

## Curriculum

### Architecture and installation

1. [PostgreSQL Architecture](01-architecture.md)
2. [Lab: Installation and First Connection](02-lab-install.md)

### Objects and admin SQL

3. [Cluster, Database, Schemas, Tables](03-databases-schemas.md)
4. [Lab: DDL and Basic Objects](04-lab-ddl.md)
5. [Roles, Privileges, Security](05-roles-privileges.md)
6. [Lab: Roles and GRANT](06-lab-roles.md)

### Connections and queries

7. [Connections: psql, URI, Pools](07-connections-psql.md)
8. [Lab: psql and Metadata](08-lab-psql.md)
9. [Indexes and EXPLAIN](09-indexes-explain.md)
10. [Lab: Indexes and Query Plans](10-lab-indexes.md)

### MVCC and backups

11. [Transactions and MVCC](11-transactions-mvcc.md)
12. [Lab: Transaction Visibility](12-lab-mvcc.md)
13. [Logical Backups: pg_dump](13-backup-pgdump.md)
14. [Lab: Dump and Restore](14-lab-backup.md)

### Final project

15. [Final Project: Shop Database](15-final-project.md)

## What you'll be able to do

- Connect to Postgres locally and from an app
- Create a DB, schema, table, index; grant minimal privileges
- Explain why VACUUM matters (at least conceptually)
- Run `pg_dump` / `pg_restore` and actually verify the restore worked

## If you want to go deeper (after basic)

| Course | When |
|--------|------|
| [`postgresql-developer`](../postgresql-developer/README.md) | migrations, JSONB, FTS — can run parallel with basic+ |

## Related tracks

| Course | Why it matters |
|--------|----------------|
| `kuber-intermediate` StatefulSet + Postgres | running apps in K8s |
| `aws-intermediate` RDS | managed Postgres in cloud |
| `bare-metal` | Postgres on physical servers |
