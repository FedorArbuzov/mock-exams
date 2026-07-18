# 08. JSONB

## Сценарий с работы

Product требует «гибкие атрибуты» заказа: канал, кампания, A/B flags — меняются каждую неделю. 30 nullable колонок в `orders` или **jsonb `meta`**? Команда выбрала JSONB; через месяц запросы `WHERE meta->>'channel' = 'mobile'` без индекса — full table scan на 5M строк.

JSONB — мощный тип, но требует **дисциплины индексов** и понимания когда нормализовать.

## Что вы узнаете

- `json` vs `jsonb`
- Операторы `->`, `->>`, `@>`, `?`
- GIN и expression indexes
- Когда вынести в колонку

## json vs jsonb

| | `json` | `jsonb` |
|---|--------|---------|
| Хранение | Текст как есть | Декомпозированный binary |
| Порядок ключей | Сохраняется | Не гарантируется |
| Дедуп ключей | Нет | Да |
| Индексы | Ограничены | GIN, btree на expression |
| Вставка | Быстрее | Чуть медленнее (parse) |

В 2024+ почти всегда **`jsonb`**.

Колонка уже в [`V1__init.sql`](examples/flyway/sql/V1__init.sql): `orders.meta`.

## Операторы

```sql
UPDATE devapp.orders
SET meta = '{"source": "web", "tags": ["sale"], "discount": 10}'::jsonb
WHERE id = 1;

-- json object field (jsonb)
SELECT meta->'tags' FROM devapp.orders WHERE id = 1;

-- text scalar
SELECT meta->>'source' AS source FROM devapp.orders;

-- containment
SELECT id FROM devapp.orders WHERE meta @> '{"source": "web"}';

-- key exists
SELECT id FROM devapp.orders WHERE meta ? 'tags';

-- path
SELECT meta#>>'{tags,0}' FROM devapp.orders;
```

| Оператор | Возвращает |
|----------|------------|
| `->` | jsonb |
| `->>` | text |
| `@>` | contains (boolean) |
| `?` | key exists |

## Построение в SQL

```sql
UPDATE devapp.orders SET meta = jsonb_build_object(
  'channel', 'mobile',
  'campaign', 'spring',
  'items', jsonb_build_array(1, 2)
) WHERE id = 1;
```

В app — сериализуйте dict; не склеивайте JSON строкой (injection в структуре).

## Индексы

### GIN на весь meta

```sql
CREATE INDEX orders_meta_gin ON devapp.orders USING gin (meta);
-- запросы @>, ?, ?&
```

### jsonb_path_ops — меньше индекс

```sql
CREATE INDEX orders_meta_gin ON devapp.orders USING gin (meta jsonb_path_ops);
-- только @>, не ?
```

### Expression index на hot key

```sql
CREATE INDEX orders_meta_channel_idx ON devapp.orders ((meta->>'channel'));
-- WHERE meta->>'channel' = 'mobile'
```

Частые фильтры по одному полю — **generated column** (PG 12+):

```sql
ALTER TABLE devapp.orders
  ADD COLUMN channel text GENERATED ALWAYS AS (meta->>'channel') STORED;
CREATE INDEX orders_channel_idx ON devapp.orders (channel);
```

## Когда НЕ JSONB

| Ситуация | Решение |
|----------|---------|
| FK, строгая схема | Нормальные колонки |
| Агрегаты SUM по полю | Колонка numeric |
| Поиск по тексту внутри | FTS или отдельная колонка |
| Частые UPDATE всего blob | Row bloat — нормализовать |

## Bloat и размер

Большой JSONB в hot row — каждый UPDATE = новая row version (MVCC). Вынесите редко меняющееся в side table.

См. [intermediate/11-vacuum](../postgresql-intermediate/11-vacuum-bloat.md).

## Типичные ошибки

1. `@>` без GIN на большой таблице.
2. `meta->>key` без индекса на hot path.
3. Хранить массивы 10k элементов в одном jsonb.
4. Сравнение `meta->>'count' > '10'` — text compare, не numeric.
5. Дублировать JSONB и колонки без sync strategy.

## Чек-лист

- [ ] `->` vs `->>`
- [ ] GIN для `@>` vs expression для `->>`
- [ ] jsonb_path_ops tradeoff
- [ ] Generated column для hot filter
- [ ] Когда нормализовать

## Дальше

Лаба: [09-lab-jsonb.md](09-lab-jsonb.md).
