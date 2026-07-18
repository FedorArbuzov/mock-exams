# 07. Индексы: BRIN, GiST, partial, INCLUDE

## Сценарий с работы

Таблица `events` — 300 GB, B-tree на `created_at` — 40 GB. BRIN на той же колонке — 200 KB, запросы по последней неделе летят за счёт correlation. Другой кейс: индекс на `event_type` раздувает INSERT — но 95% запросов только `event_type = 'error'` — **partial index** в 20 раз меньше.

После [basic/09-indexes](../postgresql-basic/09-indexes-explain.md) — продвинутый выбор типа индекса и **covering** scans.

## Что вы узнаете

- BRIN vs B-tree для time-series
- GIN / GiST — когда
- Partial и covering (INCLUDE) индексы
- Index Only Scan и visibility map

## BRIN (Block Range INdex)

```sql
CREATE INDEX events_created_brin ON perf.events USING brin (created_at);
```

| | BRIN | B-tree на created_at |
|---|------|----------------------|
| Размер | Очень маленький | Большой |
| Условие | Физический порядок ≈ логическому | Любой |
| Запрос | `created_at > ...` range | `=`, range, ORDER BY |
| UPDATE старых строк | Плохо (ломает correlation) | OK |

Идеал: append-only time-series, логи, метрики ([advanced/03-partitioning](../postgresql-advanced/03-partitioning.md) + BRIN per partition).

## GIN и GiST

| Access method | Типы / операторы |
|---------------|------------------|
| **GIN** | `jsonb @>`, arrays, full-text, `pg_trgm` |
| **GiST** | PostGIS, range types, nearest-neighbor |

```sql
CREATE INDEX events_payload_gin ON perf.events USING gin (payload);
-- WHERE payload @> '{"alert": true}'
```

GIN — тяжёлый на write; partial GIN на hot subset.

## Partial index

Индекс только на подмножество:

```sql
CREATE INDEX events_errors_created_idx ON perf.events (created_at DESC)
WHERE event_type = 'error';
```

Работает, когда `WHERE` **совпадает** с предикатом индекса (или подразумевает его).

Плюсы: меньше размер, быстрее INSERT на остальные строки.  
Минус: отдельный индекс на каждый hot predicate.

## Covering index (INCLUDE)

```sql
CREATE INDEX events_device_inc_idx ON perf.events (device_id)
INCLUDE (event_type, created_at);
```

B-tree на `device_id` + payload колонок в листьях → **Index Only Scan** без heap fetch (если visibility map OK).

```sql
EXPLAIN SELECT device_id, event_type, created_at
FROM perf.events WHERE device_id = 100;
```

| | INCLUDE | Composite (device_id, event_type, created_at) |
|---|---------|-----------------------------------------------|
| WHERE device_id = ? | Index Only возможен | Да |
| WHERE event_type = ? | Нет | Зависит от порядка колонок |

## Дерево выбора

```text
time-series append-only, range on time     → BRIN (+ partition)
equality + range on scalar                 → B-tree
редкий фильтр в WHERE (errors only)        → partial B-tree
cover SELECT list при фиксированном WHERE  → INCLUDE
jsonb containment                          → GIN
geo                                        → GiST
```

## Index Only Scan и VM

Postgres пропускает heap, если все колонки в индексе и **visibility map** говорит, что страница all-visible. После массового UPDATE — VM stale → heap fetches возвращаются. Нужен VACUUM ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md)).

## Типичные ошибки

1. BRIN на хаотично обновляемой таблице — false positives, медленнее Seq Scan.
2. Partial index без matching WHERE в запросе.
3. INCLUDE всех колонок таблицы — индекс = копия таблицы.
4. CREATE INDEX CONCURRENTLY забыли на prod — блокировка writes.

## Чек-лист

- [ ] Когда BRIN хуже B-tree
- [ ] Зачем partial index
- [ ] INCLUDE vs composite
- [ ] Index Only Scan — роль VACUUM
- [ ] GIN для jsonb `@>`

## Дальше

Лаба: [08-lab-index-choice.md](08-lab-index-choice.md).
