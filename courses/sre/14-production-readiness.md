# 14. Production readiness и launch

## Введение: «запускаем в понедельник — checklist не успели»

Новый сервис идёт на **миллион пользователей** после MVP в staging. Нет **лимитов** Pod, нет **runbook**, нет **on-call rotation**, метрики — «добавим потом». Launch day — P0, executive на линии. **Production Readiness Review (PRR)** — gate, который **не тормозит** ради бюрократии, а **переносит** известные сбои **до** пользователя.

---

## PRR / Launch checklist

Адаптируйте под сервис; пример **минимума**:

### Architecture & dependencies

- [ ] Диаграмма CUJ и зависимости  
- [ ] Failure modes documented ([глава 02](02-reliability-and-risk.md))  
- [ ] Timeouts, retries, circuit breakers на внешних API  
- [ ] Blast radius ограничен (не shared fate с beta)

### Observability

- [ ] SLI/SLO doc approved ([глава 03](03-sli-slo-sla.md))  
- [ ] Dashboards + burn alerts ([глава 07](07-alerting-on-call.md))  
- [ ] Logs structured, trace propagation (если distributed)  
- [ ] Deploy annotations

### Operations

- [ ] Runbook: deploy, rollback, scale, common failures  
- [ ] On-call rotation named  
- [ ] Escalation path  
- [ ] Capacity estimate + load test report ([глава 10](10-capacity-performance.md))

### Security & compliance

- [ ] Secrets не в Git ([secrets-basic](../secrets-basic/README.md))  
- [ ] RBAC least privilege  
- [ ] Dependency scan в CI ([gitlab-advanced](../gitlab-advanced/README.md))

### Data

- [ ] Backup + restore tested  
- [ ] Migration plan expand-contract ([глава 11](11-change-and-release.md))  
- [ ] RPO/RPO tier assigned ([глава 12](12-disaster-recovery.md))

### Release

- [ ] Canary/blue-green path  
- [ ] Feature flags for risky parts  
- [ ] Freeze window agreed with PM

---

## Кто участвует в PRR

| Роль | Вклад |
|------|-------|
| Service owner (dev EM) | accountable |
| SRE | SLO, ops, capacity |
| Security | threat model |
| PM | launch risk acceptance |
| Legal/support | SLA, comms template |

**Итог:** Go / No-Go / Go with conditions (written).

---

## Gradual launch

| Этап | Аудитория |
|------|-----------|
| Internal dogfood | employees |
| Beta % users | flag cohort |
| Single region | geo limit |
| GA | all |

Каждый этап — **критерии promote** по SLI.

---

## «No-Go» без обиды

SRE **блокирует** не «потому что злые», а по **policy** (budget, missing alerts). Альтернатива: **launch с ограниченным** трафиком + дата повторного PRR.

---

## Legacy services

PRR **ретроактивно** для старых систем: **tier-1** сначала, **tier-3** — упрощённый checklist. **Technical debt register** — видимый backlog.

---

## В mock-exams

Пройдите checklist для [`deploy/observability`](../../deploy/observability/README.md) demo-app как учебный сервис — что уже есть, чего не хватает для «prod».

---

## Чек-лист

- [ ] Есть ли PRR template в org?
- [ ] Последний launch — был review?
- [ ] No-Go когда-либо сработал конструктивно?

**Дальше:** [15. Экономика надёжности](15-economics-of-reliability.md).
