# 09. Индексы и EXPLAIN

## Сценарий с работы

Таблица `orders` выросла до 40 млн строк. Запрос по `customer_id` идёт 30 секунд — в `EXPLAIN` **Seq Scan**. DBA добавляет индекс — 50 мс. Через месяц диск забит: пять неиспользуемых индексов на каждую колонку «на всякий случай», INSERT тормозит. Другой кейс: индекс есть, но планировщик всё равно Seq Scan — статистика устарела после массовой загрузки, нужен `ANALYZE`.

Индекс — компромисс: ускоряет чтение, замедляет запись и занимает место. Эта глава — как это устроено «под капотом», когда что добавлять, B-tree по умолчанию, обзор других типов и чтение плана через `EXPLAIN`.

## Что вы узнаете

- Аналогия и механика: что индекс делает физически
- Когда индекс помогает, а когда вредит — простое правило принятия решений
- B-tree, GIN, GiST, BRIN — выбор по типу запроса
- Составные индексы, partial и functional — с примерами «правильно / неправильно»
- `EXPLAIN` vs `EXPLAIN (ANALYZE, BUFFERS)` — как читать план построчно
- Связь плана со статистикой (`ANALYZE`)

Углубление: [`postgresql-performance`](../postgresql-performance/README.md) — планировщик, hypopg, pgbench.

## Индекс — это «оглавление» таблицы

Представьте телефонный справочник на 40 млн страниц. Вам нужны все записи с фамилией «Иванов». Без оглавления вы листаете **каждую страницу** — это **Sequential Scan** (Seq Scan). С алфавитным указателем вы открываете нужный раздел и сразу находите страницы — это **Index Scan**.

В Postgres данные таблицы лежат в **heap** — неупорядоченная куча строк на диске. Индекс — **отдельная структура**, которая хранит:

1. Значение колонки (или нескольких) — в отсортированном виде
2. Указатель на строку в heap — **TID** (tuple identifier)

Когда вы делаете `WHERE product_id = 1`, Postgres идёт в индекс, находит все TID с `product_id = 1`, и затем **дочитывает** сами строки из heap. Это называется **random I/O** — прыжки по диску. Для маленькой таблицы (сотни строк) проще прочитать всё подряд одним махом — Seq Scan дешевле.

```sql
-- Таблица заказов из лабы 04
CREATE INDEX orders_product_id_idx ON shop.orders (product_id);
```

**Что происходит при INSERT:** Postgres записывает строку в heap **и** обновляет каждый индекс на этой таблице. Чем больше индексов — тем дороже каждая вставка. Это цена за быстрый поиск.

## Когда добавлять индекс — простое правило

| Ситуация | Индекс нужен? | Почему |
|----------|---------------|--------|
| `WHERE customer_id = ?` на таблице 10M строк, запрос в API каждую секунду | **Да** | Высокая селективность, частый запрос |
| `WHERE status = 'pending'` — 90% строк pending | **Скорее нет** | Индекс вернёт почти всю таблицу; Seq Scan может быть быстрее |
| Таблица 500 строк, редко читается | **Нет** | Планировщик и так прочитает за миллисекунды |
| JOIN `orders.product_id = products.id` | **Да, на FK** | Ускоряет связку таблиц |
| Колонка только для INSERT, никогда не в WHERE/JOIN/ORDER BY | **Нет** | Чистый overhead |
| Отчёт раз в месяц, 5 минут терпимо | **Под вопросом** | Может не стоить замедлять ежедневные INSERT |

**Практический алгоритм:**

1. Запрос тормозит? → `EXPLAIN (ANALYZE)` на **реальных объёмах** (не на пустой dev-БД).
2. Видите Seq Scan на большой таблице с селективным условием? → кандидат на индекс.
3. Добавили индекс → снова `EXPLAIN (ANALYZE)` → сравнили время.
4. Раз в квартал — проверка `pg_stat_user_indexes`: `idx_scan = 0` → кандидат на удаление.

## Типы индексов — какой выбрать

По умолчанию Postgres создаёт **B-tree**. Это «универсальный нож» для сравнений.

| Тип | Когда | Пример условия | Аналогия |
|-----|-------|----------------|----------|
| **B-tree** (default) | `=`, `<`, `>`, `BETWEEN`, `IN`, `LIKE 'prefix%'` | `WHERE product_id = 1` | Алфавитный указатель |
| **GIN** | JSONB, full-text, массивы, `@>`, `?`, `&&` | `WHERE metadata @> '{"color":"red"}'` | Индекс «слов» внутри документа |
| **GiST** | Гео, range, nearest-neighbor | `ST_DWithin(location, point, 1000)` | Пространственное дерево |
| **BRIN** | Очень большие append-only таблицы, данные физически упорядочены | `created_at` в логах | Оглавление по диапазонам страниц |

```sql
-- Обычный поиск по имени — B-tree
CREATE INDEX products_name_idx ON shop.products (name);

-- Логи на 500M строк, INSERT только в конец, запросы по дате — BRIN
CREATE INDEX orders_created_brin ON shop.orders USING brin (created_at);
```

