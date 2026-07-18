# 11. hypopg — виртуальные индексы

## Сценарий с работы

DBA хочет `CREATE INDEX` на 200 GB таблице «проверить план». На prod — `CREATE INDEX CONCURRENTLY` час и I/O; на staging — нет копии. **hypopg** создаёт гипотетический индекс в памяти планировщика: `EXPLAIN` показывает Index Scan **без** построения на диске.

Образ mock-exams включает hypopg ([deploy/postgres](../../deploy/postgres/README.md)).

## Что вы узнаете

- API hypopg_create_index / reset
- Ограничения hypothetical indexes
- Когда создавать реальный индекс
- Fallback без extension

## Зачем hypopg

```sql
CREATE EXTENSION IF NOT EXISTS hypopg;

SELECT * FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id, created_at DESC)'
);
```

Повторный `EXPLAIN` — планировщик **видит** индекс, файлов на диске нет.

Workflow:

```text
1. EXPLAIN baseline
2. hypopg_create_index(...)
3. EXPLAIN — cost down? Index Scan?
4. hypopg_reset()
5. CREATE INDEX CONCURRENTLY на prod если выигрыш > порога
```

## API

```sql
-- создать
SELECT indexrelid, indexname FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id) WHERE event_type = ''error'''
);

-- список
SELECT * FROM hypopg_list_index;

-- удалить все
SELECT hypopg_reset();
```

Поддерживает B-tree, BRIN, partial, INCLUDE — передаёте полный DDL.

## Ограничения

| hypopg делает | hypopg НЕ делает |
|---------------|------------------|
| Меняет план в EXPLAIN | Не ускоряет реальное выполнение |
| Быстрая итерация | Не учитывает write amplification на prod |
| Partial/GIN/BRIN | Может отличаться от реального build stats |

Всегда проверяйте **реальный** `EXPLAIN (ANALYZE)` после `CREATE INDEX CONCURRENTLY` на staging.

## Fallback без hypopg

1. `pg_stats` + selectivity estimate
2. Копия таблицы в dev + реальный индекс
3. `CREATE INDEX` на транзакционной реплике + drop

## pg_hint_plan (крайняя мера)

Принудительный hint плана — **не** замена нормальной настройки. Используйте, когда статистика не чинится, deadline горит. Документация: [pg_hint_plan](https://pghintplan.osdn.jp/).

## Связь с developer/ops

- Индекс в миграции Flyway — [developer/02-flyway](../postgresql-developer/02-flyway.md)
- `CREATE INDEX CONCURRENTLY` в окне — [ops](../postgresql-ops/README.md)

## Типичные ошибки

1. hypopg plan OK → CONCURRENTLY на prod в пик — всё равно I/O.
2. Забыть `hypopg_reset()` — путаница в следующих EXPLAIN.
3. Смотреть только cost, не ANALYZE после реального индекса.
4. Гипотетический GIN на 1TB без оценки build time.

## Чек-лист

- [ ] hypopg не меняет данные на диске
- [ ] hypopg_reset() очищает все
- [ ] Когда реальный CONCURRENTLY
- [ ] Workflow 5 шагов
- [ ] Ограничения hypopg vs production

## Дальше

Лаба: [12-lab-hypopg.md](12-lab-hypopg.md).
