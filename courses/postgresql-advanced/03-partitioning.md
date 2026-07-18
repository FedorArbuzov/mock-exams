# 03. Партиционирование таблиц

## Сценарий с работы

Таблица `events` — 400 GB, 2 млрд строк. `DELETE FROM events WHERE created_at < now() - interval '90 days'` — 18 часов, bloat, replication lag. `VACUUM` не успевает. Архитектор предлагает партиционирование по месяцу: `DROP TABLE events_2024_01` — секунды.

**Declarative partitioning** (PG 10+) — стандарт для time-series и больших OLTP-логов в Postgres.

## Что вы узнаете

- RANGE / LIST / HASH — когда какой
- Partition pruning в EXPLAIN
- Операции: CREATE, ATTACH, DROP partition
- Ограничения PK/UNIQUE/FK
- Индексы на partitioned tables

## Зачем партиционировать

| Проблема без партиций | С партициями |
|----------------------|--------------|
| DELETE старых данных — долго | DROP partition — metadata op |
| VACUUM на всей таблице | По партиции, меньшие куски |
| Индекс на 400 GB | Индекс per partition |
| Backup одной партиции | Возможен tablespace per partition |

Не партиционируйте «на будущее» таблицу на 100k строк — overhead планировщика и DDL.

## Declarative partitioning

```sql
CREATE TABLE events (
  id         bigserial,
  created_at timestamptz NOT NULL,
  payload    jsonb
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_05 PARTITION OF events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE events_2026_06 PARTITION OF events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

INSERT в parent — маршрутизация по ключу. INSERT без подходящей партиции — **ошибка**.

## Стратегии

| Метод | Ключ | Use case |
|-------|------|----------|
| **RANGE** | дата, id range | логи, метрики, заказы по месяцу |
| **LIST** | region, tenant_id | мульти-регион, enum-like |
| **HASH** | hash(id) | равномерный sharding без времени |

```sql
-- LIST example
CREATE TABLE orders (...)
PARTITION BY LIST (region);

CREATE TABLE orders_eu PARTITION OF orders FOR VALUES IN ('eu', 'uk');
```

## Partition pruning

```sql
EXPLAIN SELECT count(*) FROM events
WHERE created_at >= '2026-05-10' AND created_at < '2026-05-20';
```

В плане — **только** `events_2026_05`, не Seq Scan всех партиций.

Pruning требует:

- условие на **ключ партиционирования** (явное или inferable);
- `enable_partition_pruning = on` (default).

Без pruning — партиционирование бесполезно для read.

## Управление жизненным циклом

```sql
-- заранее (cron / migration job)
CREATE TABLE events_2026_07 PARTITION OF events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- удаление месяца
DROP TABLE events_2025_01;

-- attach существующей таблицы (миграция)
CREATE TABLE events_legacy (...) ;
ALTER TABLE events ATTACH PARTITION events_legacy
  FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');
```

**Default partition** — ловит строки вне диапазонов; удобно, но ломает pruning для «лишних» данных.

## Индексы

```sql
CREATE INDEX ON events (created_at);
```

Создаётся **partitioned index** — на каждой партиции свой B-tree. `CREATE INDEX CONCURRENTLY` на parent — PG 14+.

## Ограничения

| Ограничение | Правило |
|-------------|---------|
| PRIMARY KEY / UNIQUE | Должны включать **все** колонки ключа партиционирования |
| FOREIGN KEY **на** partitioned | PG 12+ с ограничениями |
| FOREIGN KEY **с** partitioned | Сложнее — часто FK на parent |
| Global uniqueness без partition key | Невозможно на parent — дизайн заново |

```sql
-- OK
PRIMARY KEY (created_at, id)

-- NOT OK на RANGE(created_at)
PRIMARY KEY (id)  -- error
```

## Типичные ошибки

1. Забыли создать партицию на следующий месяц — INSERT падает 1-го числа.
2. Default partition принимает всё — pruning не работает для «мусора».
3. PK только на `id` — DDL не создастся.
4. 1000 партиций — overhead планировщика; sub-partitioning или другой ключ.

## Чек-лист

- [ ] PARTITION BY RANGE — пример под ваш домен
- [ ] DROP partition vs DELETE миллионов строк
- [ ] Pruning виден в EXPLAIN
- [ ] PK без partition key — можно? (нет)
- [ ] Cron на CREATE будущих партиций

## Дальше

Лаба: [04-lab-partitioning.md](04-lab-partitioning.md).
