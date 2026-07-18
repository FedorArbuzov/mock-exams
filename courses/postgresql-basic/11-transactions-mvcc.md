# 11. Транзакции и MVCC

## Сценарий с работы

Поддержка жалуется: «цена в каталоге прыгает». Оказалось — два UPDATE без транзакции в скрипте миграции и кэш приложения. Другой инцидент: диск растёт, autovacuum не успевает — сессия BI оставила `BEGIN; SELECT ...` и ушла на обед (**idle in transaction** 4 часа). Третий кейс: «фантомные» строки в отчёте — уровень изоляции Read Committed, а разработчик ожидал снимок на всю транзакцию.

PostgreSQL использует **MVCC** (Multi-Version Concurrency Control): читатели не блокируют писателей. Но мёртвые версии строк и долгие транзакции — ваша ответственность. Эта глава объясняет механику простым языком и даёт правила «когда что использовать».

## Что вы узнаете

- Транзакция простыми словами — зачем `BEGIN` / `COMMIT` / `ROLLBACK`
- ACID в терминах Postgres (WAL, constraints, isolation)
- Как работают xmin/xmax и «мёртвые» строки — пошаговый пример в двух сессиях
- Уровни изоляции: Read Committed, Repeatable Read, Serializable — когда какой
- VACUUM, autovacuum и transaction id wraparound
- Блокировки поверх MVCC и опасность idle in transaction

## Транзакция — «всё или ничего»

Представьте перевод денег: списать со счёта A, зачислить на счёт B. Если после списания сервер упадёт — деньги пропали. Транзакция гарантирует: **либо обе операции выполняются, либо ни одна**.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- списали
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- зачислили
COMMIT;   -- фиксируем обе операции разом
```

Если между UPDATE'ами произошла ошибка:

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  -- constraint violation, деление на ноль, whatever
ROLLBACK;  -- откатываем ВСЁ, как будто BEGIN не было
```

**Без явного `BEGIN`** каждый отдельный SQL-запрос — это транзакция из одного statement с autocommit. Два UPDATE подряд без `BEGIN` — **две независимые** транзакции. Между ними другой клиент может увидеть промежуточное состояние.

| Команда | Что делает |
|---------|------------|
| `BEGIN` (или `START TRANSACTION`) | Начало транзакции |
| `COMMIT` | Сохранить все изменения |
| `ROLLBACK` | Отменить все изменения с момента `BEGIN` |
| `SAVEPOINT name` | Точка отката внутри транзакции |
| `ROLLBACK TO name` | Откат до savepoint, транзакция продолжается |

В приложениях (FastAPI, Django) ORM обычно открывает транзакцию автоматически — но **границы** транзакции определяете вы: один HTTP-запрос = одна транзакция — хорошая практика для OLTP.

## ACID — четыре обещания базы данных

| Свойство | Человеческий перевод | Как Postgres это делает |
|----------|---------------------|------------------------|
| **Atomicity** (атомарность) | Всё или ничего | WAL: до commit изменения можно откатить |
| **Consistency** (согласованность) | Данные не нарушают правила | PK, FK, CHECK, UNIQUE проверяются на commit |
| **Isolation** (изоляция) | Параллельные транзакции не мешают друг другу | MVCC + уровень изоляции |
| **Durability** (надёжность) | После COMMIT данные не пропадут | Commit ждёт запись WAL на диск |

```sql
BEGIN;
UPDATE shop.products SET price = price + 1 WHERE id = 1;
-- ошибка → ROLLBACK откатывает всё
COMMIT;
```

**Durability и `synchronous_commit`:** по умолчанию Postgres не отвечает `COMMIT OK`, пока WAL не на диске. Можно ослабить (`synchronous_commit = off`) для скорости — но рискуете потерять последние секунды данных при аварии. На prod обычно оставляют default.

## MVCC — почему SELECT не блокирует UPDATE

Классическая проблема: один клиент читает отчёт 5 минут, другой не может обновить строки — всё стоит. Postgres решает это иначе: **не блокирует читателей**, а хранит **несколько версий** одной строки.

Каждая версия строки в heap хранит служебные поля:

- **xmin** — ID транзакции, которая **создала** эту версию
- **xmax** — ID транзакции, которая **удалила/заменила** версию (0 = версия жива)

| Операция | Что происходит физически |
|----------|-------------------------|
| `INSERT` | Новая строка, xmin = ID текущей транзакции |
| `UPDATE` | Старая версия помечена мёртвой (xmax = текущий xact); **новая** строка с новым xmin |
| `DELETE` | Версия помечена мёртвой; место на диске **не освобождается** |
| `SELECT` | Видит только версии, **видимые** в snapshot своей транзакции |

**UPDATE не перезаписывает строку на месте.** Это INSERT новой версии + пометка старой как мёртвой. Отсюда:

