# 01. Ландшафт бэкапов

## Сценарий с работы

Пятница, 17:00. «У нас же есть pg_dump каждую ночь» — а в 14:03 DBA случайно `DROP SCHEMA app CASCADE`. Нужно состояние на **14:02**. Dump в 03:00 бесполезен. Параллельно compliance спрашивает: «где off-site копии и какой RPO?» Ops-курс начинается с **карты бэкапов**: logical vs physical, RPO/RTO, выбор инструмента.

**Предварительно:** [intermediate/09-pitr](../postgresql-intermediate/09-pitr.md), [basic/13-backup-pgdump](../postgresql-basic/13-backup-pgdump.md).

## Что вы узнаете

- Logical vs physical backup
- pgBackRest, Barman, WAL-G, RDS snapshots
- RPO и RTO на языке бизнеса
- Когда что использовать

## Logical vs physical

| Тип | Инструменты | RPO | Восстановление |
|-----|-------------|-----|----------------|
| **Logical** | `pg_dump`, `pg_dumpall` | Момент окончания dump | `pg_restore` / psql — гибко по schema |
| **Physical** | base backup + WAL archive | Секунды–минуты (непрерывный WAL) | PITR, быстрее на TB |

```text
Logical:  SQL/ custom dump → переносимость, cross-major (с оговорками)
Physical: PGDATA pages + WAL chain → disaster recovery, PITR
```

**pg_dump не заменяет PITR:** snapshot во времени dump, не произвольная секунда.

## Инструменты

| Инструмент | Сильные стороны | Типичная среда |
|------------|-----------------|----------------|
| **pgBackRest** | Parallel backup/restore, stanza, full/diff/incr, S3, verify | Self-hosted prod |
| **Barman** | Python, WAL hook, retention policies | Enterprise, Postgres shops |
| **WAL-G** | Cloud-native WAL push, MinIO/S3, легковесный | K8s, cloud |
| **RDS/Aurora snapshots** | Managed, automated | AWS ([aws-intermediate](../aws-intermediate/README.md)) |
| **pg_basebackup** | Встроенный, основа replica | Ручной DR, replication |

Часто **оба**: nightly `pg_dump` schema для portability + **physical PITR** для DR.

## RPO и RTO

| Метрика | Вопрос | Пример |
|---------|--------|--------|
| **RPO** (Recovery Point Objective) | Сколько данных можем потерять? | WAL archive каждую минуту → RPO ~1 min |
| **RTO** (Recovery Time Objective) | Как быстро поднимем сервис? | Restore 30 min + replay 20 min |

| Стратегия | Типичный RPO |
|-----------|--------------|
| Daily pg_dump | До 24h |
| Physical + continuous archive | Минуты |
| Sync replica + failover | ~0 writes |

## Где хранить бэкапы

- **Off-site** — другой регион/AZ, не тот же SAN что PGDATA.
- **Immutable** — S3 Object Lock, WORM (ransomware).
- **Encryption** — at rest (SSE-KMS).
- **Access** — отдельные IAM/credentials, не app role.

## Когда что

| Среда | Рекомендация |
|-------|--------------|
| Dev/test | `pg_dump -Fc` достаточно |
| Prod OLTP | Physical + PITR + quarterly restore drill |
| Cross-region DR | Replica + object storage backups |
| Major upgrade | Logical repl или blue/green ([06-blue-green](06-blue-green.md)) |
| Compliance audit | Retention policy + documented drills |

## Типичные ошибки

1. Только pg_dump на 2 TB — RPO 24h, restore дни.
2. Бэкап на том же диске что PGDATA — fire = потеря всего.
3. Никогда не тестировали restore — «бэкап есть» ≠ «восстановление работает».
4. Путать snapshot VM с consistent DB backup без WAL.

## Чек-лист

- [ ] Почему pg_dump ≠ PITR
- [ ] Роль WAL в physical backup
- [ ] Off-site и encryption
- [ ] RPO/RTO для вашего shop API
- [ ] Restore drill в календаре

## Дальше

pgBackRest: [02-pgbackrest.md](02-pgbackrest.md).