**BRIN** занимает килобайты вместо гигабайтов, но работает только если новые строки **физически** лежат рядом со старыми (append-only лог, партиция по времени). Если таблица часто UPDATE'ится и строки «разъезжаются» — BRIN бесполезен.

**GIN** — для «что внутри» JSON или массива. B-tree на JSONB-колонку целиком бесполезен: он индексирует весь JSON как одно значение, а не ключи внутри.

## Составной индекс — порядок колонок решает

Один индекс на несколько колонок — как указатель «сначала по фамилии, потом по имени»:

```sql
CREATE INDEX orders_product_created_idx
  ON shop.orders (product_id, created_at DESC);
```

**Этот индекс поможет:**

```sql
-- ✅ Фильтр по первой колонке
WHERE product_id = 1

-- ✅ Фильтр + сортировка — Postgres не будет сортировать отдельно
WHERE product_id = 1 ORDER BY created_at DESC

-- ✅ Диапазон по второй колонке при равенстве первой
WHERE product_id = 1 AND created_at > '2025-01-01'
```

**Не поможет (или поможет слабо):**

```sql
-- ❌ Только вторая колонка — «левое правило» B-tree
WHERE created_at > '2025-01-01'

-- ❌ Индекс (product_id, created_at) не заменит запрос WHERE customer_id = ?
WHERE customer_id = 42
```

**Левое правило B-tree:** индекс `(a, b, c)` работает как указатель «сначала a, внутри a — b, внутри b — c». Запрос `WHERE b = ?` без условия на `a` — индекс не используется (или используется частично через Bitmap Scan, что редко выгодно).

**Как выбирать порядок колонок:**

1. Колонка из `WHERE` с **равенством** (`=`, `IN`) — в начало.
2. Колонка из `ORDER BY` — следом (можно убрать отдельный Sort).
3. Колонка с **диапазоном** (`>`, `<`, `BETWEEN`) — обычно последняя в группе равенств.

## Partial и functional индексы — когда обыный не подходит

**Partial index** — индекс только на часть строк. Меньше размер, быстрее обновление:

```sql
-- 95% заказов уже delivered — индекс только на активные
CREATE INDEX orders_pending_idx ON shop.orders (created_at)
  WHERE status = 'pending';
```

Запрос `WHERE status = 'pending' ORDER BY created_at` использует этот индекс. Запрос `WHERE status = 'delivered'` — нет (и не должен).

**Functional index** — индекс по выражению, а не по «сырой» колонке:

```sql
-- ❌ Без functional index — Seq Scan, потому что lower(email) ≠ email
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';

-- ✅ Индекс на выражение
CREATE INDEX users_email_lower_idx ON shop.users (lower(email));
```

Типичная ловушка: индекс на `email`, а в коде `WHERE lower(email) = ?` — Postgres **не может** использовать обычный индекс, потому что функция меняет значение.

## EXPLAIN — читать план как отчёт

`EXPLAIN` показывает **план** — что Postgres **собирается** сделать. Без выполнения.

```sql
EXPLAIN SELECT * FROM shop.orders WHERE product_id = 1;
```

`EXPLAIN (ANALYZE, BUFFERS)` — **реально выполняет** запрос и показывает фактические цифры:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

| Узел плана | Человеческий перевод |
|------------|---------------------|
| **Seq Scan** | Читаю всю таблицу построчно |
| **Index Scan** | Иду по индексу, для каждого совпадения читаю строку из heap |
| **Index Only Scan** | Все нужные колонки есть в индексе — heap не читаю |
| **Bitmap Index Scan** + **Bitmap Heap Scan** | Сначала собираю все TID из индекса, потом читаю heap пачками (эффективнее при умеренной селективности) |
| **Nested Loop** | Для каждой строки левой таблицы ищу совпадения в правой |
| **Hash Join** | Строю hash-таблицу из одной таблицы, пробегаю вторую |
| **Sort** | Сортирую результат — дорого на больших объёмах без индекса |

**Пример вывода и как его читать:**

```text
Index Scan using orders_product_id_idx on orders
  Index Cond: (product_id = 1)
  Buffers: shared hit=4
Planning Time: 0.1 ms
Execution Time: 0.05 ms
```

- `Index Scan using orders_product_id_idx` — использован наш индекс, хорошо.
- `Index Cond: (product_id = 1)` — условие применено **внутри** индекса.
- `Buffers: shared hit=4` — 4 страницы прочитаны из RAM (shared_buffers), без обращения к диску.
- `Execution Time: 0.05 ms` — фактическое время (только с ANALYZE).

**С ANALYZE сравнивайте оценку и реальность:**

```text
Index Scan ...  (cost=0.42..8.44 rows=1 width=72) (actual rows=847 loops=1)
```

Планировщик ожидал **1 строку**, а нашёл **847**. Большой разрыв → статистика устарела → нужен `ANALYZE`. Планировщик мог выбрать Seq Scan, думая что строк мало.