- Таблица **растёт** даже если «ничего нового не добавляли» — только UPDATE'или
- Без VACUUM на диске копится «мусор» (dead tuples)
- Seq Scan читает и живые, и мёртвые версии — медленнее

### Пошаговый пример: две сессии psql

Откройте **два терминала** с psql (это повторите в [12-lab-mvcc](12-lab-mvcc.md)):

**Сессия A:**

```sql
BEGIN;
UPDATE shop.products SET price = 999 WHERE id = 1;
-- НЕ делайте COMMIT!
```

**Сессия B (параллельно):**

```sql
SELECT price FROM shop.products WHERE id = 1;
-- Видите СТАРУЮ цену — MVCC: B не видит незакоммиченные изменения A
```

**Сессия A:**

```sql
COMMIT;
```

**Сессия B:**

```sql
SELECT price FROM shop.products WHERE id = 1;
-- Теперь 999 — commit A виден всем
```

Пока A не сделала COMMIT, B видит **предыдущую** версию строки. Это и есть изоляция через snapshot.

## Уровни изоляции — что видит ваша транзакция

Snapshot — «фотография» базы на момент начала statement или транзакции. Уровень изоляции определяет, **когда** делается новый снимок.

```sql
SHOW transaction_isolation;  -- read committed (default)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

| Level | Когда новый snapshot | Типичное использование |
|-------|---------------------|-------------------------|
| **Read committed** (default) | На **каждый** SQL-запрос | 99% OLTP: FastAPI, Django, CRUD |
| **Repeatable read** | Один snapshot на **всю** транзакцию | Отчёт: «хочу те же цифры при повторном SELECT» |
| **Serializable** | Максимальная строгость | Финансовые инварианты, когда нельзя допустить гонку |

### Read Committed — default, и это нормально

```sql
-- Сессия A
BEGIN;
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 100

-- Сессия B (параллельно)
INSERT INTO shop.orders (..., status) VALUES (..., 'pending');
COMMIT;

-- Сессия A — второй SELECT в той же транзакции
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 101 (!)
COMMIT;
```

Между двумя SELECT в одной транзакции A **появилась новая строка** — это **не баг**, это Read Committed. Каждый statement видит уже закоммиченные изменения других.

**Когда это проблема:** вы считаете `count`, принимаете решение, делаете INSERT — а между count и insert кто-то уже вставил строку. Решение: `SELECT ... FOR UPDATE` или Serializable.

### Repeatable Read — «заморозил картину»

```sql
-- Сессия A
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- 100

-- Сессия B
INSERT INTO shop.orders (..., status) VALUES (..., 'pending');
COMMIT;

-- Сессия A
SELECT count(*) FROM shop.orders WHERE status = 'pending';  -- всё ещё 100
COMMIT;
```

A видит **тот же snapshot** на всю транзакцию. Новые строки от B не видны до COMMIT A и новой транзакции.

Postgres Repeatable Read **сильнее**, чем в SQL standard — фантомов нет (используется snapshot isolation).

**Когда использовать:** отчёт из нескольких запросов, где цифры должны быть согласованы. Не держите такую транзакцию часами — мешает VACUUM.

### Serializable — когда нельзя ошибиться

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- сложная логика с несколькими SELECT + INSERT
COMMIT;
-- или: ERROR: could not serialize access due to concurrent update
```

Postgres может **отклонить** транзакцию с ошибкой сериализации — приложение должно **повторить** (retry). Дороже по CPU, но гарантирует результат «как будто транзакции шли по очереди».

**Когда использовать:** резервирование последнего товара на складе, где два клиента одновременно покупают последнюю единицу. Read Committed может дать обоим «успех» — Serializable нет.

## VACUUM — уборка мёртвых версий

DELETE и UPDATE оставляют **dead tuples** — старые версии строк, которые уже никто не видит. Они занимают место, пока их не уберёт **VACUUM**.

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

| Метрика | Что значит |
|---------|------------|
| `n_live_tup` | Живые строки |
| `n_dead_tup` | Мёртвые версии, ждут vacuum |
| `last_autovacuum` | Когда autovacuum последний раз чистил |

**Autovacuum** — фоновый процесс ([01-architecture](01-architecture.md)), запускается автоматически. Вам обычно не нужно вызывать `VACUUM` вручную — но нужно **не мешать** ему.

| Проблема | Последствие |
|----------|-------------|
| Много dead tuples | Seq Scan читает мусор, запросы медленнее, диск растёт |
| Долгая транзакция держит старый snapshot | Vacuum **не может** удалить версии, которые эта транзакция ещё «может увидеть» |
| Xid wraparound | Критический аварийный режим — autovacuum freeze не успевает |

```sql
-- Ручной vacuum (обычно не нужен на prod)
VACUUM shop.products;

-- VACUUM FULL — переписывает таблицу целиком, EXCLUSIVE LOCK
-- В prod почти никогда без окна обслуживания!
VACUUM FULL shop.products;
```

