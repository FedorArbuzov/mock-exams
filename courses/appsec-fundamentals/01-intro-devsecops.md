# 01. AppSec, DevSecOps и shift-left

## Введение

«Безопасность — в конце спринта, отдельным тикетом» приводит к **панике перед аудитом** и дорогим переделкам. **DevSecOps** встраивает контроли в **тот же поток**, что и код и инфраструктура: раннее обнаружение дешевле, чем инцидент в prod.

**AppSec** (Application Security) — защита **приложений и данных** (уязвимости, аутентификация, логика). **Infrastructure / Cloud Security** — **платформа** (K8s, IAM, сеть, шифрование). На практике DevOps-инженер на стыке обоих.

---

## Три столпа

| Столп | Вопрос | Примеры |
|-------|--------|---------|
| **People** | Кто владеет риском? | security champion в команде, обучение |
| **Process** | Когда проверяем? | threat model на design, gate в MR |
| **Technology** | Чем автоматизируем? | SAST, Trivy, Kyverno, GuardDuty |

Без процесса инструменты дают **шум**; без технологии процесс не масштабируется.

---

## Shift-left vs shift-everywhere

```text
Design → Code → Build → Deploy → Run
   ↑        ↑       ↑        ↑       ↑
  TM      SAST    scan    policy  runtime
```

| Фаза | Контроль | Стоимость исправления |
|------|----------|----------------------|
| Design | threat model, data classification | низкая |
| Code | SAST, secret scan | низкая–средняя |
| Build | dependency + image scan | средняя |
| Deploy | IaC scan, admission | средняя |
| Run | audit, Falco, alerts | высокая (уже в prod) |

**Shift-left** — не «только до merge», а **раньше по цепочке**, плюс **непрерывность в runtime**.

---

## DevSecOps vs «отдел безопасности»

| Модель | Плюс | Минус |
|--------|------|-------|
| Central security team | экспертиза, стандарты | bottleneck, «стена» |
| Embedded champion | контекст продукта | неполное покрытие |
| **Platform + policy** | self-service guardrails | нужна зрелая платформа |

В mock-exams платформа — **GitLab CI + mockctl + Terraform**: security team задаёт **политики и шаблоны**, команды — **исполняют в MR**.

---

## Роли на стыке

| Роль | Фокус |
|------|--------|
| AppSec engineer | код, API, SAST/DAST, SDLC |
| Cloud security | IAM, landing zone, CSPM |
| **DevSecOps / Platform** | K8s, CI/CD, IaC, automation |
| SRE | надёжность; security — часть SLO и blast radius |

Связь: [devops-culture/02](../devops-culture/02-devops-sre-platform.md), [sre/14-production-readiness](../sre/14-production-readiness.md).

---

## Метрики (не vanity)

| Метрика | Зачем |
|---------|--------|
| **MTTR security finding** | скорость закрытия critical |
| **% MR с пройденным security pipeline** | adoption |
| **Mean time to patch CVE (base image)** | supply chain |
| **Misconfig open > 30 days** | governance |

Не путать с «количество найденных уязвимостей» без контекста severity и age.

---

## В mock-exams

| Практика | Курс |
|----------|------|
| Pipeline security | [gitlab-advanced](../gitlab-advanced/README.md) |
| Container hardening | [containers-basic/14](../containers-basic/14-security.md) |
| K8s admission | [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md) |
| Cloud audit | [aws-advanced/21](../aws-advanced/21-guardduty-config-trail.md) |

---

## Резюме

DevSecOps — **культура и автоматизация** на всём lifecycle. Инженер инфраструктуры отвечает за **безопасную платформу**; продуктовая команда — за **безопасный код** в рамках guardrails.

---

## Чек-лист

- [ ] Назовите три фазы, где дешевле всего ловить уязвимость.
- [ ] Чем AppSec отличается от cloud security в вашем проекте?
- [ ] Есть ли у вас security gate в MR?

**Дальше:** [02. Threat modeling](02-threat-modeling.md).
