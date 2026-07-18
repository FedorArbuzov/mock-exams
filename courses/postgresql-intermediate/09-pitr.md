# 09. PITR: point-in-time recovery

## Сценарий с работы

14:02 — `DROP TABLE orders CASCADE` не в той сессии. Последний `pg_dump` — 03:00. Logical dump не вернёт «состояние на 13:55». **PITR** восстанавливает кластер на произвольный момент между base backup и сейчас, если есть **непрерывная цепочка WAL** в archive.

Это стандарт production DR вместе с pgBackRest/WAL-G ([ops](../postgresql-ops/README.md)). `pg_dump` остаётся для переноса схемы; PITR — для **RPO в минутах**.

## Что вы узнаете

- Компоненты PITR: base backup + WAL archive + recovery target
- Процесс восстановления на PG 12+
- RPO и RTO на языке бизнеса
- Отличие от pg_dump и когда что использовать
- Инструменты ops-уровня

## Компоненты

```text
1. Base backup (pg_basebackup, pgBackRest)
        +
2. WAL archive (archive_command → S3/NFS)
        +
3. Recovery: replay WAL до recovery_target_time
        →
   Кластер на момент T (или just before DROP)
```

Без (2) PITR **невозможен** — только момент окончания base backup.

## recovery и сигнальные файлы

PostgreSQL 12+: в PGDATA при recovery лежит **`recovery.signal`** (или `standby.signal` для replica). Параметры в `postgresql.conf` / `postgresql.auto.conf`:

```ini
restore_command = 'cp /wal_archive/%f %p'
recovery_target_time = '2026-06-25 13:55:00+00'
recovery_target_action = promote
recovery_target_inclusive = false
```

| Параметр | Смысл |
|----------|-------|
| `restore_command` | Как достать сегмент WAL из archive |
| `recovery_target_time` | Остановиться на timestamp (UTC!) |
| `recovery_target_xid` | Альтернатива — по transaction ID |
| `recovery_target_action = promote` | Стать primary после достижения target |
| `recovery_target_inclusive` | Включать ли транзакции ровно на границе |

Старый формат `recovery.conf` — до PG 12; в 16 всё в GUC + signal file.

## Процесс (runbook outline)

```text
1. Остановить Postgres (или поднять новый инстанс с чистым PGDATA)
2. Очистить / заменить PGDATA содержимым base backup
3. Создать recovery.signal
4. Настроить restore_command и recovery_target_*
5. start — Postgres replay WAL из archive
6. При достижении target — promote (если action=promote)
7. Verify: pg_is_in_recovery() = false, данные на месте
8. Переключить приложение (DNS, connection string)
```

**Тестовое восстановление** — в отдельный инстанс, не поверх production PGDATA.

## RPO и RTO

| Метрика | Вопрос | Пример |
|---------|--------|--------|
| **RPO** (Recovery Point Objective) | Сколько данных можем потерять? | Archive WAL каждую минуту → RPO ≈ 1 min |
| **RTO** (Recovery Time Objective) | Как быстро поднимем сервис? | Base restore 30 min + replay 20 min |

| Стратегия | Типичный RPO |
|-----------|--------------|
| Nightly pg_dump | До 24 часов |
| pg_dump hourly | До 1 часа |
| PITR + continuous archive | Секунды–минуты |
| Sync replica + failover | ~0 для writes |

## pg_dump vs PITR

| | pg_dump | PITR |
|---|---------|------|
| Гранулярность | БД / schema | Весь кластер (PGDATA) |
| Момент времени | Конец dump | Любой момент в цепочке WAL |
| Время restore большой БД | Долго | Replay пропорционален WAL |
| Cross-version | Гибче | Same major обычно |

Идеал: **pg_dump** для logical portability + **PITR** для disaster recovery.

## pgBackRest / Barman / WAL-G

Обёртки: scheduled backup, retention, parallel restore, verify. В mock-exams: [ops/02-pgbackrest](../postgresql-ops/02-pgbackrest.md), [ops/04-wal-g](../postgresql-ops/04-wal-g.md).

```bash
pgbackrest --stanza=main backup
pgbackrest --stanza=main restore --type=time --target="2026-06-25 13:55:00"
```

## Типичные ошибки

1. Base backup без проверки restore раз в квартал — «бэкап есть», PITR не работает.
2. `recovery_target_time` в local timezone без offset — промах на часы.
3. Archive gap — файл WAL потерян, recovery останавливается.
4. Promote тестового инстанса с тем же system identifier в сеть — split-brain.

## Чек-лист

- [ ] Base backup без WAL archive — PITR? (нет)
- [ ] Timezone в `recovery_target_time`
- [ ] RPO vs RTO своими словами
- [ ] pg_dump vs PITR — когда что
- [ ] `recovery.signal` vs обычный старт

## Дальше

Лаба-runbook: [10-lab-pitr.md](10-lab-pitr.md).

**Углубление:** [postgresql-ops](../postgresql-ops/README.md).
