# 03. Лаба: pgBackRest

## Зачем эта лаба

Полный pgBackRest в Docker — опционально; **обязательно** — tabletop RPO/RTO, разбор конфига и `pg_basebackup` как основа physical backup.

## Предусловия

- Стенд [`deploy/postgres`](../../deploy/postgres/README.md)
- Прочитаны [01-backup-landscape](01-backup-landscape.md), [02-pgbackrest](02-pgbackrest.md)

## Задание 1. Разбор pgbackrest.conf

Откройте [`examples/pgbackrest/pgbackrest.conf`](examples/pgbackrest/pgbackrest.conf).

Документ `pgbackrest-tabletop.md`:

1. Нарисуйте путь: **primary → archive-push → repo → restore**.
2. Что делает `stanza-create`, `backup`, `restore --type=time`?
3. Где в Postgres включается `archive_mode`?

## Задание 2. Таблица RPO/RTO

Для условного prod (shop API, 200 GB):

| Backup type | Frequency | Retention | RPO contribution |
|-------------|-----------|-----------|------------------|
| full | weekly | 4 weeks | |
| diff | daily | | |
| WAL archive | continuous | 7 days | |
| pg_dump logical | daily | 30 days | portability |

Заполните и укажите **итоговый RPO** и **RTO** (оценка restore time).

## Задание 3. pg_basebackup (hands-on)

```bash
docker exec mock-postgres pg_basebackup -U course -D /tmp/basebackup -Fp -Xs -P
docker exec mock-postgres du -sh /tmp/basebackup
docker exec mock-postgres ls /tmp/basebackup | head -20
```

Сравните с logical dump:

```bash
docker exec mock-postgres pg_dump -U course -Fc -f /tmp/course.dump course
docker exec mock-postgres ls -lh /tmp/course.dump
```

| | pg_basebackup | pg_dump -Fc |
|---|---------------|-------------|
| Время (запишите) | | |
| Размер | | |
| PITR possible? | с WAL | нет |

## Задание 4. Restore drill outline

5 шагов quarterly drill (текстом):

```text
1. Поднять изолированный VM/container
2. pgbackrest restore --type=time ... (или pg_basebackup + WAL)
3. start Postgres, pg_is_in_recovery / promote
4. SELECT count(*) sanity checks
5. Document duration → RTO actual
```

## Задание 5. Опционально — pgBackRest container

Для продвинутых: sidecar с pgBackRest + volume PGDATA — зафиксируйте `stanza-create` и `backup` output в лог.

## Критерии успеха

- [ ] Диаграмма WAL → repo
- [ ] Таблица RPO/RTO заполнена
- [ ] `pg_basebackup` выполнен
- [ ] Restore drill outline ≥ 5 шагов

## Дальше

WAL-G: [04-wal-g.md](04-wal-g.md).