Подробнее — [intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md).

## Блокировки — MVCC не всё решает

MVCC убирает конфликт «читатель vs писатель» для обычного SELECT. Но когда нужно **гарантировать**, что данные не изменятся до commit — нужны явные блокировки.

**`SELECT ... FOR UPDATE`** — «забронирую эти строки»:

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
-- Другие транзакции с FOR UPDATE на эту строку — ждут
UPDATE shop.products SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

Типичный паттерн: прочитал остаток → проверил → списал. Без `FOR UPDATE` два клиента могут одновременно прочитать `stock = 1` и оба списать — overselling.

**DDL-блокировки** — тяжелее row-level:

| Операция | Блокировка | Что блокирует |
|----------|------------|---------------|
| `CREATE INDEX` | ShareLock | Запись в таблицу |
| `CREATE INDEX CONCURRENTLY` | Слабее | Дольше, но не блокирует INSERT |
| `ALTER TABLE` | AccessExclusiveLock | Всё, включая SELECT |
| `VACUUM FULL` | AccessExclusiveLock | Всё |

Кто ждёт блокировку:

```sql
SELECT a.pid, a.usename, a.state, l.mode, l.granted, left(a.query, 60)
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
```

`granted = false` — кто-то **ждёт**. Смотрите `query` — часто idle in transaction держит lock, а миграция ждёт.

## idle in transaction — тихий убийца продакшена

Состояние в `pg_stat_activity`: **`idle in transaction`** — клиент сделал `BEGIN`, возможно один запрос, и **молчит**. Соединение открыто, транзакция не завершена.

```sql
SELECT pid, state, xact_start, state_change, left(query, 80)
FROM pg_stat_activity
WHERE state = 'idle in transaction';
```

**Чем опасно:**

1. **Держит snapshot** → VACUUM не может убрать dead tuples → bloat, рост диска.
2. **Держит row-level locks** после `FOR UPDATE` → другие транзакции ждут.
3. **Съедает connection pool** — 100 «спящих» сессий = 100 занятых слотов из `max_connections`.
4. **Держит xmin** → риск transaction id wraparound при массовом bloat.

**Типичные источники:**

- Разработчик открыл psql, сделал `BEGIN`, ушёл пить кофе.
- ORM открыл транзакцию на весь HTTP-запрос, внутри — вызов внешнего API на 30 секунд.
- BI-инструмент (Metabase, DBeaver) держит транзакцию открытой между preview и export.

**Как защититься:**

```sql
-- В postgresql.conf (см. intermediate/01-configuration)
idle_in_transaction_session_timeout = '5min'
```

В приложениях:

- Короткие транзакции — открыли, сделали дело, закрыли.
- Не вызывайте HTTP/RabbitMQ **внутри** транзакции с БД.
- `pool_pre_ping` в SQLAlchemy — отсекает мёртвые соединения.

## Типичные ошибки

1. **Долгий batch в одной транзакции** — 100k UPDATE в одном BEGIN → раздувание WAL, bloat, блокировки. Дробите на батчи с COMMIT.
2. **ORM открыл транзакцию на весь HTTP request** с внешними API внутри — idle in transaction + pool exhaustion.
3. **Ожидание Repeatable Read по умолчанию** — в PG default Read Committed. Повторный SELECT может вернуть другие данные.
4. **`VACUUM FULL` «почистить диск срочно»** в пик нагрузки — эксклюзивная блокировка, downtime.
5. **Два UPDATE без BEGIN** в скрипте — промежуточное состояние видно другим клиентам.
6. **Забыли retry при Serializable** — приложение падает с serialization error вместо повтора.

## Связи

- Архитектура и autovacuum launcher: [01-architecture](01-architecture.md).
- WAL и durability: [intermediate/03-wal](../postgresql-intermediate/03-wal.md).
- PgBouncer transaction mode: [intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md).
- Транзакции в FastAPI/SQLAlchemy: [fastapi/14-sessions-repos](../fastapi/14-sessions-repos.md).

## Чек-лист

- [ ] Могу объяснить, зачем `BEGIN`/`COMMIT` на примере перевода денег
- [ ] UPDATE создаёт **новую** версию строки, старая — dead tuple
- [ ] Read Committed: новый snapshot на каждый statement
- [ ] Repeatable Read: один snapshot на транзакцию — для согласованных отчётов
- [ ] Dead tuples убирает VACUUM, не DELETE
- [ ] idle in transaction мешает vacuum и держит locks
- [ ] Знаю, где смотреть `n_dead_tup` и `pg_stat_activity`

## Дальше

Лаба с двумя сеансами psql — увидите MVCC руками: [12-lab-mvcc.md](12-lab-mvcc.md).
