# 10. Outbox, inbox и event sourcing

## Введение

Запись в БД прошла, publish в Kafka — нет (crash между ними). **Dual write** — классический баг микросервисов. **Transactional outbox** атомарно сохраняет бизнес-данные и «намерение опубликовать».

---

## Transactional outbox

```text
BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (id, type, payload, created_at) VALUES ...;
COMMIT;

Relay process:
  SELECT * FROM outbox WHERE sent_at IS NULL FOR UPDATE SKIP LOCKED
  → publish to broker
  → UPDATE outbox SET sent_at = now()
```

| Компонент | Роль |
|-----------|------|
| Business TX | order + outbox row |
| Relay | отдельный worker / CDC |
| Broker | at-least-once delivery |

Детали: [messaging-deep/10](../messaging-deep/10-outbox-saga.md), [fastapi/14 outbox mention](../fastapi/14-sessions-repos.md).

---

## Relay: polling vs CDC

| | Polling outbox | Debezium CDC |
|--|----------------|--------------|
| Простота | высокая | infra Kafka Connect |
| Latency | секунды | миллисекунды–секунды |
| Event shape | явный domain event | все изменения row |

---

## Inbox (consumer)

```sql
INSERT INTO inbox (message_id, received_at)
VALUES ($1, now())
ON CONFLICT (message_id) DO NOTHING
RETURNING message_id;
-- если NULL → уже обработано
```

Пара с идемпотентным handler — **effectively-once processing**.

---

## Event sourcing (ES)

Состояние агрегата = **цепочка событий**, не текущая row:

```text
OrderCreated + ItemAdded + OrderPaid → snapshot read model
```

| + | − |
|---|---|
| audit, replay | сложность, schema evolution |
| temporal queries | кривая обучения команды |

**Не** внедряйте ES везде — только где replay/audit **оправдан**.

---

## CQRS + ES

Write side append events; read side **проекции** в удобные таблицы ([11-cqrs-read-models](11-cqrs-read-models.md)).

---

## Когда outbox достаточно

Большинству систем нужен **outbox + обычные таблицы**, не полный ES:

| Нужно | Паттерн |
|-------|---------|
| Надёжный publish | outbox |
| История всех изменений | ES |
| Быстрые списки | CQRS projection |

---

## В mock-exams

| Тема | Курс |
|------|------|
| Outbox theory | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Kafka Connect CDC | [kafka-intermediate/15](../kafka-intermediate/15-kafka-connect.md) |
| Celery worker | [python-celery](../python-celery/README.md) |

---

## Подзадачи

**Время:** ~60–70 мин.

### 10.1 Outbox schema (15 мин)

Спроектируйте таблицу `outbox`: колонки, индексы, TTL/archival.

### 10.2 Failure scenarios (15 мин)

Таблица: relay упал после publish до mark sent | duplicate publish | порядок событий — что делает consumer.

### 10.3 Inbox (10 мин)

DDL `inbox` + псевдокод handler с dedup.

### 10.4 ES decision (15 мин)

Для Order: ES **да/нет** — 5 критериев. Если нет — что используете вместо audit.

### 10.5 Relay choice (10 мин)

Polling vs CDC для вашего объёма (events/day оценка).

---

## Резюме

Outbox — **минимальный must-have** для надёжных событий. ES — мощный, но дорогой; inbox закрывает consumer dedup.

---

## Чек-лист

- [ ] Нет dual write без outbox?
- [ ] Relay идемпотентен?
- [ ] ES justified?

**Дальше:** [11. CQRS и read models](11-cqrs-read-models.md).
