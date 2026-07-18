# 05. Toil, автоматизация и пределы скриптов

## Введение: «мы тонем в рутине»

On-call за неделю: **47 тикетов** «перезапусти Pod», **12** «добавь disk», **8** «сбрось пароль в staging». Автоматизация — один скрипт на Python, который никто не поддерживает. Новый инженер тратит **3 дня** на доступы. SRE-лид видит: команда **не успевает** делать postmortem actions, потому что **тонет в toil**. Google предлагает ориентир: **не более 50%** времени SRE на toil — остальное на **инженерию**, устраняющую класс проблем.

---

## Что такое toil

**Toil** — операционная работа, которая:

1. **Ручная** — требует человека (пока не автоматизировали).
2. **Повторяющаяся** — снова и снова.
3. **Автоматизируемая** — в принципе можно скрипт/сервис.
4. **Без долгосрочной ценности** — не делает систему **устойчивее** к классу сбоев.
5. **Растёт с сервисом** — чем больше нагрузка, тем больше toil.

**Не toil:** написать controller, который **навсегда** чинит drift; postmortem action; проектирование SLO.

| Toil | Не toil |
|------|---------|
| ручной restart | HPA + proper probes |
| copy-paste dashboard | генерация из Terraform |
| «почисти диск на сервере» | авто-expansion PVC |
| on-call тикет «подними staging» | self-service preview env |

---

## Почему toil опасен

- **Выгорание** on-call.
- **Задержка** reliability work → больше инцидентов → больше toil (**порочный круг**).
- **Bus factor** — только Вася знает ritual.
- **Ложное** ощущение «мы ops, значит тушим» вместо «чиним систему».

---

## Измерение toil

Раз в квартал (или после каждого инцидента):

| Метрика | Как |
|---------|-----|
| % времени on-call на toil | теги в тикетах, опрос |
| Top 5 repetitive tickets | отчёт ITSM / Jira |
| Toil budget в sprint | N story points на automation |

**Цель:** каждый квартал **−X%** часов на top-3 toil item.

---

## Иерархия устранения toil

1. **Убрать причину** — почему Pod рестартится? ([kuber-basic](../kuber-basic/README.md) probes, limits).
2. **Self-service** — разработчик сам поднимает preview ([gitlab-intermediate](../gitlab-intermediate/README.md)).
3. **Автоматизация** — runbook → Job / Operator.
4. **Принять** (временно) — если дешевле, чем автоматизация; **с дедлайном**.

---

## Автоматизация: ловушки

| Ловушка | Пример |
|---------|--------|
| **Хрупкий скрипт** | SSH + sed без idempotency |
| **Snowflake** | «только prod-2 так» |
| **Без тестов** | скрипт ломает prod в 3 ночи |
| **Без owner** | «скрипт дяди Вовы» |
| **100% coverage day 1** | никогда не ship |

**Хорошая автоматизация:** idempotent, versioned in Git, CI, rollback, **алерт если failed**.

Связь: [gitops-basic](../gitops-basic/README.md), [aws-terraform](../aws-terraform/README.md).

---

## Runbook vs automation

| Runbook | Automation |
|---------|------------|
| шаги для человека | выполняет машина |
| нужен при novel failure | для **известного** класса |
| обновляется после postmortem | код review |

Путь: **runbook 3 раза** → **автоматизировать** 4-й.

---

## Platform как антитоил

Internal platform ([gitlab-intermediate](../gitlab-intermediate/README.md), paved road) снимает toil **массово**: golden Dockerfile, стандартные probes, автоматический deploy в staging.

SRE вкладывается в **platform primitives**, не в **ручное** «поднять сервис Ивану».

---

## Делегирование toil

Не всё должен делать SRE:

| Задача | Кому |
|--------|------|
| app-level bug | dev team |
| quota AWS | finops / cloud team |
| access HR offboarding | security + IAM automation |

SRE **консультирует** guardrails; **не** становится «всемогущим helpdesk».

---

## Кейс: недельный on-call

| День | События | Toil? |
|------|---------|-------|
| Пн | 20× restart Pod OOM | да — нет limits |
| Вт | 1× novel DB corruption | нет — расследование |
| Ср | 15× «сбрось кэш» | да — нет self-service |
| Чт | deploy + мониторинг | нет |
| Пт | 30× ticket access staging | да — IAM automation |

**Итог:** 65/70 тикетов — **toil** → проект: limits + runbook automation + self-service portal.

---

## SRE time allocation (ориентир Google)

| Категория | % |
|-----------|---|
| Toil | ≤50 |
| Project (reliability, automation) | ≥25 |
| On-call (включая incidents) | остальное |

Если project **0%** три квартала — SRE превращается в **операторов**.

---

## В mock-exams: toil → fix

| Toil | Устранение |
|------|------------|
| Ручной `kubectl scale` | [HPA](../kuber-intermediate/17-hpa.md) |
| Ручной restart после OOM | requests/limits, probes [kuber-basic](../kuber-basic/README.md) |
| Ручной bump image | [gitops](../gitops-basic/README.md) + CI |
| Ручной terraform apply | [aws-terraform](../aws-terraform/README.md) pipeline |

---

## Заметки для собеседования

- Определение toil (5 свойств).
- Пример toil vs engineering work.
- Почему 50% rule?
- Как приоритизировать automation backlog?

---

## Резюме и чек-лист

Toil — **налог на плохую архитектуру**. SRE измеряет, режет, автоматизирует. 50% rule — не догма, а **сигнал**: если 80% toil — вы не SRE, вы NOC без процесса.

- [ ] Назовите 3 toil задачи вашей недели.
- [ ] Какая одна уйдёт через automation за месяц?
- [ ] Что можно убрать, а не автоматизировать?

**Дальше:** [06. Наблюдаемость для SRE](06-observability-for-sre.md).
