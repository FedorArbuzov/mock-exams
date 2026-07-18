# 23. Capstone: production-like event platform (4–6 часов)

## Цель проекта

Собрать **сквозной сценарий** advanced уровня: multi-topic pipeline, cluster ops, security tabletop, DLQ, mini design doc и **mock interview** self-assessment. Доказательство готовности к senior Kafka interview.

## Предварительно

Пройдены главы **01–22** или эквивалентный опыт. Стенды:

- [`deploy/kafka`](../../deploy/kafka/README.md) — single + cluster + optional ZK
- [`kafka-intermediate`](../kafka-intermediate/README.md) — RF, Registry (желательно)
- [`kuber-intermediate: StatefulSet`](../kuber-intermediate/01-statefulset.md) — для секции K8s (письменно)

---

## Часть A — Кластер и надёжность (90 мин)

1. Поднять **3-broker** cluster (`docker-compose.cluster.yml`).
2. Создать topics:

| Topic | Partitions | RF | min.insync.replicas |
|-------|------------|----|---------------------|
| `capstone.orders` | 12 | 3 | 2 |
| `capstone.orders.enriched` | 12 | 3 | 2 |
| `capstone.orders.dlq` | 6 | 3 | 2 |

3. Producer perf или kcat — **1000+** сообщений с key `order-{n}`.
4. Остановить брокер → зафиксировать URP → recovery ([16-lab-urp-recovery](16-lab-urp-recovery.md)).
5. Сохранить скрин/лог `describe --under-replicated-partitions` до и после.

**Deliverable:** `docs/ops-runbook.md` (локально) — 1 страница URP.

---

## Часть B — Pipeline и DLQ (90 мин)

1. Produce JSON orders: valid + **10% poison** (`amount:-1`).
2. Симулировать enrichment: valid → `capstone.orders.enriched` (kcat или скрипт).
3. Poison → `capstone.orders.dlq` с полем `_dlq.reason`.
4. Исправить poison batch → **replay** в enriched с **eventId** dedup (tabletop или sqlite).

**Deliverable:** таблица counts: in / enriched / dlq / replayed.

---

## Часть C — Security & managed (60 мин)

1. ACL matrix для `order-svc`, `analytics`, `admin` ([14-lab-acl-deny](14-lab-acl-deny.md)).
2. MSK vs Confluent one-pager для кейса «EU fintech» ([12-lab-managed-mapping](12-lab-managed-mapping.md)).

**Deliverable:** `security-acl.md` + `managed-choice.md`.

---

## Часть D — System design (60 мин)

Design doc **Notification platform** или свой вариант из [20-lab-system-design](20-lab-system-design.md) — полный rubric ≥10/12.

**Deliverable:** `design-notification.md`.

---

## Часть E — Interview readiness (30 мин)

1. Пройти [18-lab-mock-interview](18-lab-mock-interview.md) rapid fire.
2. Выучить 10 слабых вопросов из [interview-cheatsheet](interview-cheatsheet.md).

**Deliverable:** список «ещё повторить» (5 bullet).

---

## Часть F — K8s (письменно, 30 мин)

Опишите, как развернуть **3 broker Kafka** в Kubernetes:

- StatefulSet + Headless Service ([`01-statefulset`](../kuber-intermediate/01-statefulset.md));
- PVC на `log.dirs`;
- podManagementPolicy `OrderedReady`;
- почему **не** Deployment.

**Deliverable:** half-page ascii diagram.

---

## Критерии сдачи (self-check)

| # | Критерий |
|---|----------|
| 1 | RF=3 topic, URP incident воспроизведён |
| 2 | DLQ + replay с idempotency объяснены |
| 3 | ACL matrix + managed comparison |
| 4 | Design doc ≥10/12 rubric |
| 5 | Mock interview ≥7/10 rapid fire |
| 6 | K8s StatefulSet обоснование |

---

## Бонус

- Поднять ZK profile и сравнить с KRaft ([05-lab-zookeeper](05-lab-zookeeper.md)).
- Overlay Schema Registry (`docker-compose.extras.yml`) + Avro payload.
- Записать 3-min **video** объяснения KRaft vs ZK.

---

## После capstone

- Повторите [`interview-cheatsheet.md`](interview-cheatsheet.md) за неделю до реального интервью.
- Вернитесь к [`kafka-intermediate`](../kafka-intermediate/README.md) если пробелы в Connect/Registry.

Удачи на собеседовании.
