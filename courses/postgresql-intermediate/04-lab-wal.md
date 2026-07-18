# 04. Лаба: WAL и pg_current_wal_lsn

## Зачем эта лаба

LSN и сегменты WAL — абстракция, пока не увидишь, как меняется `pg_current_wal_lsn()` после записи и что `pg_switch_wal()` создаёт новый файл в `pg_wal`. Это язык репликации и PITR.

## Предусловия

- Стенд запущен, `wal_level` ≥ `replica` ([02-lab-configuration](02-lab-configuration.md)).
- Подключение как `course`.

## Задание 1. Текущая позиция WAL

```sql
SELECT pg_current_wal_lsn() AS lsn_before;
SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file;
```

Запишите `lsn_before` и имя файла (например `000000010000000000000001`).

## Задание 2. Запись данных и новый LSN

```sql
INSERT INTO shop.products (sku, name, price)
VALUES ('wal-lab-' || floor(random()*1000), 'WAL test', 1.00);

SELECT pg_current_wal_lsn() AS lsn_after;
```

**Ожидание:** `lsn_after` ≥ `lsn_before` (строго больше при реальной записи).

## Задание 3. Принудительное переключение сегмента

```sql
SELECT pg_switch_wal();
SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file_after_switch;
```

Имя файла может смениться на следующий сегмент.

## Задание 4. Размер каталога pg_wal

```bash
docker exec mock-postgres du -sh /var/lib/postgresql/data/pg_wal
docker exec mock-postgres ls /var/lib/postgresql/data/pg_wal | wc -l
```

На учебном стенде — десятки–сотни мегабайт, несколько файлов. Запомните порядок величины для сравнения при инциденте.

## Задание 5. Архивация — письменное задание

Создайте файл `wal-archive-notes.md` (локально, для себя) с ответами:

1. Как включить `archive_mode` и `archive_command` на production.
2. Куда складывать WAL: S3, NFS, MinIO ([deploy/postgres ops compose](../../deploy/postgres/README.md)).
3. Что мониторить в `pg_stat_archiver`.
4. Как replication slot влияет на размер `pg_wal`.

Пример `archive_command` для S3 (псевдокод):

```bash
archive_command = 'aws s3 cp %p s3://my-bucket/pg-wal/%f'
```

## Задание 6. Слоты (просмотр)

```sql
SELECT * FROM pg_replication_slots;
```

На чистом стенде — пусто или слоты от прошлых экспериментов. После [08-lab-logical-replication](08-lab-logical-replication.md) появится logical slot.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `function pg_switch_wal() does not exist` | Очень старая версия; в PG 16 есть |
| LSN не меняется | Транзакция не закоммичена; `INSERT` в autocommit |
| Нет shop.products | [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md) |

## Критерии успеха

- [ ] LSN меняется после INSERT
- [ ] `pg_switch_wal()` выполнен, файлы в pg_wal осмысленны
- [ ] Знаете размер pg_wal на стенде
- [ ] Есть заметки про archive для production

## Дальше

Streaming replication: [05-streaming-replication.md](05-streaming-replication.md).
