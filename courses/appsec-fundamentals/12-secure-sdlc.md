# 12. Secure SDLC: gates, исключения, риск

## Введение

**Secure SDLC** — не «ещё один approval», а **повторяемые gates** с понятными критериями: что блокирует merge, как оформить exception, кто принимает риск.

---

## Gates по стадиям

| Стадия | Gate | Owner |
|--------|------|-------|
| Design | threat model checklist | tech lead |
| Dev | SAST, unit tests | developer |
| MR | secret scan, dep scan | CI |
| Build | container scan HIGH+ | CI |
| Deploy | IaC scan, signed image | platform |
| Prod | PSA restricted, NP | platform |

```text
Fail gate → fix OR documented exception (time-boxed)
```

---

## Severity и SLA

| Severity | Пример | SLA fix |
|----------|--------|---------|
| Critical | RCE, public bucket | 24–72h |
| High | privileged pod template | 2 weeks |
| Medium | missing resource limits | sprint |
| Low | info disclosure in dev | backlog |

Согласовать с **risk appetite** бизнеса (страхование — строже).

---

## Risk acceptance (exception)

Минимум в ticket:

- CVE или finding ID
- **Business justification**
- **Compensating controls** (WAF, network isolation)
- **Expiry date** (max 90 days)
- **Approver** (security + product)

Запрет: `allow_failure: true` forever в `.gitlab-ci.yml`.

---

## Security champions

| Роль | Время | Задачи |
|------|-------|--------|
| Champion в squad | ~10% | review TM, triage SAST |
| Central platform | full-time | policies, tooling |

Связь: [devops-culture/09](../devops-culture/09-stream-and-platform.md).

---

## Training

| Аудитория | Тема |
|-----------|------|
| Devs | OWASP, secure coding |
| DevOps | K8s misconfig, IAM |
| All | phishing, secret hygiene |

Один раз в год «курс» без практики не работает — нужны **лабы** в mock-exams.

---

## Metrics для улучшения

| Метрика | Anti-pattern |
|---------|--------------|
| Time to remediate critical | hiding in «won't fix» |
| % repos with SAST | manual-only review |
| Repeat findings | same SG rule каждый quarter |

---

## Взаимодействие с compliance

Audit спросит: **доказательство** gate (pipeline screenshot, policy export). Храните:

- Kyverno ClusterPolicy в Git
- `.gitlab-ci.yml` security stages
- Exception register

---

## В mock-exams

| Тема | Курс |
|------|------|
| CI culture | [devops-culture/10](../devops-culture/10-cicd-culture.md) |
| GitLab security | [gitlab-advanced](../gitlab-advanced/README.md) |
| Production readiness | [sre/14](../sre/14-production-readiness.md) |

---

## Резюме

SDLC security — **автоматические gates + прозрачные exceptions + owners**. Platform предоставляет **шаблоны**; продукт не обходит их без записи.

---

## Чек-лист

- [ ] Определены SLA по severity?
- [ ] Есть register исключений с expiry?
- [ ] Security stage required на main?

**Дальше:** [13. Compliance](13-compliance-benchmarks.md).
