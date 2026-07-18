# 12. Лаба: видимость транзакций

## Зачем эта лаба

MVCC из [11-transactions-mvcc](11-transactions-mvcc.md) легко прочитать и забыть. Два окна `psql` показывают **незакоммиченные** изменения, разницу Read Committed vs Repeatable Read, рост `n_dead_tup`, как idle in transaction мешает VACUUM, и блокировку `FOR UPDATE` — то, что DBA ищет в проде при «диск растёт» и «vacuum не помогает».

## Предусловия

- Схема `shop` с `products` и `orders` ([04-lab-ddl](04-lab-ddl.md)).
- **Два терминала** (или вкладки) с `psql` к одной БД `course`.

Подключение в обоих:

```bash
psql "postgresql://course:course@localhost:5432/course"
```

Пометьте сеансы: **A** и **B**. В каждом задании явно указано, кто что делает — не путайте окна.

## Задание 1. Незакоммиченный UPDATE невидим до COMMIT

**Сеанс A:**

```sql
BEGIN;
UPDATE shop.products SET price = price + 1 WHERE id = 1;
SELECT price FROM shop.products WHERE id = 1;  -- новая цена (внутри транзакции)
-- НЕ делайте COMMIT пока
```

**Сеанс B** (пока A открыт):

```sql
SELECT price FROM shop.products WHERE id = 1;
```

**Ожидание (Read Committed):** B видит **старую** цену — незакоммиченные изменения A изолированы. A внутри своей транзакции уже видит +1 — это её snapshot.

**Сеанс A:**

```sql
COMMIT;
```

**Сеанс B:**

```sql
SELECT price FROM shop.products WHERE id = 1;
```

Теперь B видит **новую** цену.

**Что запомнить:** MVCC не блокирует читателя — B просто видит **старую версию** строки, пока A не сделала COMMIT.

## Задание 2. Read Committed — count меняется внутри транзакции

Это поведение из теории, которое часто удивляет разработчиков.

**Сеанс A:**

```sql
BEGIN;
SELECT count(*) FROM shop.orders;  -- запомните число, например 50002
```

**Сеанс B:**

```sql
INSERT INTO shop.orders (product_id, qty) VALUES (1, 1);
COMMIT;
```

**Сеанс A** (та же транзакция, без нового BEGIN):

```sql
SELECT count(*) FROM shop.orders;  -- на 1 больше!
COMMIT;
```

**Вывод:** Read Committed делает **новый snapshot на каждый statement**. Второй SELECT видит закоммиченный INSERT от B. Если вам нужны одинаковые цифры во всех SELECT — используйте Repeatable Read (задание 3).

## Задание 3. Repeatable Read — snapshot на всю транзакцию

**Сбросьте цену для чистого эксперимента (любой сеанс):**

```sql
UPDATE shop.products SET price = 100 WHERE id = 1;
```

