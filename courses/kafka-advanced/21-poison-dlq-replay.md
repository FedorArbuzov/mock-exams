# 21. Poison message, DLQ и безопасный replay

## Введение: «одно сообщение валит весь consumer»

JSON с **невалидным полем** после deploy schema v2. Consumer падает в цикле, **lag** растёт, остальные сообщения не обрабатываются. Нужны **DLQ**, **quarantine**, **replay** без двойных SMS клиенту.

## Что вы узнаете

- **Poison pill** vs **transient** error.
- Паттерны **DLQ** (dead-letter queue/topic).
- **Retry** с backoff и max attempts.
- **Replay** и идемпотентность.
- Connect / Streams ошибки (обзор).

**Лаба:** [22-lab-dlq](22-lab-dlq.md).

---

## Классификация ошибок

| Тип | Пример | Стратегия |
|-----|--------|-----------|
| Transient | DB timeout | retry с jitter |
| Poison | schema mismatch | DLQ после N tries |
| Bug | NPE на null | fix code, replay DLQ |

---

## DLQ topic design

```text
orders.events          → consumer billing
orders.events.dlq      → manual / tooling replay
orders.events.retry.30s → optional delay topic (retry tier)
```

| Практика | Зачем |
|----------|-------|
| Metadata в headers | `original-topic`, `offset`, `error`, `timestamp` |
| Same key as source | ordering при replay |
| Retention DLQ длинный | расследование |

---

## Consumer pseudo-flow

```text
while poll:
  for record in batch:
    try:
      process(record)
    except PoisonError:
      produce(dlq, enriched(record))
    except TransientError:
      retry buffer or seek back
  commitSync()
```

**Не** commit до успешной обработки (at-least-once) или используйте transactions.

---

## Retry tiers (Kafka-native patterns)

1. **In-process** retry 3× — быстро.
2. **Retry topic** с задержкой (отдельный consumer или `delay` service) — разгрузка.
3. **DLQ** — human intervention.

**Exponential backoff** не встроен в Kafka — реализуйте в app или используйте **Kafka Connect** / **Spring Kafka** `DefaultErrorHandler`.

---

## Replay

| Шаг | Действие |
|-----|----------|
| 1 | Fix bug / schema |
| 2 | Deploy |
| 3 | Consume DLQ → target topic (tool) |
| 4 | Monitor duplicate rate |

**Idempotency key** = `eventId` в target DB unique index.

**Replay не** «seek to beginning» prod topic без понимания side effects.

---

## Kafka Connect

- `errors.tolerance=all` — осторожно, используйте `errors.deadletterqueue.topic.name`.
- **SMT** не маскируют poison навсегда.

---

## Kafka Streams

- `default.deserialization.exception.handler`
- `ProcessingExceptionHandler` (версия-зависимо)
- Failed records → **dead-letter topic** via punctuator/custom

---

## Governance

- Alert на **DLQ rate** spike.
- Runbook: кто approve replay в prod.
- PII в DLQ — те же ACL что source.

---

## На собеседовании

**Вопрос:** «Exactly-once и DLQ?» — DLQ — at-least-once path; EOS session отдельно; replay идемпотентен на sink.

---

## Резюме

Poison message неизбежен. **DLQ + metadata + idempotent replay** — стандарт senior answer.

**Дальше:** [22-lab-dlq](22-lab-dlq.md).
