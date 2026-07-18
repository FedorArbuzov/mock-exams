# 12. Лаба: разбор инцидента

## Зачем эта лаба

Воспроизведение blocking и deadlock в двух сессиях `psql` + incident report — навык on-call. Шаблон postmortem пригодится в [15-final-project](15-final-project.md).

## Предусловия

- Схема `shop`
- Два терминала `psql` как `course`

## Сценарий A: DDL blocked by idle transaction

### Сеанс 1

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
-- или просто BEGIN; SELECT 1;
-- НЕ COMMIT — имитация idle in transaction
```

Проверьте:

```sql
SELECT pid, state FROM pg_stat_activity WHERE pid = pg_backend_pid();
```

### Сеанс 2

```sql
ALTER TABLE shop.products ADD COLUMN promo text;
```

Должен **висеть** (ждёт lock).

### Сеанс 3 (третий или Сеанс 2 в другом окне)

Запрос из [11-troubleshooting](11-troubleshooting.md) — blocked/blocking.

Запишите `blocked_pid`, `blocking_pid`, `blocking_state`.

### Разрешение

**Сеанс 1:** `ROLLBACK;`

**Сеанс 2:** ALTER должен завершиться.

### Профилактика (письменно)

- `idle_in_transaction_session_timeout`
- `lock_timeout` на миграциях
- Не запускать DDL в пик

## Сценарий B: deadlock

**Сеанс 1:**

```sql
BEGIN;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 1;
```

**Сеанс 2:**

```sql
BEGIN;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 2;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 1;  -- ждёт сеанс 1
```

**Сеанс 1:**

```sql
UPDATE shop.orders SET qty = qty + 1 WHERE id = 2;  -- deadlock
```

**Ожидание:** один сеанс получит `deadlock detected`, другой COMMIT успешен.

Включите в логах (если ещё нет):

```sql
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';
SELECT pg_reload_conf();
```

`docker logs mock-postgres | grep -i deadlock`

## Deliverable: incident report

Создайте `docs/incident-2026-blocking.md`:

```markdown
# Incident: Migration blocked by idle transaction

## Timeline (UTC)
- 14:00 — deploy migration promo column
- 14:05 — API p99 > 30s
- 14:12 — on-call identified blocking_pid

## Impact
- Duration, affected services

## Root cause
- BI script idle in transaction since 09:00

## Resolution
- pg_terminate_backend(...) / ROLLBACK

## Prevention
- idle_in_transaction_session_timeout = 5min
- lock_timeout on migration role
- CI migration window

## Lessons learned
```

Заполните реальными PID и временем из лабы.

## Сценарий C (опционально): pg_cancel_backend

На зависшем SELECT (не idle):

```sql
SELECT pg_cancel_backend(<blocked_pid>);
```

Сравните с terminate.

## Критерии успеха

- [ ] Воспроизвели blocking ALTER + open txn
- [ ] Нашли blocking_pid SQL-запросом
- [ ] Deadlock пойман или описан expected behavior
- [ ] Incident doc ≥ 6 секций заполнен

## Дальше

Cloud/K8s: [13-cloud-k8s.md](13-cloud-k8s.md).
