# 01. От DevOps к engineering culture

## Введение

«Мы внедрили Jenkins» — и через год релизы всё еще раз в месяц, потому что **культура** не изменилась: те же согласования, те же «окна», тот же страх prod. **DevOps** с самого начала был про **культуру и организацию**, а не про инструмент с логотипом.

---

## История в одном абзаце

2009 — **DevOps Days**: Patrick Debois, идея **сотрудничества** dev и ops.  
2010-е — **«The Phoenix Project»**, **«The DevOps Handbook»** (Gene Kim и др.): поток работы, обратная связь, эксперименты.  
2010-е — **DORA** (DevOps Research and Assessment): **измеримые** корреляции практик и результатов.  
2020-е — **Team Topologies** (Skelton & Pais): **структура команд** как рычаг доставки.  
Параллельно — **SRE** (Google): надёжность как инженерная дисциплина с SLO.

---

## Три идеи DevOps (Handbook)

| Идея | На практике |
|------|-------------|
| **Flow** | малые партии, WIP limits, CI |
| **Feedback** | мониторинг, инциденты, пользователь |
| **Continual learning** | postmortem, blameless, эксперименты |

Инструменты **поддерживают** flow; без изменения процесса CI превращается в «очередь в Jenkins».

---

## «DevOps engineer» как роль

Спорный термин. В зрелых компаниях:

- **нет** отдельного «отдела DevOps», который «деплоит за всех»;
- **есть** platform team + product teams с **самообслуживанием**;
- **есть** общие практики: Git, MR, pipeline, observability.

Курс [gitlab-basic](../gitlab-basic/README.md) учит **механику**; этот курс — **зачем** она нужна организации.

---

## Культура vs декларация

| Декларация | Реальная культура (сигналы) |
|------------|----------------------------|
| «Мы agile» | релиз по пятницам запрещён |
| «Blameless» | postmortem ищет виновного |
| «You build it» | dev не имеет доступа к логам |
| «Platform» | тикеты 2 недели в очереди |

Измерять культуру сложно; **прокси** — DORA ([глава 03](03-dora-metrics.md)) и **время от идеи до prod**.

---

## В mock-exams

| Практика flow | Курс |
|---------------|------|
| Git + MR | [gitlab-basic](../gitlab-basic/README.md) |
| Deploy на mockctl | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| GitOps | [gitops-basic](../gitops-basic/README.md) |
| SLO и инциденты | [sre](../sre/README.md) |

---

## Резюме

DevOps culture — **как организация доставляет изменения**. Инструменты без Conway + Team Topologies + метрик — декорация.

---

## Чек-лист

- [ ] Назовите три идеи из DevOps Handbook.
- [ ] Приведите один сигнал «плохой культуры» из вашей практики.
- [ ] Чем культура отличается от «купили GitLab»?

**Дальше:** [02. DevOps, SRE, Platform](02-devops-sre-platform.md).
