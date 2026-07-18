# 10. Outbox, inbox, transactional messaging

## Введение

«Сначала запись в БД, потом publish» — между шагами crash → **рассинхрон**. **Transactional outbox** — паттерн **атомарности** бизнес-данных и события.

---

## Outbox pattern

```text
BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (event_type, payload) ...;
COMMIT;

relay (отдельный процесс) читает outbox → публикует в Kafka/SQS → DELETE/MARK sent
```

| Плюс | Минус |
|------|-------|
| no dual-write problem | relay lag, идемпотентность publish |
| works с любым брокером | схема outbox table |

[postgresql-developer](../postgresql-developer/README.md) — миграции; [kafka-connect](../kafka-intermediate/README.md) — CDC альтернатива.

---

## CDC vs outbox

| | Outbox table | Debezium CDC |
|---|--------------|--------------|
| Explicit events | да | все row changes |
| Schema control | высокий | changelog |
| Ops | relay app | Kafka Connect |

---

## Inbox (consumer side)

Дедуп на приёме:

```text
INSERT INTO inbox (message_id) ON CONFLICT skip;
process;
```

Пара с идемпотентным handler.

---

## Saga (кратко)

Распределённая транзакция через **компенсирующие** шаги:

```text
OrderCreated → ReserveInventory → ChargePayment
                    ↓ fail
              ReleaseInventory (compensate)
```

Оркестрация (central) vs хореография (events only). События — **Kafka/Rabbit**; состояние saga — DB.

Не путать saga с **2PC** (редко в microservices).

---

## Резюме

Брокер не делает транзакцию с вашей БД — **outbox** делает связь **надёжной**.

---

## Чек-лист

- [ ] Dual write без outbox где-то есть?
- [ ] Relay at-least-once — publish идемпотентен?
- [ ] Saga compensations определены?

**Дальше:** [11. Гибриды](11-hybrid-migration.md).
