# 17. Антипаттерны: distributed monolith и др.

## Введение

Микросервисы на бумаге, монолит в боли — **распределённый монолит**. Глава — каталог антипаттернов с **симптомами** и **лечением**.

---

## Distributed monolith

| Симптом | Лечение |
|---------|---------|
| Деплой всех svc вместе | границы, contract, CI split |
| Shared database | [08-database-per-service](08-database-per-service.md) |
| Синхронная цепочка 6+ hop | async, BFF, re-boundary |
| Общий `lib-domain` | ACL, duplicate DTO |

---

## Nanoservices

Сервис на 200 строк «потому что микро»:

| − | |
|---|---|
| ops overhead | network > compute |
| нет владельца | |

**Правило:** сервис должен **нести смысл** bounded context, не «один endpoint».

---

## God service / ESB

«Integration service» знает все модели и маршрутизирует всё — **снова монолит**, но с XML.

Лечение: events + ACL; integration — тонкий adapter.

---

## Chatty API

20 HTTP на один экран без BFF — latency и хрупкость.

Лечение: [07-gateway-bff-mesh](07-gateway-bff-mesh.md), GraphQL осторожно.

---

## Distributed transactions (2PC)

XA на проде между Postgres и Kafka — **избегать**.

Лечение: saga + outbox.

---

## Retry on POST storm

Без idempotency — duplicate orders.

Лечение: [08-idempotency](../api-design/08-idempotency-retries.md), [09-saga](09-saga-patterns.md).

---

## Logging без correlation

«Error in payment» × 50 pod — невозможно связать.

Лечение: [14-distributed-observability](14-distributed-observability.md).

---

## Premature microservices

Стартап 5 человек, 15 сервисов, 0 пользователей.

Лечение: [01-monolith-vs-microservices](01-monolith-vs-microservices.md) — modular monolith.

---

## В mock-exams

| Тема | Курс |
|------|------|
| DevOps anti-patterns | [devops-culture/12](../devops-culture/12-anti-patterns.md) |
| Container security | [containers-basic/14](../containers-basic/14-security.md) |

---

## Подзадачи

**Время:** ~55–65 мин.

### 17.1 Self-assessment (20 мин)

Для вашего (или учебного) проекта: отметьте 0–3 каждый антипаттерн (0=нет, 3=критично). Топ-3 проблемы.

### 17.2 Root cause (15 мин)

Для топ-1: org причина (Conway) + tech причина.

### 17.3 Remediation plan (15 мин)

Для топ-1: 3 шага на квартал (не «переписать всё»).

### 17.4 Nanoservice audit (10 мин)

Есть ли svc с одним endpoint и без owner? Список merge candidates.

### 17.5 «Мы не микросервисы» (5 мин)

Когда честно вернуть название «modular monolith» — критерии для вашей org.

---

## Резюме

Антипаттерны узнаются по **деплою, данным и отладке**, не по количеству Docker-контейнеров. Лечение почти всегда — границы и упрощение.

---

## Чек-лист

- [ ] Top-3 anti-pattern задокументированы?
- [ ] Remediation realistic?
- [ ] Нет 2PC в архитектуре?

**Дальше:** [18. Playbook миграции](18-migration-playbook.md).
