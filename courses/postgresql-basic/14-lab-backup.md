# 14. Лаба: dump и restore

## Зачем эта лаба

Бэкап, который ни разу не восстанавливали, — не бэкап. Вы сделаете дамп схемы `shop`, **удалите** её, восстановите из файла и убедитесь, что данные и объекты на месте. Это минимальный drill перед релизом и типичное задание на собесе.

## Предусловия

- Схема `shop` с данными (после [04-lab-ddl](04-lab-ddl.md), возможно 50k orders из [10-lab-indexes](10-lab-indexes.md)).
- Клиенты `pg_dump` / `pg_restore` на хосте **или** только через Docker (ниже оба варианта).

Запишите текущее состояние:

```sql
SELECT count(*) FROM shop.products;
SELECT count(*) FROM shop.orders;
```

## Задание 1. Dump схемы shop (формат custom)

**С хоста** (если `pg_dump` установлен и порт 5432 проброшен):

```bash
pg_dump -Fc -n shop -f shop.dump "postgresql://course:course@localhost:5432/course"
```

**Через Docker** (универсально):

```bash
docker exec mock-postgres pg_dump -U course -Fc -n shop -f /tmp/shop.dump course
docker cp mock-postgres:/tmp/shop.dump ./shop.dump
```

Проверка файла:

```bash
# Linux/macOS
ls -lh shop.dump

# Windows PowerShell
Get-Item shop.dump | Select-Object Length, Name
```

Размер > 0. Список содержимого:

```bash
pg_restore -l shop.dump | head -30
# или
docker run --rm -v ${PWD}:/backup postgres:16 pg_restore -l /backup/shop.dump
```

## Задание 2. Удалить схему (контролируемая катастрофа)

Под `course`:

```sql
DROP SCHEMA shop CASCADE;
\dn
SELECT count(*) FROM pg_tables WHERE schemaname = 'shop';
```

Ожидание: схемы `shop` нет, запрос к `shop.products` падает.

**Не делайте** `DROP DATABASE course` — потеряете весь контекст стенда.

## Задание 3. Restore

**С хоста:**

```bash
pg_restore -d "postgresql://course:course@localhost:5432/course" shop.dump
```

**Через Docker:**

```bash
docker cp shop.dump mock-postgres:/tmp/shop.dump
docker exec mock-postgres pg_restore -U course -d course /tmp/shop.dump
```

Возможны harmless warnings про `already exists` для extensions — на стенде обычно чисто.

Проверка:

```sql
\dt shop.*
SELECT count(*) FROM shop.products;
SELECT count(*) FROM shop.orders;
```

Счётчики должны совпасть с записанными в начале лабы.

## Задание 4. Globals (роли)

```bash
docker exec mock-postgres pg_dumpall -U course --globals-only
```

В выводе ищите `CREATE ROLE shop_reader` — если роли создавали в [06-lab-roles](06-lab-roles.md), они в globals. **Сам дамп схемы shop ролей не содержит.**

Если после экспериментов reader/writer не работают:

```sql
-- пересоздайте по 06-lab-roles или восстановите globals.sql
\du shop_*
```

## Задание 5. Schema-only dump (опционально)

```bash
docker exec mock-postgres pg_dump -U course --schema-only -n shop -f /tmp/shop_schema.sql course
docker exec mock-postgres head -40 /tmp/shop_schema.sql
```

Увидите `CREATE TABLE`, `CREATE INDEX` без `COPY` данных — полезно для code review миграций.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `pg_restore: error: could not open file` | Путь к dump; docker cp |
| `schema shop already exists` | Частичный restore; `DROP SCHEMA shop CASCADE` и снова |
| `permission denied for schema shop` | Подключитесь как `course` |
| Пустые таблицы после restore | Делали `--schema-only` по ошибке |
| Роли не работают | Повторите GRANT из лабы 06 |

## Критерии успеха

- [ ] Файл `shop.dump` в формате custom (-Fc)
- [ ] После DROP + restore данные совпадают
- [ ] Понимаете флаг `-n shop`
- [ ] Видели вывод `pg_dumpall --globals-only`
- [ ] Знаете, что роли — отдельно от дампа БД

## Дальше

Финальный проект: [15-final-project.md](15-final-project.md).
