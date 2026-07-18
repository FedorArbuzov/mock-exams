# 10. Full-text search

## Сценарий с работы

Shop catalog: поиск по названию и SKU. PM: «Подключим Elasticsearch». Backend: 50k products, JOIN с orders, ACID — **Postgres FTS** достаточно. Для опечаток `Widgt` — **pg_trgm**. Elasticsearch — когда отдельный search cluster и аналитика текста оправданы.

В курсе FTS уже в [`V2__add_search.sql`](examples/flyway/sql/V2__add_search.sql): `tsvector` + GIN + trigger.

## Что вы узнаете

- `tsvector`, `tsquery`, `@@`
- Конфигурации `english` vs `simple`
- Ранжирование `ts_rank`
- `pg_trgm` для fuzzy
- Postgres FTS vs Elasticsearch

## tsvector и tsquery

```sql
SELECT to_tsvector('english', 'The quick brown foxes');
-- 'brown':3 'fox':4 'quick':2

SELECT plainto_tsquery('english', 'fox jumping');
SELECT to_tsvector('english', 'quick brown fox') @@ plainto_tsquery('english', 'fox');
-- true
```

| Функция | Назначение |
|---------|------------|
| `to_tsvector(config, text)` | Нормализованные лексемы + позиции |
| `plainto_tsquery(config, text)` | User input → AND query |
| `to_tsquery` | Синтаксис `fox & jump` |
| `@@` | Match operator |

**`simple`** — без стемминга, для SKU/артикулов. **`english`** — стемы, stop words.

## Колонка search + GIN

Паттерн из V2:

```sql
ALTER TABLE devapp.products ADD COLUMN search tsvector;
UPDATE devapp.products SET search = to_tsvector('simple',
  coalesce(name,'') || ' ' || coalesce(sku,''));

CREATE INDEX products_search_idx ON devapp.products USING gin (search);
```

Trigger на INSERT/UPDATE — search всегда актуален.

## Поиск с ранжированием

```sql
SELECT sku, name, ts_rank(search, q) AS rank
FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q
ORDER BY rank DESC
LIMIT 20;
```

`ts_rank_cd` — учитывает расстояние между lexemes.

## Веса полей

```sql
setweight(to_tsvector('simple', name), 'A') ||
setweight(to_tsvector('simple', sku), 'B')
```

Имя важнее SKU в rank.

## pg_trgm (fuzzy / LIKE)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT name FROM devapp.products WHERE name % 'Widgt';  -- similarity
SELECT name FROM devapp.products WHERE name ILIKE '%widget%';

CREATE INDEX products_name_trgm ON devapp.products
  USING gin (name gin_trgm_ops);
```

| Метод | Когда |
|-------|-------|
| FTS `@@` | Слова, стемы, rank |
| `pg_trgm` | Опечатки, substring fuzzy |
| `ILIKE '%x%'` | Мало данных, нет индекса — seq scan |

Стенд [`deploy/postgres`](../../deploy/postgres/README.md) включает `pg_trgm`.

## Обновление search

| Подход | Плюс |
|--------|------|
| Trigger BEFORE INSERT/UPDATE | Всегда sync |
| Generated column (PG 12+) | Декларативно |
| Batch REFRESH | Редкие bulk loads |

Не забывайте reindex при смене config.

## Postgres FTS vs Elasticsearch

| | Postgres FTS | Elasticsearch |
|---|--------------|---------------|
| ACID + JOIN | ✅ native | Нужен sync |
| Ops complexity | Низкая | Кластер, shards |
| Scale | До ~миллионов docs OK | Миллиарды, analytics |
| Fuzzy, facets | Базово | Богато |
| Consistency | Immediate | Near real-time |

## Типичные ошибки

1. FTS без GIN — seq scan.
2. `english` config для SKU `A1-B2` — токенизация ломает.
3. Забыли trigger — search stale после UPDATE.
4. `ILIKE '%term%'` на prod без trgm.
5. Дублировать всё в ES без необходимости.

## Чек-лист

- [ ] simple vs english
- [ ] GIN на tsvector
- [ ] ts_rank для сортировки
- [ ] pg_trgm для опечаток
- [ ] Trigger sync search column

## Дальше

Лаба: [11-lab-fts.md](11-lab-fts.md).
