# 18. Playbook миграции с монолита

## Введение

Практический **порядок работ** от modular monolith к N сервисам: не теория, а фазы, gate criteria и метрики успеха. Связывает strangler ([04](04-strangler-extraction.md)), data ([08](08-database-per-service.md)), ops ([14](14-distributed-observability.md)).

---

## Phase 0 — Prerequisites

| Gate | Критерий |
|------|----------|
| CI/CD | один click deploy monolith |
| Observability | logs + metrics + tracing на monolith |
| Modular code | apps/packages по bounded context |
| ADR process | решения пишутся |

Без tracing **не** режьте production.

---

## Phase 1 — Extract supporting service

Первый кандидат: **Notification**, **File storage**, **PDF** — мало бизнес-связей.

| Шаг | Действие |
|-----|----------|
| 1 | Facade route |
| 2 | Async interface (queue) |
| 3 | Cut traffic |
| 4 | Delete monolith module |

Быстрая победа для команды.

---

## Phase 2 — Extract read-heavy context

Catalog search, recommendations — **CQRS lite** + отдельный read store ([11-cqrs-read-models](11-cqrs-read-models.md)).

Write остаётся в монолите; read из нового svc.

---

## Phase 3 — Core domain с saga

Order + Payment + Inventory — **после** опыта outbox/saga.

| Шаг | Действие |
|-----|----------|
| 1 | Outbox в monolith |
| 2 | Consumers в новых svc |
| 3 | Branch by abstraction |
| 4 | Split write DB |

Самая длинная фаза (кварталы).

---

## Phase 4 — Decommission monolith

| Gate | Критерий |
|------|----------|
| Traffic | <1% на monolith routes |
| Data | no authoritative tables in monolith DB |
| Team | нет «монолитных» on-call only |

Archive repo; read-only на 3 мес.

---

## Rollback на каждой фазе

```text
Feature flag → 100% monolith route
DB: monolith остаётся source of truth до phase gate
Events: consumers dual или tolerant
```

---

## Метрики миграции

| Метрика | Зачем |
|---------|-------|
| % traffic on new svc | progress |
| Error rate delta | regression |
| p99 checkout | не ухудшить |
| Deploy frequency per svc | independence |
| MTTR | ops maturity |

---

## Team ramp

| Роль | Действие |
|------|----------|
| Stream teams | владение svc |
| Platform | templates, CI, mesh |
| Enabling | contract tests workshop |

[03-conway-teams](03-conway-teams.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| Strangler nginx | [nginx-basic](../nginx-basic/README.md) |
| Celery extract | [python-celery](../python-celery/README.md) |
| GitLab pipeline | [gitlab-intermediate](../gitlab-intermediate/README.md) |

---

## Подзадачи

**Время:** ~65–75 мин.

### 18.1 Roadmap (25 мин)

Gantt (текстом): Phase 0–4 с длительностью в неделях для вашего продукта.

### 18.2 First service (15 мин)

Какой supporting svc первый? One-pager extract plan.

### 18.3 Phase 3 risks (15 мин)

Топ-5 рисков core split + mitigation.

### 18.4 Gate checklist (10 мин)

Чеклист «можно выключить monolith route X» (10 пунктов).

### 18.5 Stakeholder comms (10 мин)

Шаблон письма: «почему не big bang, что увидит бизнес».

---

## Резюме

Миграция — **много кварталов**, фазы с gates, первый svc — простой. Core domain последним, с outbox и saga готовностью.

---

## Чек-лист

- [ ] Phase 0 gates зелёные?
- [ ] Rollback на каждой фазе?
- [ ] Метрики progress определены?

**Дальше:** [19. System design: кейсы](19-system-design-cases.md).
