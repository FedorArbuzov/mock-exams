# 13. Как встроить SRE в компанию

> **Организация шире SRE:** DORA, Team Topologies, Conway — [`devops-culture`](../devops-culture/README.md).

## Введение: «наняли двух SRE — они тушат тикеты»

Компания объявила «делаем SRE», наняла инженеров с Kubernetes, но **нет SLO**, postmortem — «по желанию», on-call — **те же** dev без компенсации. Через год выгорание, текучка, заявление «SRE не работает». Проблема не в **названии роли**, а в **модели**: куда садится функция, какие **полномочия**, как **измеряется** успех.

---

## Модели организации

| Модель | Описание | Плюс | Минус |
|--------|----------|------|-------|
| **Centralized SRE** | одна команда на многие сервисы | стандарты, экспертиза | bottleneck, «чужие» сервисы |
| **Embedded** | SRE внутри product squad | ownership | разнобой практик |
| **Hybrid** | platform SRE + embedded liaison | баланс | сложность матрицы |
| **Consulting** | SRE ревьюит, не дежурит | масштаб советов | нет 24/7 глубины |

Google: **production engineering** смешанно; стартап — **нет** отдельной команды, **есть** 2 SLO.

---

## Размер и соотношение

Ориентиры (не догма):

- **~1 SRE на 5–10** critical services или **1:10** dev для зрелых систем;
- меньше, если **platform** сильно автоматизировала toil.

Важнее **scope**: «SRE владеет **платформой** observability + **консультирует** product SLO».

---

## Полномочия SRE

| Нужно | Зачем |
|-------|-------|
| Veto релиза при **0 budget** | иначе SLO бессмысленны |
| Приоритет reliability backlog | иначе toil ∞ |
| Доступ к prod (audit) | расследование |
| Участие в architecture review | shift-left |

Без полномочий SRE = **NOC++**.

---

## Найм и грейды

| Skill | Junior SRE | Senior SRE |
|-------|------------|------------|
| K8s/network | база | глубоко |
| Coding | скрипты | production automation |
| SLO/инциденты | участие | ведение процесса |
| Comms | scribe | IC |

**Не только** «знает Prometheus» — **системное мышление** и **коммуникация**.

---

## On-call модель по организации

| Модель | Когда |
|--------|-------|
| Dev team on-call | you build it you run it |
| SRE primary | immature app, heavy ops |
| Follow-the-sun | global product |

Компенсация, лимит смен — **HR policy**, не «добровольно».

---

## Метрики зрелости SRE-функции

| Уровень | Признаки |
|---------|----------|
| 0 | нет SLO, hero culture |
| 1 | SLO на 1–2 сервиса, postmortem иногда |
| 2 | budget policy, burn alerts, quarterly drill |
| 3 | self-service platform, low toil, Game Days |

**Не гонитесь** за уровнем 3 в первый год.

---

## Отношения с Platform и Security

```text
Platform ──► paved road, IDP
SRE      ──► SLO, incidents, capacity, review
Security ──► policy, audit, compliance
```

Конфликт: Security блокирует deploy; SRE помогает **automate compliance** ([secrets-*](../secrets-basic/README.md), policy in CI).

---

## Внедрение с нуля (12 месяцев)

| Квартал | Фокус |
|---------|-------|
| Q1 | 1 CUJ, SLO doc, incident channel |
| Q2 | burn alerts, postmortem template |
| Q3 | error budget policy, top toil kill |
| Q4 | DR tabletop, PRR для launch |

---

## Чек-лист

- [ ] Какая модель (central/embedded)?
- [ ] Есть ли veto/freeze при budget?
- [ ] On-call компенсация?
- [ ] Кто owner SLO doc?

**Дальше:** [14. Production readiness](14-production-readiness.md).
