# 10. Лаба: план major upgrade

## Зачем эта лаба

Production upgrade **не** делают по памяти. Документ `pg-upgrade-16-to-17.md` проходит review у DBA и backend lead — как [intermediate/10-lab-pitr](../postgresql-intermediate/10-lab-pitr.md) для PITR.

## Предусловия

- [09-major-upgrade](09-major-upgrade.md)
- Понимание RPO/RTO и backup ([intermediate/09-pitr](../postgresql-intermediate/09-pitr.md))

## Задание: документ pg-upgrade-16-to-17.md

Создайте `docs/pg-upgrade-16-to-17.md` со структурой ниже. Заполните под **ваш** mock-exams shop (single cluster, Docker или RDS).

### 1. Executive summary

- Текущая версия: PG 16
- Целевая: PG 17
- Выбранный метод: pg_upgrade / logical / dump (обоснуйте)
- Downtime budget: N минут
- Owner, date, rollback decision maker

### 2. Pre-checks (≥ 8 пунктов)

```markdown
- [ ] pg_upgrade --check на staging clone
- [ ] pg_dumpall --globals-only backup
- [ ] Extension inventory: SELECT * FROM pg_extension;
- [ ] Disk free >= X GB (formula без --link)
- [ ] Application driver compatibility matrix
- [ ] Replication slots dropped / recreated plan
- [ ] Monitoring dashboards ready for post-upgrade
- [ ] On-call staffed for window
```

### 3. Decision matrix

| Критерий | pg_dump | pg_upgrade | logical repl |
|----------|---------|------------|--------------|
| DB size 800GB | | | |
| Downtime < 1h | | | |
| Rollback needed | | | |
| Cross-major | | | |
| **Ваш выбор** | | | |

### 4. Backup strategy

- Base backup / snapshot before window
- WAL archive status
- `pg_dump -Fc` schema app — параллельно

### 5. Upgrade steps (numbered)

Для **pg_upgrade** — минимум 12 шагов:

```text
1. Announce maintenance
2. Stop application traffic
3. Stop replicas
4. Final WAL archive / slot check
5. pg_dumpall --globals-only
6. Install PG 17 binaries
7. initdb new PGDATA OR use pg_upgrade target
8. pg_upgrade --check
9. pg_upgrade (без --link если нужен rollback)
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

| Если | Действие |
|------|----------|
| pg_upgrade без --link | Stop PG17, start PG16 old PGDATA |
| pg_upgrade с --link | Restore snapshot / rebuild from backup |
| logical cutover failed | Redirect to old primary |

### 8. Communication template

Slack/email: start, progress, complete, rollback.

## Критерии успеха

- [ ] Документ ≥ 4 страниц markdown, пригоден для review
- [ ] Decision matrix заполнена
- [ ] Упомянуты ANALYZE и monitoring 24h
- [ ] Rollback без «потом разберёмся»
- [ ] Extension check явно

## Дальше

Troubleshooting: [11-troubleshooting.md](11-troubleshooting.md).
