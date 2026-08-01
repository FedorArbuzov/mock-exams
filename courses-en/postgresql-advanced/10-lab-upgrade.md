# 10. Lab: major upgrade plan

## Why this lab

A production upgrade is **not** done from memory. The `pg-upgrade-16-to-17.md` document goes through review with the DBA and backend lead — like [intermediate/10-lab-pitr](../postgresql-intermediate/10-lab-pitr.md) for PITR.

## Prerequisites

- [09-major-upgrade](09-major-upgrade.md)
- An understanding of RPO/RTO and backups ([intermediate/09-pitr](../postgresql-intermediate/09-pitr.md))

## Task: the pg-upgrade-16-to-17.md document

Create `docs/pg-upgrade-16-to-17.md` with the structure below. Fill it in for **your** mock-exams shop (single cluster, Docker or RDS).

### 1. Executive summary

- Current version: PG 16
- Target: PG 17
- Chosen method: pg_upgrade / logical / dump (justify)
- Downtime budget: N minutes
- Owner, date, rollback decision maker

### 2. Pre-checks (≥ 8 items)

```markdown
- [ ] pg_upgrade --check on a staging clone
- [ ] pg_dumpall --globals-only backup
- [ ] Extension inventory: SELECT * FROM pg_extension;
- [ ] Disk free >= X GB (formula without --link)
- [ ] Application driver compatibility matrix
- [ ] Replication slots dropped / recreated plan
- [ ] Monitoring dashboards ready for post-upgrade
- [ ] On-call staffed for window
```

### 3. Decision matrix

| Criterion | pg_dump | pg_upgrade | logical repl |
|----------|---------|------------|--------------|
| DB size 800GB | | | |
| Downtime < 1h | | | |
| Rollback needed | | | |
| Cross-major | | | |
| **Your choice** | | | |

### 4. Backup strategy

- Base backup / snapshot before the window
- WAL archive status
- `pg_dump -Fc` schema app — in parallel

### 5. Upgrade steps (numbered)

For **pg_upgrade** — at least 12 steps:

```text
1. Announce maintenance
2. Stop application traffic
3. Stop replicas
4. Final WAL archive / slot check
5. pg_dumpall --globals-only
6. Install PG 17 binaries
7. initdb new PGDATA OR use pg_upgrade target
8. pg_upgrade --check
9. pg_upgrade (without --link if rollback is needed)
10. Start PG 17, smoke tests
11. ANALYZE; ALTER EXTENSION ... UPDATE
12. Re-enable replicas / logical sub
13. Application traffic ramp-up
14. Monitor 24h
```

### 6. Post-upgrade validation

```sql
SELECT version();
SELECT count(*) FROM shop.orders;
SELECT extname, extversion FROM pg_extension;
-- top 5 queries pg_stat_statements mean time
```

Application: health check, checkout flow, migration job dry-run.

### 7. Rollback

| If | Action |
|------|----------|
| pg_upgrade without --link | Stop PG17, start PG16 old PGDATA |
| pg_upgrade with --link | Restore snapshot / rebuild from backup |
| logical cutover failed | Redirect to old primary |

### 8. Communication template

Slack/email: start, progress, complete, rollback.

## Success criteria

- [ ] The document is ≥ 4 markdown pages, review-ready
- [ ] The decision matrix is filled in
- [ ] ANALYZE and 24h monitoring are mentioned
- [ ] Rollback without "we'll figure it out later"
- [ ] Extension check made explicit

## Next

Troubleshooting: [11-troubleshooting.md](11-troubleshooting.md).