**Осторожно на prod:** `EXPLAIN ANALYZE` **выполняет** запрос. На тяжёлых SELECT используйте `EXPLAIN` без ANALYZE, или тестируйте на реплике.

## Практический пример: от 30 секунд до 50 мс

```sql
-- Шаг 1: смотрим план БЕЗ индекса (на таблице ~1M строк)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE customer_id = 12345;

-- Типичный результат:
-- Seq Scan on orders  (cost=0.00..25000 rows=500 width=72)
--   Filter: (customer_id = 12345)
--   Rows Removed by Filter: 999500
--   Buffers: shared read=8000
-- Execution Time: 2847 ms
```

Postgres прочитал ~8000 страниц и выбросил 999 500 строк — они не подошли.

```sql
-- Шаг 2: добавляем индекс
CREATE INDEX orders_customer_id_idx ON shop.orders (customer_id);

-- Шаг 3: тот же запрос
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE customer_id = 12345;

-- Index Scan using orders_customer_id_idx on orders
--   Index Cond: (customer_id = 12345)
--   Buffers: shared hit=12
-- Execution Time: 0.08 ms
```

12 страниц вместо 8000. Разница на порядки.

## Статистика и ANALYZE — планировщик не телепат

Планировщик **не знает** реальное распределение данных — он смотрит **статистику** в `pg_stats` (собирается командой `ANALYZE` или autovacuum).

После массового `INSERT` / `COPY` / миграции статистика может говорить «в таблице 1000 строк», а их уже 10 миллионов. Планировщик выбирает Seq Scan, потому что «мало данных».

```sql
-- После bulk load — обязательно
ANALYZE shop.orders;

-- Посмотреть, что планировщик «думает» о колонке
SELECT attname, n_distinct, most_common_vals, correlation
FROM pg_stats
WHERE tablename = 'orders' AND schemaname = 'shop';
```

| Поле | Смысл |
|------|-------|
| `n_distinct` | Сколько уникальных значений (примерно) |
| `most_common_vals` | Самые частые значения |
| `correlation` | Насколько физический порядок строк совпадает с логическим порядком колонки (важно для BRIN) |

Подробно — [performance/01-planner-statistics](../postgresql-performance/01-planner-statistics.md).

## Неиспользуемые индексы — платите за каждый INSERT

Каждый индекс замедляет INSERT/UPDATE/DELETE и занимает место на диске. «На всякий случай» — плохая стратегия.

```sql
SELECT schemaname, relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'shop'
ORDER BY idx_scan;
```

| `idx_scan` | Что делать |
|------------|------------|
| 0 за месяцы | Кандидат на удаление — но проверьте редкие отчёты и FK |
| Миллионы | Индекс работает, не трогать |
| Мало, но критичный запрос | Оставить — `idx_scan` не всё показывает (рестарт сбрасывает счётчик) |

Удаление:

```sql
DROP INDEX CONCURRENTLY shop.orders_old_status_idx;
-- CONCURRENTLY — без блокировки записи (важно на prod)
```

## Типичные ошибки

1. **Индекс на каждую колонку** — раздувание WAL, каждый INSERT обновляет 10 индексов. Добавляйте по результату `EXPLAIN`, не «на будущее».
2. **Индекс есть, но запрос с `lower(email)`** — нужен functional index на `lower(email)`, не на `email`.
3. **`SELECT *`** — даже с индексом Postgres читает heap за остальными колонками. Если нужны 2 колонки — укажите их; иногда можно сделать covering index `(customer_id) INCLUDE (total, created_at)`.
4. **Тест на пустой таблице** — «индекс не помог, Seq Scan быстрее» — на 50 строках это нормально. Тестируйте на prod-like объёмах.
5. **Забыли `ANALYZE` после миграции** — индекс создан, но планировщик его игнорирует из-за плохой статистики.
6. **Индекс на low-cardinality колонку** (`status` с 3 значениями) — часто бесполезен без partial index.

## Связи

- Схема и DDL: [04-lab-ddl](04-lab-ddl.md) — таблицы, на которых строим индексы.
- SQLAlchemy и N+1: [fastapi/13-sqlalchemy-async](../fastapi/13-sqlalchemy-async.md) — ORM генерирует запросы, которые нужно проверять через EXPLAIN.
- Планировщик deep dive: [postgresql-performance](../postgresql-performance/README.md).

## Чек-лист

- [ ] Могу объяснить индекс аналогией «оглавление → TID → heap»
- [ ] Знаю, когда Seq Scan — нормальный выбор (маленькая таблица, низкая селективность)
- [ ] B-tree vs GIN vs BRIN — хотя бы один кейс на тип
- [ ] Левое правило составного индекса — могу привести пример «не сработает»
- [ ] `EXPLAIN (ANALYZE)` реально выполняет запрос — осторожно на prod
- [ ] После bulk load нужен `ANALYZE`
- [ ] `idx_scan` для поиска мёртвых индексов

## Дальше

Лаба: [10-lab-indexes.md](10-lab-indexes.md) — сгенерируете 50k строк, увидите Seq Scan и Index Scan своими глазами.
