# Site Reliability Engineering (SRE)

Теоретический курс по **Site Reliability Engineering**: надёжность как инженерная дисциплина, **SLI/SLO/error budget**, инциденты, on-call, ёмкость, изменения, DR и организация SRE-команд. Без обязательных лаб — только развёрнутые главы в формате «книги» на русском.

**Для кого:** DevOps / backend / platform engineer, переходящие в SRE; тимлиды, которым нужен общий язык с reliability; инженеры после [`kuber-intermediate`](../kuber-intermediate/README.md) и [`observability-basic`](../observability-basic/README.md), готовые связать практику мониторинга с **управлением риском**.

**Предварительно (желательно):**

| Курс | Зачем |
|------|--------|
| [linux-intermediate](../linux-intermediate/README.md) | хост, сеть, нагрузка |
| [observability-basic](../observability-basic/README.md) | метрики, PromQL, алерты |
| [observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md) | краткий ввод SLI/SLO (здесь — глубже) |
| [kuber-basic](../kuber-basic/README.md) | отказ Pod/Node, probes |
| [gitops-basic](../gitops-basic/README.md) | изменения через Git |

**Практика в других курсах:** стенды [`deploy/observability`](../../deploy/observability/README.md), [`mockctl`](../mockctl/README.md), runbook-лабы в [observability-advanced](../observability-advanced/README.md).

## Как читать

- Каждая глава — **30–60 минут** чтения; с конспектом и таблицами — до **90 минут**.
- Делайте **конспект** по шаблону в конце главы: «определение → пример из работы → антипаттерн».
- Связи с курсами репозитория помечены блоком **«В mock-exams»** — не обязательны для понимания SRE в целом.

**Время:** ~**25–35 часов** на весь курс; [финальная глава](16-synthesis-practice.md) — оформление SLO-документа для вымышленного или реального сервиса (**2–4 часа**).

## Программа

### Часть I — Дисциплина и модели (01–04)

| № | Глава |
|---|--------|
| 01 | [Что такое SRE: история, роль, границы](01-what-is-sre.md) |
| 02 | [Надёжность, риск и отказы](02-reliability-and-risk.md) |
| 03 | [SLI, SLO, SLA: измерение и договорённости](03-sli-slo-sla.md) |
| 04 | [Error budget: политика и trade-offs](04-error-budgets.md) |

### Часть II — Операционная работа (05–09)

| № | Глава |
|---|--------|
| 05 | [Toil, автоматизация и пределы скриптов](05-toil-automation.md) |
| 06 | [Наблюдаемость для SRE](06-observability-for-sre.md) |
| 07 | [Алертинг и on-call](07-alerting-on-call.md) |
| 08 | [Инцидент-менеджмент](08-incident-management.md) |
| 09 | [Postmortem без обвинений](09-postmortems.md) |

### Часть III — Ёмкость, изменения, катастрофы (10–12)

| № | Глава |
|---|--------|
| 10 | [Ёмкость, производительность, стоимость](10-capacity-performance.md) |
| 11 | [Изменения как главный риск](11-change-and-release.md) |
| 12 | [DR, RTO/RPO и учения](12-disaster-recovery.md) |

### Часть IV — Организация и карьера (13–16)

| № | Глава |
|---|--------|
| 13 | [Как встроить SRE в компанию](13-organizing-sre.md) |
| 14 | [Production readiness и launch](14-production-readiness.md) |
| 15 | [Экономика надёжности](15-economics-of-reliability.md) |
| 16 | [Синтез: практика, собеседования, чек-лист](16-synthesis-practice.md) |

## Что должно получиться

- Формулируете **SLI/SLO** для пользовательского пути, а не «CPU < 80%».
- Объясняете **error budget** руководству и команде разработки.
- Проводите (или участвуете в) **инциденте** с ролями IC / comms / scribe.
- Пишете **postmortem** с action items и без blame.
- Связываете **релизы**, **ёмкость** и **DR** с измеримым риском.
- Отличаете SRE от «ночного дежурного админа» и от «чистого DevOps без SLO».

## Литература (вне курса)

- Google — *Site Reliability Engineering* (бесплатно онлайн).
- Google — *The Site Reliability Workbook*.
- Beyer et al. — *Implementing Service Level Objectives*.
- Ни один учебник не заменяет **документ SLO вашего сервиса** — финал курса как раз про это.
