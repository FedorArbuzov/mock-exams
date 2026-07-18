# 12. CAP, eventual consistency и компромиссы

## Введение

«После оплаты заказ сразу в аналитике» — при сетевом разделении **нельзя** одновременно гарантировать всё. Микросервисы живут в **eventual consistency**; задача — **какие** несогласованности допустимы и как их **чинить**.

---

## CAP (практически)

При partition (P) выбирают между **C** (linearizable consistency) и **A** (availability):

| Выбор | Пример |
|-------|--------|
| CP | банковский ledger, etcd |
| AP | catalog cache, social feed |

В облаке partition **редки**, но **latency** и **partial failure** — ежедневны.

---

## Strong vs eventual

| Strong (в границах одного svc) | Eventual (между svc) |
|--------------------------------|----------------------|
| локальная TX Postgres | saga + outbox |
| read-your-writes в одной БД | projection lag |
| FK внутри сервиса | нет FK cross-service |

---

## Паттерны согласованности

| Паттерн | Описание |
|---------|----------|
| **Read-your-writes** | после POST user видит свой write (route to primary / sticky) |
| **Monotonic reads** | не «откатываться» во времени |
| **Causal** | связанные события в порядке |
| **Session consistency** | привязка к user session |

Для checkout: **strong** внутри Payment svc; **eventual** до Warehouse — OK с UX «обрабатывается».

---

## Компенсация vs prevention

| | Prevention | Compensation |
|--|------------|--------------|
| Идея | не допустить inconsistency | починить после |
| Пример | reserve before pay | refund if double charge |

Saga — compensation ([09-saga-patterns](09-saga-patterns.md)).

---

## Distributed lock (осторожно)

Redis/DB lock между сервисами — **хрупко** (TTL, fencing). Предпочитайте:

- идемпотентность
- unique business key
- saga state machine

---

## Тестирование consistency

| Тест | Что ловит |
|------|-----------|
| Chaos: kill consumer | lag, duplicate |
| Parallel place order same sku | oversell |
| Network delay | stale read |

---

## В mock-exams

| Тема | Курс |
|------|------|
| MVCC Postgres | [postgresql-basic](../postgresql-basic/README.md) |
| Redis consistency | [redis-intermediate](../redis-intermediate/README.md) |
| Messaging guarantees | [messaging-deep/02](../messaging-deep/02-delivery-guarantees.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 12.1 Consistency map (20 мин)

Таблица: пара сервисов (A→B) | strong/eventual | max lag | user-visible symptom |

### 12.2 CAP для 3 store (15 мин)

Order DB, Redis cache, Search index — для каждого CP/AP и почему.

### 12.3 Oversell scenario (15 мин)

Два параллельных заказа последнего SKU — какой механизм (reserve, optimistic lock, saga)? Sequence diagram.

### 12.4 Read-your-writes (10 мин)

После `POST /orders` список заказов — как гарантируете для user (без magic)?

### 12.5 Acceptable inconsistency (5 мин)

Одна «допустимая» несогласованность с бизнес-подписью стейкхолдера.

---

## Резюме

Распределённая система **выбирает**, где strong, где eventual. Документируйте lag и сценарии oversell; не обещайте ACID глобально.

---

## Чек-лист

- [ ] Consistency map заполнена?
- [ ] Oversell mitigated?
- [ ] Нет лишних distributed locks?

**Дальше:** [13. Resilience patterns](13-resilience-patterns.md).
