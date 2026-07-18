# 12. System design и собеседование

## Введение

Задача: «Спроектируйте уведомления о заказе для 1M заказов/день». Интервьюер ждёт **вопросы**, **trade-offs**, не «Kafka».

---

## Framework ответа (8 шагов)

1. **Clarify** — volume, latency, ordering, cloud, replay?
2. **Users** — кто producers/consumers?
3. **Model** — task vs event?
4. **Shortlist** 2–3 брокера.
5. **Pick** с таблицей.
6. **Deep dive** — partitions, DLQ, idempotency.
7. **Failure** — broker down, duplicate, lag.
8. **Observability** — lag, DLQ depth, age.

---

## Примеры кейсов

### Email после заказа (at-least-once OK)

| Вариант | Плюс |
|---------|------|
| SQS + Lambda | просто в AWS |
| Rabbit work queue | routing priority |
| Kafka | overkill без analytics |

**Ответ:** SQS или Rabbit; идемпотентный send email.

### Analytics + billing на все заказы

**Kafka** (или Kinesis) — несколько groups; retention 30d.

### «Переслать все заказы за вчера новому сервису»

Только **log** (Kafka). SQS/Rabbit **не подходят**.

### Низкая латентность in-app notify

Redis Pub/Sub или Streams; **не** Kafka path для UI tick.

---

## Вопросы интервью (шпаргалка)

| Вопрос | Ядро ответа |
|--------|-------------|
| Kafka — queue? | log, offset, retention |
| SQS vs SNS? | pull queue vs push fan-out |
| Как scale Kafka consume? | partitions = parallelism |
| Duplicate? | at-least-once + idempotent |
| Rabbit vs Kafka? | routing/tasks vs replay/log |
| Redis Streams vs Kafka? | scale, retention, ecosystem |

---

## Плохие ответы

- «Везде Kafka»
- «SQS не масштабируется»
- «Exactly-once везде»
- Игнор **ops** и **стоимости**

---

## Резюме

System design — **обоснованный выбор**, не logo picking.

---

## Чек-лист

- [ ] Пройдите один кейс вслух за 15 минут?
- [ ] Нарисовали diagram producer → bus → consumers?
- [ ] Назвали DLQ и idempotency?

**Дальше:** [13. Ops и cost](13-ops-cost-observability.md).
