# 08. Лаба: psql и метаданные

## Зачем эта лаба

Когда API «тормозит», первый шаг DBA — не перезапуск, а **кто что держит**: `pg_stat_activity`, блокировки, размер таблиц. Разработчик без этих навыков скидывает всё на «Postgres глючит». Здесь вы тренируете диагностические запросы и `\copy` — то, что нужно в on-call и на собесе.

## Предусловия

- Стенд и схема `shop` с данными ([04-lab-ddl](04-lab-ddl.md)).
- Две сессии `psql` пригодятся для задания с активностью (два терминала или вкладки).

## Задание 1. Кто подключён к БД

В первой сессии под `course`:

```sql
SELECT pid,
       usename,
       application_name,
       client_addr,
       state,
       left(query, 80) AS query
FROM pg_stat_activity
WHERE datname = 'course'
  AND pid <> pg_backend_pid()
ORDER BY pid;
```

`pg_backend_pid()` исключает **текущую** сессию — иначе видите только себя.

Откройте вторую сессию:

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course?application_name=lab08-reader"
```

Повторите запрос в первой сессии — появится строка с `shop_reader` и `application_name = lab08-reader`.

## Задание 2. Описание таблицы и индексы

```sql
\d shop.products
\d+ shop.orders
```

`\d+` добавляет размер, описание, storage. Сверьте с [04-lab-ddl](04-lab-ddl.md): PK, UNIQUE, FK, `orders_created_idx`.

Список индексов через SQL:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'shop' AND tablename = 'orders';
```

## Задание 3. Экспорт CSV через \copy

**На хосте с локальным psql:**

```sql
\copy (SELECT id, sku, name, price FROM shop.products) TO 'products.csv' CSV HEADER
```

**Через Docker** (файл на stdout — перенаправьте в файл):

```bash
docker exec mock-postgres psql -U course -d course \
  -c "\copy (SELECT * FROM shop.products) TO STDOUT CSV HEADER" > products.csv
```

Проверьте файл: заголовок + строки Widget/Gadget.

Импорт обратно (опционально, во временную таблицу):

```sql
CREATE TEMP TABLE products_import (LIKE shop.products INCLUDING ALL);
\copy products_import FROM 'products.csv' CSV HEADER
SELECT count(*) FROM products_import;
```

## Задание 4. Тайминг запросов

```sql
\timing on
SELECT count(*) FROM shop.orders o JOIN shop.products p ON p.id = o.product_id;
\timing off
```

На маленьких данных — миллисекунды. После [10-lab-indexes](10-lab-indexes.md) с 50k строк разница станет заметнее.

## Задание 5. Блокировки (preview)

Обычно пусто на учебном стенде. Посмотреть структуру:

```sql
SELECT locktype, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted
LIMIT 5;
```

В [12-lab-mvcc](12-lab-mvcc.md) увидите конфликты при долгих транзакциях. Полный разбор — [intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md).

## Задание 6. Полезные one-liners

```sql
-- версия и параметры сессии
SELECT version(), current_setting('search_path');

-- размер схемы shop
SELECT pg_size_pretty(sum(pg_total_relation_size(relid)))
FROM pg_stat_user_tables
WHERE schemaname = 'shop';
```

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `\copy: permission denied` | Путь на хосте недоступен; используйте STDOUT из docker |
| Не видно вторую сессию | Фильтр `datname`; reader подключился к другой БД |
| `\d` — no relations | Нет схемы `shop` — вернитесь к лабе 04 |

## Критерии успеха

- [ ] Нашли своё и чужое подключение в `pg_stat_activity`
- [ ] `\d shop.products` — индексы и ограничения на месте
- [ ] CSV выгружен через `\copy`
- [ ] `\timing` включали и читали время

## Дальше

Индексы и планы: [09-indexes-explain.md](09-indexes-explain.md).
