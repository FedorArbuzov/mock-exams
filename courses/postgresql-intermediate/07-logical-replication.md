# 07. Logical replication

## Сценарий с работы

Нужно скопировать в warehouse **только** `orders` и `order_items`, а не весь кластер с `pg_catalog` и сотней БД. Physical replica не подходит. Или миграция PG 15 → 16: logical replication на новый кластер, cutover, откат. Третий кейс: `ALTER TABLE ADD COLUMN` на primary — subscriber **не** получил DDL, pipeline сломался.

Logical replication работает на уровне **строк и таблиц** через publication/subscription. Дороже в эксплуатации, гибче по сценарию.

## Что вы узнаете

- Отличия physical vs logical
- Publication и subscription
- Use cases: upgrade, warehouse, частичная репликация
- Replication slots (logical) и WAL
- Мониторинг и конфликты

## Physical vs logical

| | Physical (streaming) | Logical |
|---|---------------------|---------|
| Гранулярность | Весь кластер (байты WAL) | Выбранные таблицы |
| DDL | Реплицируется | **Не** реплицируется автоматически |
| Версии PG | Обычно same major | Часто upgrade cross-major (тестировать) |
| Конфликты | Нет на уровне строк | Возможны на subscriber |
| Настройка | `pg_basebackup` | `CREATE PUBLICATION` + `CREATE SUBSCRIPTION` |

`wal_level` на primary: **`logical`**.

## Publication

```sql
CREATE PUBLICATION shop_pub FOR TABLE shop.products, shop.orders;
```

Или все таблицы в схеме (осторожно):

```sql
CREATE PUBLICATION shop_all FOR ALL TABLES IN SCHEMA shop;
```

`FOR ALL TABLES` — новые таблицы попадают автоматически; на subscriber нужна схема и структура.

Просмотр:

```sql
SELECT * FROM pg_publication_tables;
```

## Subscription

На **другой** БД (та же или другой кластер):

```sql
CREATE SUBSCRIPTION shop_sub
  CONNECTION 'host=primary port=5432 dbname=course user=course password=course'
  PUBLICATION shop_pub
  WITH (copy_data = true, slot_name = shop_sub_slot);
```

| Опция | Смысл |
|-------|-------|
| `copy_data = true` | Initial sync — COPY существующих строк |
| `slot_name` | Имя logical replication slot на primary |
| `create_slot = true` | Создать slot (default) |

Таблицы на subscriber должны **существовать** с совместимой структурой (не обязательно индексы).

```sql
CREATE TABLE shop.products (LIKE shop.products INCLUDING ALL);
```

На **том же** кластере для лабы — отдельная БД `course_sub`, не только schema.

## Use cases

1. **Major upgrade** — logical → новый кластер, switch DNS, drop old.
2. **Warehouse / CDC** — Debezium, analytics DB, только факты.
3. **Multi-tenant extract** — publication с фильтром (PG 15+ `FOR TABLE ... WHERE`).

**Не** use case по умолчанию: HA вместо physical — для HA берите streaming + Patroni.

## Слоты и WAL

Logical slot удерживает WAL до доставки decoder. Мёртвый subscription = растущий `pg_wal` ([03-wal](03-wal.md)).

```sql
SELECT slot_name, slot_type, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots;
```

Удаление:

```sql
DROP SUBSCRIPTION shop_sub;  -- снимает subscription
-- slot на primary может остаться — DROP SLOT вручную
```

## Мониторинг

```sql
SELECT subname, pid, received_lsn, latest_end_lsn, last_msg_send_time, last_msg_receipt_time
FROM pg_stat_subscription;

SELECT * FROM pg_stat_subscription_stats;
```

Состояния worker: `streaming`, `syncing`, ошибки в логах subscriber.

## Конфликты

На subscriber при `INSERT`/`UPDATE`, конфликтующем с существующими данными:

```sql
-- на subscriber
ALTER SUBSCRIPTION shop_sub DISABLE;
-- починить данные
ALTER SUBSCRIPTION shop_sub ENABLE;
```

Стратегии: `disable`, skip, transform — зависит от версии и настроек. Для production — чёткий playbook.

## Типичные ошибки

1. DDL на primary без ручного применения на subscriber.
2. `wal_level=replica` — logical не стартует.
3. Subscription на той же таблице без отдельной БД — путаница.
4. Забыли удалить slot — диск primary забит.

## Чек-лист

- [ ] DDL реплицируется? (нет)
- [ ] Когда logical лучше physical
- [ ] Пример конфликта на subscriber
- [ ] `FOR ALL TABLES` — риск
- [ ] Связь slot и размера WAL

## Дальше

Лаба: [08-lab-logical-replication.md](08-lab-logical-replication.md).
