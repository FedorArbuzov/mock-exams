# 03. Кластер, БД, схемы, таблицы

## Сценарий с работы

Новый разработчик пишет миграцию: `CREATE TABLE users (...)` без схемы — и в проде таблица оказывается в `public`, хотя вся команда договорилась о схеме `app`. Другой коллега создаёт `CREATE DATABASE analytics` на том же RDS, ожидая изоляции от продовой нагрузки — а CPU и диск **общие**, потому что это один кластер. Третий выбирает `timestamp without time zone` для заказов из Европы и США — отчёты «плывут» на смене DST.

Эта глава — про **иерархию объектов** в Postgres и про выбор типов/ограничений, которые потом не придётся чинить в [intermediate](../postgresql-intermediate/README.md) и [developer](../postgresql-developer/README.md).

## Что вы узнаете

- Иерархию: cluster → database → schema → table/view/…
- Как создавать БД и зачем `template0`
- Роль `search_path` и риски без префикса схемы
- Практичные типы данных и ограничения для backend-приложений
- Как смотреть размер объектов в каталогах

## Иерархия объектов

```text
Cluster (один PGDATA, один postmaster)
└── Database: course
      ├── Schema: public      ← default
      ├── Schema: shop        ← наша учебная схема (лаба 04)
      └── Schema: app
            ├── Table: products
            ├── View: active_products
            ├── Index, Sequence, Function, ...
```

**Database** в Postgres — жёсткая граница: нельзя в одном SQL сделать `JOIN` между `course.shop.orders` и `analytics.shop.orders`. Cross-database — через **foreign data wrapper** или на уровне приложения — это уже не basic.

**Schema** — namespace внутри БД. Имена уникальны в паре `(schema, object_name)`. Так один кластер обслуживает несколько приложений: `billing.invoices`, `shop.orders`.

## CREATE DATABASE

Создание новой БД в том же кластере:

```sql
CREATE DATABASE appdb
  OWNER = app_owner
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;
```

| Параметр | Зачем |
|----------|-------|
| `OWNER` | Владелец БД (права на объекты по умолчанию) |
| `ENCODING UTF8` | Стандарт для приложений |
| `LC_*` | Сортировка и классификация символов — **нельзя** сменить после создания |
| `TEMPLATE template0` | «Чистый» шаблон без чужих объектов |

**Почему `template0`, а не `template1`?**  
`template1` — БД по умолчанию для `CREATE DATABASE`; в неё часто кладут общие расширения. `template0` нельзя менять подключёнными сессиями — гарантия пустого клона.

**Ограничение:** `CREATE DATABASE` **нельзя** выполнить внутри блока транзакции (`BEGIN` … `COMMIT`). В CI миграциях это ловят неожиданным rollback всего скрипта.

На учебном стенде вы работаете в уже созданной БД `course`; отдельную БД создадите в [финальном проекте](15-final-project.md) при restore в `course_test`.

## Схемы и search_path

```sql
CREATE SCHEMA shop AUTHORIZATION course;
SET search_path TO shop, public;
```

После `SET` команда `SELECT * FROM products` ищет `shop.products`, затем `public.products`.

| Подход | Плюс | Минус |
|--------|------|-------|
| Всегда `shop.products` | Явно, без сюрпризов | Длиннее SQL |
| `search_path = shop` | Короче запросы | Риск shadowing в `public`, SQL injection в search_path |
| Одна схема `public` | Просто для прототипа | Хаос в монолите с десятком модулей |

В [django](../django/07-models-basics.md) и [sqlalchemy-deep](../sqlalchemy-deep/README.md) схему задают в модели/metadata; в connection string — `options=-csearch_path=shop`.

## Таблицы: типы данных

```sql
CREATE TABLE shop.products (
  id          bigserial PRIMARY KEY,
  sku         text NOT NULL UNIQUE,
  name        text NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

| Тип | Когда использовать |
|-----|-------------------|
| `bigint` / `bigserial` | ID, счётчики (serial = sequence + NOT NULL) |
| `numeric(p,s)` | Деньги — **не** `float` |
| `text` | Строки произвольной длины |
| `timestamptz` | Моменты времени с учётом TZ (заказы, логи) |
| `timestamp` (без tz) | Редко — только если семантика «настенных часов» |
| `jsonb` | Гибкие атрибуты ([developer/08-jsonb](../postgresql-developer/08-jsonb.md)) |
| `uuid` | Распределённые ID, публичные идентификаторы |

**`timestamptz` vs `timestamp`:** Postgres хранит `timestamptz` в UTC и показывает в timezone сессии. `timestamp` — «как ввели», без привязки к зоне — легко ошибиться в API для разных регионов.

## Ограничения целостности

```sql
CREATE TABLE shop.orders (
  id         bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES shop.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now()
);
```

| Ограничение | Роль |
|-------------|------|
| `PRIMARY KEY` | Уникальность + NOT NULL; создаёт индекс |
| `UNIQUE` | Уникальность (sku, email) |
| `NOT NULL` | Запрет NULL |
| `CHECK` | Доменные правила (price >= 0) |
| `FOREIGN KEY` | Ссылочная целостность |

**FK и индексы:** на referencing колонке (`orders.product_id`) индекс **нужен** для быстрых JOIN и DELETE родителя. На referenced (`products.id`) индекс есть за счёт PK. Без индекса на FK — блокировки и Seq Scan при каскадах ([performance](../postgresql-performance/README.md)).

## Представления

```sql
CREATE VIEW shop.active_products AS
  SELECT id, sku, name, price
  FROM shop.products
  WHERE deleted_at IS NULL;
```

View — сохранённый запрос, не копия данных. **Materialized view** — снимок на диск; обновляется `REFRESH MATERIALIZED VIEW` (используют для отчётов, не для OLTP в realtime).

## Размер и метаданные

Админ и разработчик постоянно смотрят «кто раздулся»:

```sql
SELECT pg_size_pretty(pg_database_size('course'));

SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

`pg_total_relation_size` включает таблицу, TOAST и индексы — ближе к реальному месту на диске, чем только `pg_relation_size`.

Список таблиц схемы:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'shop';
```

## Типичные ошибки

1. **Всё в `public`** — через полгода непонятно, что чьё; миграции конфликтуют.
2. **`CREATE DATABASE` для «изоляции нагрузки»** — изоляция имён, не ресурсов CPU/RAM.
3. **`double precision` для денег** — ошибки округления; используйте `numeric`.
4. **Нет индекса на FK** — медленные JOIN и проблемы при DELETE из родительской таблицы.

## Чек-лист

- [ ] Могу нарисовать cluster → database → schema → table
- [ ] Знаю, зачем `TEMPLATE template0`
- [ ] Понимаю риск `search_path` без явной схемы
- [ ] Выбираю `timestamptz` для событий в приложении
- [ ] Умею найти топ таблиц по размеру

## Дальше

Практика: [04-lab-ddl.md](04-lab-ddl.md) — схема `shop`, FK, первый индекс.
