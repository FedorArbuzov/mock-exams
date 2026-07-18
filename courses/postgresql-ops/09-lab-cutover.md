# 09. Лаба: cutover (симуляция)

## Зачем эта лаба

Полный blue/green кластер дорог локально. Симуляция **двух схем** blue/green в одной БД учит freeze → final sync → switch → rollback — мышление cutover без второго Postgres.

## Предусловия

- Стенд Postgres, роль `course`

## Задание 1. Две схемы

```sql
CREATE SCHEMA IF NOT EXISTS blue;
CREATE SCHEMA IF NOT EXISTS green;

DROP TABLE IF EXISTS green.orders;
DROP TABLE IF EXISTS blue.orders;

CREATE TABLE blue.orders (
  id     serial PRIMARY KEY,
  amount numeric(10,2) NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE green.orders (LIKE blue.orders INCLUDING ALL);

INSERT INTO blue.orders (amount) VALUES (10), (20), (30);
```

## Задание 2. «Репликация» и drift

```sql
-- initial sync
INSERT INTO green.orders SELECT * FROM blue.orders;

-- новые записы только в blue (симуляция prod)
INSERT INTO blue.orders (amount) VALUES (40);
UPDATE blue.orders SET amount = 15 WHERE id = 1;
```

## Задание 3. Cutover window

Документируйте и выполните:

```sql
-- Step 1: freeze writes (в реале — app maintenance)
-- Step 2: final sync
INSERT INTO green.orders (id, amount, updated_at)
SELECT b.id, b.amount, b.updated_at
FROM blue.orders b
WHERE NOT EXISTS (SELECT 1 FROM green.orders g WHERE g.id = b.id);

UPDATE green.orders g
SET amount = b.amount, updated_at = b.updated_at
FROM blue.orders b
WHERE g.id = b.id AND (g.amount IS DISTINCT FROM b.amount);

-- Step 3: verify counts
SELECT 'blue' AS side, count(*) FROM blue.orders
UNION ALL
SELECT 'green', count(*) FROM green.orders;

-- Step 4: app "switches" to green.orders
```

## Задание 4. Runbook

`cutover-runbook.md` ≥ 8 шагов:

1. Announce maintenance
2. Enable read-only on blue (app)
3. Wait in-flight transactions
4. Final sync SQL
5. Verify row counts / checksum sample
6. Switch connection string to green
7. Smoke tests
8. Rollback path if smoke fails

## Задание 5. Rollback

Опишите: smoke test failed — как вернуть app на `blue.orders` за < 5 минут.

## Задание 6. Read-only window

Оцените в секундах, сколько длился ваш cutover (sync only). В проде добавьте DNS TTL, pool drain.

## Критерии успеха

- [ ] blue/green counts match after sync
- [ ] Runbook ≥ 8 шагов
- [ ] Rollback documented
- [ ] Понимаете отличие от реального logical replication

## Дальше

On-call: [10-oncall-runbooks.md](10-oncall-runbooks.md).
