# 09. Dead letter и poison messages

## Введение

**Poison message** — сообщение, которое **всегда** падает (битый payload, bug, несовместимая схема). Без DLQ — бесконечный redelivery и **застой** очереди.

---

## По системам

| Система | Механизм |
|---------|----------|
| **SQS** | redrive policy → DLQ после N receives |
| **Rabbit** | dead letter **exchange** (DLX) |
| **Kafka** | нет native DLQ → отдельный topic `*.dlq` или skip + store |
| **Redis Streams** | pending + manual claim; нет стандарта DLQ |

---

## SQS DLQ

```hcl
maxReceiveCount = 3
dlq_arn = aws_sqs_queue.dlq.arn
```

Аларм на **ApproximateNumberOfMessagesVisible** в DLQ.

[aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md).

---

## Rabbit DLX

```text
main queue ──(reject/nack/expired)──► DLX exchange ──► dlq.queue
```

Отдельный consumer разбирает DLQ вручную или reprocess с fix.

[rabbitmq-intermediate](../rabbitmq-intermediate/README.md).

---

## Kafka «DLQ pattern»

```text
consumer fails parse
  → produce to orders.parse.errors with original bytes + reason
  → commit offset (или pause partition)
```

**Не блокируйте** partition навечно одним bad message — quarantine.

---

## Операционный runbook

1. Alert на DLQ depth.
2. Sample 10 messages — root cause.
3. Fix code / schema.
4. **Replay** из DLQ (script) или discard с ticket.

---

## Резюме

DLQ — **карантин**, не свалка. Без мониторинга DLQ — антипаттерн.

---

## Чек-лист

- [ ] DLQ есть на всех critical queues?
- [ ] Кто on-call на DLQ alert?
- [ ] Kafka error topic определён?

**Дальше:** [10. Outbox](10-outbox-saga.md).
