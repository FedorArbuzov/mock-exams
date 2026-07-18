# 20. Синтез: Architecture Decision Record

## Финальное задание

Соберите **все подзадачи** курса в один **Microservices ADR** для продукта ([image-platform](../aws-intermediate/projects/image-platform/), [fastapi/42](../fastapi/42-capstone.md) или свой).

**Время:** ~**3–4 часа**.

---

## Deliverable structure

### 1. Executive summary (½ стр)

- Рекомендация: **stay modular monolith / hybrid / full microservices**
- 3 ключевых риска
- Horizon: 12 мес roadmap

### 2. Context & drivers (из гл. 01–03)

| Раздел | Содержание |
|--------|------------|
| Decision matrix | взвешенные scores |
| Bounded contexts | context map |
| Teams | stream/platform, Conway note |

### 3. Target architecture (из гл. 05–08, 13)

```text
[диаграмма: client → GW/BFF → services → data]
```

| Сервис | Owner | Store | Public API |
|--------|-------|-------|------------|
| … | … | … | Y/N |

### 4. Communication (гл. 05–07)

| Flow | Sync/async | Contract | Timeout |
|------|------------|----------|---------|
| … | … | … | … |

Event catalog (top 10 events).

### 5. Data & consistency (гл. 08–12)

- Data ownership map
- Saga: orchestration/choreography + compensation table
- Outbox: да/нет, relay type
- CQRS: где projections
- Consistency map + acceptable lag

### 6. Resilience & ops (гл. 13–15)

- Resilience policy table (4 dependencies)
- Tracing/logging standard
- Deploy independence checklist
- Canary metrics

### 7. Testing (гл. 16)

- Test pyramid %
- Contract pairs list
- E2E critical 5

### 8. Migration (гл. 04, 17–18)

- Phase 0–4 timeline
- Strangler #1 service
- Anti-patterns acknowledged + remediation

### 9. Rejected alternatives

Минимум **три**:

| Alternative | Почему нет |
|-------------|------------|
| Big bang rewrite | … |
| 2PC | … |
| GraphQL everywhere | … |

### 10. Open questions

5 вопросов к стейкхолдерам с deadline.

---

## Мастер-таблица курса

| Тема | Глава |
|------|-------|
| Нужны ли microservices? | [01](01-monolith-vs-microservices.md) |
| Границы домена | [02](02-bounded-context-ddd.md) |
| Команды | [03](03-conway-teams.md) |
| Миграция постепенно | [04](04-strangler-extraction.md) |
| Sync | [05](05-sync-communication.md) |
| Events | [06](06-async-events.md) |
| GW/BFF/mesh | [07](07-gateway-bff-mesh.md) |
| Data ownership | [08](08-database-per-service.md) |
| Saga | [09](09-saga-patterns.md) |
| Outbox/ES | [10](10-outbox-eventsourcing.md) |
| CQRS | [11](11-cqrs-read-models.md) |
| Consistency | [12](12-consistency-cap.md) |
| Resilience | [13](13-resilience-patterns.md) |
| Observability | [14](14-distributed-observability.md) |
| Deploy | [15](15-deployment-versioning.md) |
| Tests | [16](16-testing-strategy.md) |
| Антипаттерны | [17](17-anti-patterns.md) |
| Playbook | [18](18-migration-playbook.md) |
| Cases | [19](19-system-design-cases.md) |

---

## Карта курса

```text
01–04   Решение и границы
05–08   Коммуникация и данные
09–12   Saga, outbox, CQRS, CAP
13–16   Resilience, ops, tests
17–20   Антипаттерны, миграция, ADR
```

---

## В mock-exams — практика после ADR

| ADR пункт | Курс / стенд |
|-----------|--------------|
| Реализовать API + outbox | [fastapi](../fastapi/README.md) + [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Async fan-out | [python-async](../../deploy/python-async/README.md) |
| Celery saga steps | [deploy/celery](../../deploy/celery/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| K8s deploy | `mockctl` + [gitops-basic](../gitops-basic/README.md) |
| Tracing | [fastapi/38](../fastapi/38-opentelemetry.md) |

---

## Подзадачи финала

### 20.1 Draft sections 1–3 (60 мин)

Executive + context + target diagram.

### 20.2 Draft sections 4–6 (60 мин)

Communication, data, resilience.

### 20.3 Draft sections 7–10 (45 мин)

Testing, migration, rejected, questions.

### 20.4 Peer review (30 мин)

Checklist: другой студент/коллега отмечает 5 слабых мест.

### 20.5 Revision (30 мин)

Исправить top-3 замечания.

---

## Резюме

Microservices — **система решений**, не количество репозиториев. ADR фиксирует **почему**, **что** и **в каком порядке**; без него команда повторяет distributed monolith.

---

## Чек-лист курса

- [ ] Все 19 глав: подзадачи выполнены (хотя бы черновик)?
- [ ] ADR 10 секций заполнены?
- [ ] 3 rejected alternatives?
- [ ] Migration phase 0 gate realistic?
- [ ] Практика в mock-exams запланирована?

**Курс завершён.** Дальше: [messaging-deep](../messaging-deep/README.md), [api-design](../api-design/README.md), [kuber-advanced](../kuber-advanced/README.md), [sre](../sre/README.md).