**Сеанс B:**

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT price FROM shop.products WHERE id = 1;  -- 100, запомните
```

**Сеанс A:**

```sql
BEGIN;
UPDATE shop.products SET price = price + 50 WHERE id = 1;
COMMIT;
```

**Сеанс B** (та же RR-транзакция, без нового BEGIN):

```sql
SELECT price FROM shop.products WHERE id = 1;  -- всё ещё 100
COMMIT;
```

**Сеанс B** (новая транзакция):

```sql
SELECT price FROM shop.products WHERE id = 1;  -- теперь 150
```

**Вывод:** Repeatable Read «замораживает» картину на момент первого запроса в транзакции. Подходит для отчётов из нескольких SELECT, но **не держите** такую транзакцию часами.

## Задание 4. Транзакция «всё или ничего»

Проверьте атомарность на учебных счетах:

```sql
CREATE TABLE IF NOT EXISTS shop.accounts (
  id      int PRIMARY KEY,
  balance numeric(10,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO shop.accounts (id, balance) VALUES (1, 1000), (2, 500)
ON CONFLICT (id) DO NOTHING;
```

**Успешный перевод:**

```sql
BEGIN;
UPDATE shop.accounts SET balance = balance - 100 WHERE id = 1;
UPDATE shop.accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

SELECT * FROM shop.accounts ORDER BY id;
-- 900 и 600
```

**Откат при ошибке:**

```sql
BEGIN;
UPDATE shop.accounts SET balance = balance - 900 WHERE id = 1;
UPDATE shop.accounts SET balance = balance - 900 WHERE id = 2;  -- CHECK violation: balance >= 0
-- ERROR
ROLLBACK;

SELECT * FROM shop.accounts ORDER BY id;
-- снова 900 и 600 — первый UPDATE тоже откатился
```

**Вывод:** без `BEGIN`/`COMMIT` первый UPDATE уже был бы виден другим клиентам до ошибки во втором.

## Задание 5. Dead tuples от UPDATE

В одном сеансе:

```sql
SELECT n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';

DO $$
BEGIN
  FOR i IN 1..100 LOOP
    UPDATE shop.products SET price = price + 0.01 WHERE id = 1;
  END LOOP;
END $$;

SELECT n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

`n_dead_tup` должен вырасти — каждый UPDATE создал новую версию строки, старые стали «мёртвыми». `n_live_tup` при этом ~1 (одна живая версия на id=1).

Очистка:

```sql
VACUUM shop.products;

SELECT n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

`n_dead_tup` после VACUUM — ближе к 0.

**Что запомнить:** DELETE не «удаляет байты с диска» — помечает версию мёртвой. VACUUM убирает то, что уже никто не может увидеть.

## Задание 6. idle in transaction блокирует VACUUM

Покажем, почему «BI ушёл на обед с открытым BEGIN» — проблема для всего кластера.

**Сеанс A:**

```sql
BEGIN;
SELECT price FROM shop.products WHERE id = 1;
-- НЕ COMMIT — имитация «открыл отчёт и отошёл»
```

**Сеанс B** — создайте dead tuples:

```sql
UPDATE shop.products SET price = price + 0.01 WHERE id = 2;
UPDATE shop.products SET price = price + 0.01 WHERE id = 2;
UPDATE shop.products SET price = price + 0.01 WHERE id = 2;
```

**Сеанс B** — проверка:

```sql
SELECT n_dead_tup FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';

VACUUM shop.products;

SELECT n_dead_tup FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
-- dead tuples для id=2 могли уменьшиться
```

**Сеанс A** — всё ещё открыт. **Сеанс B:**

```sql
UPDATE shop.products SET price = price + 0.01 WHERE id = 1;
VACUUM shop.products;
SELECT n_dead_tup FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

Пока A держит открытую транзакцию, VACUUM **не может** убрать dead tuples для строк, которые A потенциально «ещё видит» (включая id=1). `n_dead_tup` может оставаться > 0.

**Сеанс A:**

```sql
ROLLBACK;
```

**Сеанс B:**

```sql
VACUUM shop.products;
SELECT n_dead_tup FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
-- теперь должно очиститься лучше
```

**Сеанс B** — найдите виновника:

```sql
SELECT pid, usename, state, xact_start, left(query, 50)
FROM pg_stat_activity
WHERE datname = 'course' AND state = 'idle in transaction';
```

## Задание 7. Блокировка FOR UPDATE

**Сеанс A:**

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
-- «Забронировал» строку — другие UPDATE ждут
```

**Сеанс B:**

```sql
BEGIN;
UPDATE shop.products SET price = 0 WHERE id = 1;
-- Запрос «висит» — ждёт COMMIT/ROLLBACK от A
```

Наблюдайте ожидание в B (можно `\watch 1` в третьем окне на `pg_locks`).

**Сеанс A:**

```sql
COMMIT;
```

B продолжит и выполнит UPDATE.

**Вывод:** обычный SELECT не блокирует UPDATE (MVCC). `FOR UPDATE` — явная блокировка, нужна когда «прочитал → проверил → изменил» и нельзя допустить гонку.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| B сразу видит цену A | A уже сделал COMMIT; начните заново с `BEGIN` |
| Count не меняется в задании 2 | A уже в Repeatable Read; сделайте `COMMIT` и новый `BEGIN` |
| Нет idle in transaction | A закрыл транзакцию; повторите BEGIN без COMMIT |
| UPDATE в B не ждёт | Нет FOR UPDATE в A; или разные `id` |
| `n_dead_tup` не растёт | Выполните `UPDATE price = price + 0.01`, не `price = price` — PG иногда пропускает no-op |
| CHECK error в задании 4 | Ожидаемо — демонстрация ROLLBACK |

## Критерии успеха

- [ ] До COMMIT B не видел изменение A (Read Committed)
- [ ] В задании 2 count **изменился** внутри одной RC-транзакции
- [ ] В Repeatable Read цена **не менялась** до COMMIT
- [ ] ROLLBACK откатил оба UPDATE в переводе денег
- [ ] `n_dead_tup` рос и уменьшился после VACUUM
- [ ] idle in transaction мешал очистке dead tuples
- [ ] FOR UPDATE заблокировал UPDATE в другой сессии

## Дальше

Логические бэкапы: [13-backup-pgdump.md](13-backup-pgdump.md).
