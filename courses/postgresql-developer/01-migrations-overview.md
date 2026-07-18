# 01. Обзор миграций схемы

## Сценарий с работы

Пятница, деплой shop-api. Разработчик вручную выполнил `ALTER TABLE orders ADD COLUMN promo_code` на prod — staging не обновили. В понедельник CI падает: «column already exists». Параллельно другой инженер откатывает релиз app, но **схема БД впереди кода** — 500 на старой версии.

Без **версионирования схемы** dev/stage/prod расходятся. Миграции — DDL как код: review в PR, применение через CI, история в таблице.

**Предварительно:** [basic/03-databases-schemas](../postgresql-basic/03-databases-schemas.md), [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md).

## Что вы узнаете

- Зачем версионировать схему
- Flyway vs Liquibase vs ORM migrations
- Идемпотентность и forward-only rollback
- Expand/contract для zero-downtime

## Зачем версионировать

| Без миграций | С миграциями |
|--------------|--------------|
| «У меня работает» | Одинаковая схема везде |
| DDL в Slack | DDL в git PR |
| Кто что менял — неизвестно | `flyway_schema_history` |
| Откат app ≠ откат схемы | Осознанная стратегия schema |

```text
Developer → PR (V3__add_promo.sql) → CI flyway migrate → staging
         → merge → CD migrate prod → deploy app
```

## Подходы

| Подход | Плюсы | Минусы |
|--------|-------|-------|
| SQL-файлы (Flyway) | Прозрачно, DBA-friendly | Нет встроенного DOWN |
| Changelog XML/YAML (Liquibase) | Preconditions, rollback blocks | Сложнее, XML |
| ORM (Alembic, Django) | Рядом с моделями | Скрытый DDL, drift от raw SQL |
| Ручной psql | Быстро «на раз» | Катастрофа на scale |

Для этого курса — **Flyway** (основной) + понимание **Liquibase**. В FastAPI — Alembic ([fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md)); принципы те же.

## Идемпотентность

Миграция применяется **ровно один раз** — трекер (Flyway/Liquibase) решает, не `IF NOT EXISTS` на prod:

```sql
-- плохо как единственная защита на prod:
CREATE TABLE IF NOT EXISTS orders (...);

-- хорошо: версия V1 в flyway_schema_history
CREATE TABLE orders (...);
```

`IF NOT EXISTS` — для локальной отладки, не замена версионирования.

## Rollback-стратегии

### 1. Forward-only (рекомендуется)

Откат = **новая миграция**:

```sql
-- V4 добавил promo_code
-- V5 откатывает логически:
ALTER TABLE orders DROP COLUMN promo_code;
```

На prod с данными `DROP COLUMN` — только после contract phase.

### 2. Expand / contract

```text
V4: ADD promo_code NULLABLE     — expand (старый app игнорирует)
deploy app v2 (пишет promo)
V5: SET NOT NULL + default      — contract
V6: DROP old_column             — contract
```

См. [ops/08-zero-downtime](../postgresql-ops/08-zero-downtime.md).

### 3. Restore from backup

Катастрофа — PITR ([intermediate/09-pitr](../postgresql-intermediate/09-pitr.md)). Не «откат миграции».

## Кто применяет миграции

| Anti-pattern | Почему плохо |
|--------------|--------------|
| App при старте `migrate()` | Race при 10 pods, нет audit |
| DBA вручную на prod | Нет в git |
| CI job `flyway migrate` | ✅ Один runner, логи, secrets |

Отдельная роль `shop_migrator` — [security/02-scram](../postgresql-security/02-scram-auth.md).

## Типичные ошибки

1. `DROP COLUMN` без contract — старый app падает.
2. Долгий `CREATE INDEX` в транзакции — lock table ([performance](../postgresql-performance/README.md)).
3. Правка уже применённого V2.sql — checksum mismatch.
4. Миграции после deploy app — expand нарушен.
5. Одна миграция = 15 несвязанных изменений — сложный rollback.

## Чек-лист

- [ ] Зачем версионировать vs ручной DDL
- [ ] Forward-only vs DOWN
- [ ] Expand/contract для ADD/DROP column
- [ ] CI применяет миграции, не app pod
- [ ] История в `flyway_schema_history`

## Дальше

Flyway: [02-flyway.md](02-flyway.md).
