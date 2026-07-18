# 02. DevOps, SRE, Platform: роли и границы

## Введение

Вакансия «DevOps», в соседнем чате «SRE», в Confluence «Platform Team» — три названия, одни люди на созвоне. Без **границ** — дублирование или дыры.

Развёрнуто в [sre/01](../sre/01-what-is-sre.md); здесь — **организационный** ракурс.

---

## Сравнительная таблица

| | DevOps (культура) | SRE (практика) | Platform Engineering |
|---|-------------------|----------------|----------------------|
| **Фокус** | сквозная поставка | надёжность с SLO | продукт для разработчиков |
| **KPI** | lead time, частота | error budget, toil | adoption, time-to-first-deploy |
| **Типичный артефакт** | pipeline template | SLO doc, runbook | IDP, golden path |
| **Отношение к риску** | чаще релизить | измерять и торговать | стандартизировать |

**Один человек** может носить все три «шапки» — проблема, когда **три команды** делают одно без договорённости.

---

## Где садится SRE в организации

Модели из [sre/13](../sre/13-organizing-sre.md):

- **Centralized** — стандарты, риск bottleneck;
- **Embedded** — глубокий ownership, риск разнобоя;
- **Hybrid** — platform SRE + liaison в squads.

SRE **не заменяет** product DevOps-ответственность: squad всё равно **владеет** сервисом; SRE задаёт **рамку** надёжности.

---

## Platform team

**Внутренний продукт** для разработчиков:

```text
Developers (customers)
        ↓
Platform: K8s, CI, observability, secrets
        ↓
Cloud / bare metal
```

Успех platform — **самообслуживание**, не «заявка в Jira». Связь: [finops/11](../finops/11-process-culture.md), [gitops-*](../gitops-basic/README.md).

---

## Conway preview

Структура команд **повторяет** архитектуру ([глава 05](05-conway-law.md)). Если platform — «ещё один silo», получите **монолитный** ticket queue вместо платформы.

---

## Резюме

DevOps — **зонтик культуры**; SRE — **специализация по надёжности**; Platform — **продуктовая команда** для dev. Определите **interfaces** между ними письменно.

---

## Чек-лист

- [ ] Кто у вас владеет CI template — platform или каждый squad?
- [ ] Есть ли SLO owner вне «дежурного админа»?
- [ ] Platform измеряет adoption или только uptime кластера?

**Дальше:** [03. DORA metrics](03-dora-metrics.md).
