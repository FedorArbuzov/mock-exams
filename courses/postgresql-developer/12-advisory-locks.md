# 12. Advisory locks и очереди

## Сценарий с работы

Три pod worker обрабатывают `pending` заказы. Без координации два worker берут один order — двойная отправка на склад. `SELECT ... FOR UPDATE` без `SKIP LOCKED` — второй worker **ждёт** lock, throughput падает. Решение: **очередь на `FOR UPDATE SKIP LOCKED`** + advisory lock для nightly cron «только один инстанс».

Паттерн нативный для Postgres — без Redis для простых job queues.

**Связь:** [05-lab-liquibase](05-lab-liquibase.md) (`devapp_lb.tasks`), [python-async](../python-async/README.md).

## Что вы узнаете

- Session vs transaction advisory locks
- `pg_try_advisory_lock`
- Очередь `FOR UPDATE SKIP LOCKED`
- Advisory vs row locks

## Advisory locks

Логический lock по **числовому ключу** — не привязан к таблице.

```sql
-- session level — до disconnect или unlock
SELECT pg_advisory_lock(42);
SELECT pg_try_advisory_lock(42);  -- false если занят, не ждёт
SELECT pg_advisory_unlock(42);

-- transaction level — до COMMIT
SELECT pg_advisory_xact_lock(42);

-- два int32 ключа
SELECT pg_advisory_lock(1, 100);

-- hash строки
SELECT pg_advisory_xact_lock(hashtext('nightly-report'));
```

| Функция | Блокировка |
|---------|------------|
| `pg_advisory_lock` | Session, ждёт |
| `pg_try_advisory_lock` | Session, не ждёт |
| `pg_advisory_xact_lock` | Transaction |
| `pg_advisory_unlock` | Только session lock |

### Когда advisory

| Use case | Пример |
|----------|--------|
| Cron singleton | Только один pod nightly ETL |
| Migration guard | Flyway + advisory в custom runner |
| App-level mutex | `hashtext('import-' || tenant_id)` |

**Риск session lock:** забыли `unlock` — держит до disconnect. Предпочитайте **xact lock**.

## Очередь на SKIP LOCKED

```sql
BEGIN;

SELECT id, payload
FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

-- worker получил id=7
UPDATE devapp_lb.tasks SET status = 'processing' WHERE id = 7;

COMMIT;
```

```text
Worker A: FOR UPDATE → lock row 1
Worker B: SKIP LOCKED → skip row 1, lock row 2
Worker C: SKIP LOCKED → lock row 3
```

Без `SKIP LOCKED` Worker B **blocked** на row 1.

## Полный worker pattern

```sql
BEGIN;
WITH picked AS (
  SELECT id FROM devapp_lb.tasks
  WHERE status = 'pending'
  ORDER BY created_at NULLS LAST, id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE devapp_lb.tasks t
SET status = 'processing', started_at = now()
FROM picked
WHERE t.id = picked.id
RETURNING t.id, t.payload;
COMMIT;
```

После обработки:

```sql
UPDATE devapp_lb.tasks SET status = 'done', finished_at = now() WHERE id = $1;
```

Failed jobs — `status = 'failed'` + retry policy.

## Advisory vs row lock

| | Advisory | FOR UPDATE row |
|---|----------|----------------|
| Объект | int key | конкретная строка |
| Видимость в pg_locks | advisory | transactionid + tuple |
| Deadlock на rows | нет | возможен |
| Очередь задач | не подходит alone | SKIP LOCKED ✅ |
| Singleton cron | ✅ | overkill |

## vs Redis / SQS

| | Postgres queue | Redis/SQS |
|---|----------------|-----------|
| Extra infra | Нет | Да |
| Throughput | Умеренный | Высокий |
| ACID с order | ✅ same TX | Outbox pattern |
| Visibility timeout | DIY | Built-in |

Для shop MVP — Postgres queue часто достаточно.

## Типичные ошибки

1. `FOR UPDATE` без SKIP LOCKED — workers serial.
2. SELECT вне транзакции — race между SELECT и UPDATE.
3. Session advisory lock без unlock в finally.
4. Нет индекса на `(status, id)` — slow dequeue.
5. Долгая обработка внутри TX — держит row lock.

## Чек-лист

- [ ] xact lock vs session lock
- [ ] SKIP LOCKED для workers
- [ ] UPDATE в той же транзакции
- [ ] Индекс на status для dequeue
- [ ] Advisory для cron singleton

## Дальше

Лаба: [13-lab-advisory-locks.md](13-lab-advisory-locks.md).
