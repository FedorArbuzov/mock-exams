# 20. Лаба: system design — «Notification platform»

## Цель

Написать **design doc** на 2–3 страницы Markdown (локальный файл `my-design.md`, не в репозитории) по кейсу ниже. Сверить с rubric.

## Кейс

**Notification platform** для fintech:

- Источники: `payment.completed`, `kyc.verified`, `fraud.flagged`.
- Каналы: email, SMS, push (отдельные workers).
- Peak: **8k events/s**, average 800/s.
- Payload: 1–4 KB JSON → Avro migration planned.
- **Regulatory:** audit trail 7 лет (cold storage acceptable).
- **SLA:** 95% notifications < 30s from event time.
- Team: 3 backend, 1 platform.

---

## Задание 1. Requirements doc (½ стр)

Разделите:

- Functional (bullets)
- Non-functional (latency, durability, compliance)
- Out of scope (explicit)

---

## Задание 2. Capacity (½ стр)

Посчитайте:

- partition count recommendation per topic;
- rough disk/month with RF=3, 7y only for audit topic (tiered OK);
- number of consumer instances per channel (upper bound).

---

## Задание 3. Diagram

Mermaid или ascii:

- 3 source topics minimum;
- routing / enrichment;
- DLQ per channel;
- Schema Registry;
- metrics.

---

## Задание 4. Failure scenarios (таблица)

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Broker AZ down | | |
| Schema incompatible deploy | | |
| SMS provider 500 | | |
| Consumer stuck (poison) | | |

Минимум **6 строк**.

---

## Задание 5. Security & multi-tenancy

- ACL: кто пишет `payment.*`?
- PII в payload — маскирование в logs?
- Separate cluster dev/stage/prod?

---

## Rubric (самооценка / peer)

| Критерий | 0–2 |
|----------|-----|
| Partition/key strategy | |
| DLQ + idempotency | |
| Retention/tiered for 7y | |
| Observability | |
| Realistic staffing | |

**10–12** — strong hire level для design round.

---

## Эталонные элементы (после своей попытки)

- Topic per domain event; **key** = `userId` для ordered notifications per user.
- **Fraud** fast path — отдельный consumer group с priority topic.
- **DLQ** `notifications.{channel}.dlq` + replay tool.
- **audit** topic → S3 via Connect + tiered Kafka 30d hot.
- Lag alert + URP alert on cluster.
- Idempotency: `notificationId` dedup store (Redis/DB).

---

## Критерии успеха

- [ ] Design doc 2+ страниц.
- [ ] Rubric ≥10.
- [ ] 6 failure rows.

**Дальше:** [21-poison-dlq-replay](21-poison-dlq-replay.md).
