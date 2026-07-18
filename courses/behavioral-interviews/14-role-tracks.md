# 14. Backend, DevOps, SRE: акценты историй

## Введение

Один story bank — разные **акценты** при подаче. Backend спрашивают про продукт и API; DevOps — про delivery и инциденты; SRE — про SLO и blameless.

---

## Backend / fullstack Python

| Компетенция | Пример истории |
|-------------|----------------|
| Quality | contract tests, [fastapi/32](../fastapi/32-contract-tests.md) |
| Performance | N+1, caching |
| Collaboration | API с frontend/мобилкой |
| Ownership | фича от идеи до prod |

Курсы: [fastapi](../fastapi/README.md), [django](../django/README.md), [python-testing](../python-testing/README.md).

---

## DevOps / platform

| Компетенция | Пример |
|-------------|--------|
| Automation | pipeline, GitOps |
| Reliability | mockctl deploy, rollback |
| Security | secrets, SAST в MR |
| Cost | finops-aware change |

Курсы: [gitlab-advanced](../gitlab-advanced/README.md), [gitops-*](../gitops-basic/README.md), [kuber-*](../kuber-basic/README.md).

---

## SRE

| Компетенция | Пример |
|-------------|--------|
| SLO | error budget policy |
| Incident | commander role, comms |
| Toil reduction | automation |
| Postmortem | [sre/09](../sre/09-postmortems.md) |

---

## Подзадачи

**Время:** ~50 мин.

### 14.1 Роль (5 мин)

Ваша целевая дорожка.

### 14.2 Top 5 компетенций (15 мин)

Для этой роли — приоритет из [04](04-competencies.md).

### 14.3 Переупаковка (20 мин)

2 истории из bank — акцент под DevOps vs backend.

### 14.4 Техническая связка (10 мин)

Одна фраза «из курса mock-exams применил X на работе».

---

## Чек-лист

- [ ] Истории релевантны JD?
- [ ] Не DevOps-истории на pure backend без связи?

**Дальше:** [15. Reverse questions](15-reverse-questions.md).
