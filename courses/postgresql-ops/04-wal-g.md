# 04. WAL-G

## Сценарий с работы

Команда в Kubernetes не хочет тяжёлый pgBackRest agent на каждой ноде. Выбирают **WAL-G**: `wal-push` в S3/MinIO, `backup-push` ночью, restore через `backup-fetch` + WAL replay. DevOps уже знает S3 IAM — конфиг через env vars.

WAL-G — cloud-native companion для physical backup, особенно в K8s и MinIO стендах mock-exams.

## Что вы узнаете

- backup-push vs wal-push
- Переменные окружения и MinIO
- PITR с WAL-G
- Сравнение с pgBackRest

## Идея

```text
Primary PGDATA
    ├── wal-g wal-push     (каждый archived WAL segment)
    └── wal-g backup-push  (периодический base backup)
            ↓
        S3 / GCS / MinIO
            ↓
    wal-g backup-fetch + wal-fetch → restore / PITR
```

```bash
wal-g backup-push $PGDATA
wal-g backup-list
wal-g wal-push %p   # через archive_command
wal-g backup-fetch $PGDATA LATEST
```

## Переменные окружения

```bash
WALG_S3_PREFIX=s3://pg-backups/course
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=http://minio:9000          # MinIO
AWS_S3_FORCE_PATH_STYLE=true
PGDATA=/var/lib/postgresql/data
```

Для MinIO на стенде: [`docker-compose.ops.yml`](../../deploy/postgres/docker-compose.ops.yml) — console :9001.

`archive_command`:

```bash
archive_command = 'wal-g wal-push %p'
```

## PITR

1. Остановить Postgres, очистить PGDATA (на **тестовом** хосте).
2. `wal-g backup-fetch $PGDATA LATEST` (или конкретный backup).
3. Настроить recovery: `restore_command = 'wal-g wal-fetch %f %p'`.
4. `recovery_target_time` в postgresql.conf + `recovery.signal`.
5. Start → replay → promote.

Детали зависят от версии WAL-G; сверяйтесь с docs при внедрении.

## Что push'ится чаще

| | Частота | Объём |
|---|---------|-------|
| **WAL** | Каждый segment (16MB default) | Непрерывно |
| **Full backup** | Daily/weekly cron | Большой, реже |

RPO определяется **WAL push**, не full backup.

## vs pgBackRest

| | WAL-G | pgBackRest |
|---|-------|------------|
| Фокус | Object storage WAL | Full enterprise backup suite |
| Config | Env vars | pgbackrest.conf |
| Verify | backup-list, manual drill | `verify`, rich info |
| Типично | Cloud/K8s | Bare metal, large DBA teams |

Можно coexist: pgBackRest primary, WAL-G в DR region — редко, выберите один.

## Секреты и тест restore

- Credentials в Vault/External Secrets — не в compose в prod.
- **Restore drill** quarterly на изолированном инстансе — единственная проверка.
- Не тестировать `backup-fetch` в prod PGDATA.

## Типичные ошибки

1. `backup-push` без `wal-push` — нет PITR между backups.
2. MinIO endpoint wrong — silent archive failures → disk full.
3. Same bucket prod и dev без prefix isolation.
4. Забыли `archive_mode=on`.

## Чек-лист

- [ ] WAL push чаще full backup
- [ ] Где секреты S3
- [ ] Test restore без prod
- [ ] MinIO endpoint для local
- [ ] RPO = WAL continuity

## Дальше

Лаба: [05-lab-wal-g.md](05-lab-wal-g.md).
