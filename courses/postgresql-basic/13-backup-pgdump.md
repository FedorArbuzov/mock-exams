# 13. Логические бэкапы: pg_dump

## Сценарий с работы

«Сделайте бэкап перед релизом» — джун копирует папку `PGDATA` с работающего сервера. После рестарта кластер не поднимается: файлы несогласованны. Другой вариант: `pg_dump` в plain SQL на 800 ГБ — один файл, восстановление сутки. Третий: restore на Postgres 15 дамп с 16 — ошибки синтаксиса и расширений.

На уровне basic вы осваиваете **логический** бэкап: переносимый снимок схемы и данных через `pg_dump` / `pg_restore`. Physical backup и PITR — [intermediate/09-pitr](../postgresql-intermediate/09-pitr.md), [ops/02-pgbackrest](../postgresql-ops/02-pgbackrest.md).

## Что вы узнаете

- Logical vs physical vs snapshot backup
- Форматы `pg_dump` (-Fp, -Fc, -Fd, -Ft)
- Schema-only / data-only, дамп одной схемы `-n`
- `pg_restore` и параллелизм
- `pg_dumpall --globals-only` для ролей
- Ограничения logical dump

## Типы бэкапов

| Тип | Инструмент | Восстановление | PITR |
|-----|------------|----------------|------|
| **Logical** | pg_dump | pg_restore / psql | Нет |
| **Physical** | pg_basebackup, pgBackRest | recovery + WAL | Да |
| **Snapshot** | EBS, LVM, ZFS | mount + recovery | Зависит от WAL |

Logical — **медленнее** на огромных БД, но **гибче**: одна схема, только DDL, перенос между major (с оговорками).

## Форматы pg_dump

| Формат | Флаг | Файл | Особенности |
|--------|------|------|-------------|
| Plain SQL | `-Fp` (default) | `.sql` | `psql -f`; нет parallel restore |
| Custom | `-Fc` | `.dump` | Сжатие, выбор объектов, `-j` при restore |
| Directory | `-Fd` | каталог | Parallel dump и restore |
| Tar | `-Ft` | `.tar` | Реже |

**Рекомендация для ручных бэкапов схемы приложения:** `-Fc`.

```bash
pg_dump -Fc -f course.dump "postgresql://course:course@localhost:5432/course"

pg_dump -n shop -Fc -f shop.dump "postgresql://course:course@localhost:5432/course"
```

`-n shop` — только схема `shop` (таблицы, индексы, данные внутри схемы).

## Только схема / только данные

```bash
pg_dump --schema-only -n shop -Fc -f shop_schema.dump ...
pg_dump --data-only -n shop -Fc -f shop_data.dump ...
```

Полезно: накатить DDL на пустую БД, потом данные; или сравнить схемы между окружениями.

## pg_restore

```bash
createdb course_restored
pg_restore -d course_restored -j 4 course.dump
```

| Опция | Смысл |
|-------|-------|
| `-d` | Целевая БД |
| `-j N` | Parallel (custom/directory) |
| `-n shop` | Только схема shop из дампа |
| `--clean` | DROP перед CREATE (осторожно на проде) |
| `-l` | Список объектов в дампе |

Plain SQL:

```bash
pg_dump -Fp ... > dump.sql
psql -d course_restored -f dump.sql
```

## Роли и глобальные объекты

`pg_dump` одной БД **не** включает роли и tablespaces. Для них:

```bash
pg_dumpall --globals-only > globals.sql
psql -f globals.sql -d postgres   # на целевом кластере
```

После restore схемы `shop` роли `shop_reader` / `shop_writer` могут отсутствовать — пересоздайте или включите globals в процесс ([14-lab-backup](14-lab-backup.md)).

## Ограничения logical backup

| Ограничение | Деталь |
|-------------|--------|
| Время | Пропорционально объёму; блокировки лёгкие, но длинный dump на hot table |
| PITR | Только момент **окончания** dump, не «любая секунда» |
| Major version | Restore на **ту же или новее** major; down grade — нет |
| Расширения | Версии расширений должны совпадать на target |
| Очень большие БД | pgBackRest / physical + WAL |

**Не копируйте PGDATA** с работающего сервера без freeze — получите corrupt cluster.

## Стратегия для приложения «магазин»

1. Ежедневно: `pg_dump -Fc -n shop` (или весь `course` на стенде).
2. В CI: schema-only для review миграций.
3. Роли: `pg_dumpall --globals-only` в secure storage.
4. RTO/RPO для прода — physical + PITR ([ops](../postgresql-ops/README.md)).

## Типичные ошибки

1. Plain dump 500 GB в git LFS «на всякий случай».
2. Restore без ролей — `permission denied` везде.
3. `pg_restore` в ту же БД без `--clean` — duplicate object errors.
4. Ожидание PITR от pg_dump — нужен WAL archive.

## Чек-лист

- [ ] -Fc vs plain — когда что
- [ ] pg_dump vs pg_dumpall
- [ ] Почему logical ≠ PITR
- [ ] `-j` на pg_restore
- [ ] PGDATA copy на hot — почему нельзя

## Дальше

Лаба: [14-lab-backup.md](14-lab-backup.md).
