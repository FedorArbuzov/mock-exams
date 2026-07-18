# 02. Лаба: ANALYZE и плохой план

## Зачем эта лаба

Вы увидите план **до** и **после** `ANALYZE` на таблице `perf.events` (~500k строк) и объясните расхождение estimate vs actual — базовый skill performance review.

## Предусловия

- Стенд Postgres запущен
- Клиент `psql`

## Задание 1. Подготовка схемы

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-performance/examples/events-schema.sql
```

Или вручную из файла [`examples/events-schema.sql`](examples/events-schema.sql) — схема `perf`, таблица `events`, 500k строк, **в конце файла уже есть ANALYZE**.

Для эксперимента «без статистики» создайте копию:

```sql
CREATE TABLE perf.events_nostats (LIKE perf.events INCLUDING ALL);
INSERT INTO perf.events_nostats SELECT * FROM perf.events;
-- НЕ вызывайте ANALYZE на events_nostats
```

## Задание 2. Запрос без свежей статистики

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events_nostats
WHERE device_id = 42
  AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

Запишите в таблицу:

| Метрика | Значение |
|---------|----------|
| Узел скана (Seq / Index) | |
| Planning Time | |
| Execution Time | |
| rows estimate | |
| actual rows | |
| Buffers: shared hit/read | |

## Задание 3. ANALYZE

```sql
ANALYZE perf.events_nostats;
```

Повторите тот же `EXPLAIN (ANALYZE, BUFFERS)`. Сравните cost и время.

**Ожидание:** estimates ближе к actual; возможно смена типа скана.

## Задание 4. Индекс (опционально)

```sql
CREATE INDEX events_nostats_device_type_created_idx
  ON perf.events_nostats (device_id, event_type, created_at DESC);

ANALYZE perf.events_nostats;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events_nostats
WHERE device_id = 42 AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

**Ожидание:** Index Scan или Bitmap Index Scan, ниже Execution Time на большой выборке.

## Задание 5. Письменное объяснение

В `analyze-lab-notes.md` (3–5 предложений):

- Почему планировщик ошибся до ANALYZE?
- Что означает большой разрыв estimate/actual?
- Нужен ли индекс, если после ANALYZE Seq Scan быстрый? (зависит от selectivity и размера)

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Таблица пустая | Перезапустите events-schema.sql |
| Мало строк — всегда Seq Scan | Норма на micro tables |
| INSERT долго | 500k — подождите 1–2 мин |

## Критерии успеха

- [ ] План до и после ANALYZE зафиксирован
- [ ] Объяснено расхождение estimate vs actual
- [ ] При необходимости — индекс и улучшение времени

## Дальше

Parallel и JIT: [03-parallel-jit.md](03-parallel-jit.md).
