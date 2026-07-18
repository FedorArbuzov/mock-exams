# 13. Лаба: worker + SKIP LOCKED

## Зачем эта лаба

Два psql «worker» забирают разные задачи без блокировки — паттерн order fulfillment queue в shop.

## Предусловия

- [05-lab-liquibase](05-lab-liquibase.md) — `devapp_lb.tasks`
- [12-advisory-locks](12-advisory-locks.md)

## Задание 1. Подготовка задач

```sql
TRUNCATE devapp_lb.tasks RESTART IDENTITY;

INSERT INTO devapp_lb.tasks (payload, status) VALUES
  ('{"job": 1, "order_id": 101}', 'pending'),
  ('{"job": 2, "order_id": 102}', 'pending'),
  ('{"job": 3, "order_id": 103}', 'pending');
```

## Задание 2. Worker A (сессия 1)

```sql
BEGIN;

SELECT id, payload FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;
-- запомните id, например 1

UPDATE devapp_lb.tasks SET status = 'done' WHERE id = 1;

COMMIT;
```

**Не коммитьте** сразу — оставьте TX открытой для задания 3 (или используйте два терминала).

## Задание 3. Worker B (сессия 2)

Пока A в транзакции (или после commit A):

```sql
BEGIN;

SELECT id, payload FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

COMMIT;
```

Ожидание: Worker B получает **id=2** (не 1), без ожидания lock на row 1 если A ещё держит — SKIP LOCKED пропускает.

Запишите:

| Worker | id взят |
|--------|---------|
| A | |
| B | |

## Задание 4. Без SKIP LOCKED (сравнение)

Tabletop: Worker A держит `FOR UPDATE` на row 1. Worker B с `FOR UPDATE` без SKIP — **blocked**. Объясните в одном предложении зачем SKIP LOCKED.

## Задание 5. Advisory lock для cron

```sql
BEGIN;
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));
-- true = этот worker запускает отчёт
-- false = другой pod уже запустил
COMMIT;
```

Во второй сессии одновременно:

```sql
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));
```

Ожидание: один true, один false (в разных TX).

## Задание 6. Индекс (опционально)

```sql
CREATE INDEX IF NOT EXISTS tasks_pending_idx
  ON devapp_lb.tasks (id) WHERE status = 'pending';

EXPLAIN SELECT id FROM devapp_lb.tasks
WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;
```

## Troubleshooting

| Проблема | Fix |
|----------|-----|
| Оба взяли id=1 | SELECT вне TX или без SKIP |
| tasks not exist | liquibase update |
| try_advisory both true | разные ключи или после COMMIT |

## Критерии успеха

- [ ] Два worker — разные id
- [ ] SKIP LOCKED объяснён
- [ ] Advisory try lock продемонстрирован
- [ ] UPDATE status в той же TX

## Дальше

CI: [14-ci-migrations.md](14-ci-migrations.md).
