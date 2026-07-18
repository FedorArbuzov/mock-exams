# Runbook: disk full (PGDATA or WAL)

## Симптомы

- `FATAL: could not write to file`
- Inserts fail, DB read-only или down

## Быстрые действия

1. Освободить место **вне** PG (логи OS, tmp) — не удалять файлы в `pg_wal/` вручную.
2. Проверить `df -h` на PGDATA и WAL mount.
3. Если безопасно: `VACUUM` не поможет месту на диске мгновенно — нужен archive/cleanup.

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
SELECT * FROM pg_ls_waldir() LIMIT 5;  -- superuser
```

4. Увеличить volume (cloud) или расширить LVM.
5. `archive_command` fail → WAL накапливается — починить archive или временно увеличить `max_wal_size` (не решение).

## Запрещено

- Удалять произвольно файлы в `pg_wal/`
- `rm -rf` на PGDATA

## После стабилизации

- Post-mortem: почему retention/archive не сработал.
- Алерт на 80% disk.
