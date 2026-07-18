# 04. Лаба: declarative partitioning

## Зачем эта лаба

Вы создадите partitioned table `metrics`, наполните данными, увидите **pruning** в EXPLAIN и сравните `DROP PARTITION` с массовым DELETE по времени.

## Предусловия

- Стенд [`deploy/postgres`](../../deploy/postgres/README.md)
- Подключение как `course`

## Задание 1. Parent и партиции

```sql
CREATE SCHEMA IF NOT EXISTS advanced_lab;

CREATE TABLE advanced_lab.metrics (
  id    bigserial,
  ts    timestamptz NOT NULL,
  value double precision
) PARTITION BY RANGE (ts);

CREATE TABLE advanced_lab.metrics_2026_w20 PARTITION OF advanced_lab.metrics
  FOR VALUES FROM ('2026-05-12') TO ('2026-05-19');

CREATE TABLE advanced_lab.metrics_2026_w21 PARTITION OF advanced_lab.metrics
  FOR VALUES FROM ('2026-05-19') TO ('2026-05-26');
```

Проверка:

```sql
SELECT inhrelid::regclass AS partition
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
WHERE parent.relname = 'metrics';
```

## Задание 2. Данные

```sql
INSERT INTO advanced_lab.metrics (ts, value)
SELECT '2026-05-15'::timestamptz + (g || ' minutes')::interval,
       random()
FROM generate_series(1, 5000) g;

INSERT INTO advanced_lab.metrics (ts, value)
SELECT '2026-05-22'::timestamptz + (g || ' minutes')::interval,
       random()
FROM generate_series(1, 5000) g;
```

## Задание 3. Partition pruning

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM advanced_lab.metrics
WHERE ts >= '2026-05-20' AND ts < '2026-05-26';
```

**Ожидание:** в плане только `metrics_2026_w21`, не w20.

Сравните с запросом без фильтра по `ts`:

```sql
EXPLAIN SELECT count(*) FROM advanced_lab.metrics;
```

Должны сканироваться **обе** партиции (Append).

## Задание 4. INSERT вне диапазона

```sql
INSERT INTO advanced_lab.metrics (ts, value)
VALUES ('2026-01-01', 1.0);
```

**Ожидание:** `no partition of relation ... found for row`.

Создайте default или нужную партицию — исправьте.

## Задание 5. DROP vs DELETE

Замерьте размер w20:

```sql
SELECT pg_size_pretty(pg_relation_size('advanced_lab.metrics_2026_w20'));
```

**Вариант A — DROP:**

```sql
DROP TABLE advanced_lab.metrics_2026_w20;
```

Мгновенно. Parent больше не включает w20.

**Вариант B (если не дропали)** — для сравнения на копии:

```sql
-- на отдельной тестовой таблице, не на проде
DELETE FROM advanced_lab.metrics WHERE ts < '2026-05-19';
-- + VACUUM — долго на больших объёмах
```

Запишите вывод: когда DROP предпочтительнее.

## Задание 6. Индекс на parent

```sql
CREATE INDEX metrics_ts_idx ON advanced_lab.metrics (ts);

EXPLAIN SELECT * FROM advanced_lab.metrics
WHERE ts BETWEEN '2026-05-19' AND '2026-05-20';
```

Индекс создан на каждой оставшейся партиции.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Нет pruning | Условие не на `ts`; `constraint_exclusion` |
| DROP parent | DROP только child partitions |
| duplicate partition bound | Проверьте FROM/TO границы |

## Критерии успеха

- [ ] EXPLAIN с фильтром — одна партиция
- [ ] INSERT вне range — ошибка (до fix)
- [ ] DROP partition выполнен
- [ ] Понимаете Append без фильтра на ключ

## Дальше

Расширения: [05-extensions.md](05-extensions.md).
