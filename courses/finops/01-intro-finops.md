# 01. FinOps: роли, цикл Inform → Optimize → Operate

## Введение: счёт пришёл — кого винить?

В конце месяца CFO видит **+$40k** к AWS. DevOps говорит «это EKS», разработка — «мы не меняли код», finance — «кто одобрил NAT?». Без **FinOps** разговор превращается в охоту на виноватых. С **FinOps** — в **измеримый цикл**: видимость → оптимизация → эксплуатация с ответственностью команд.

---

## Что такое FinOps

**FinOps** (Financial Operations) — практика совместного управления **облачными затратами** между **engineering**, **finance** и **product**. Не «экономить любой ценой», а **максимизировать ценность** каждого доллара при скорости delivery.

Три движущие силы (FinOps Foundation):

| Принцип | Смысл |
|---------|--------|
| **Teams need to collaborate** | cost — не только у FinOps |
| **Everyone takes ownership** | команды видят **свой** bill |
| **Reports should be accessible** | прозрачность в реальном времени |
| **Decisions are driven by business** | unit economics, не «убить NAT» |

---

## Цикл FinOps

```text
Inform    →  Optimize  →  Operate
(видеть)     (улучшать)    (удерживать)
     ↑___________________________|
```

| Фаза | Вопрос | Артефакты |
|------|--------|-----------|
| **Inform** | Кто сколько тратит и на что? | tags, dashboards, CUR |
| **Optimize** | Где waste и commit? | rightsizing, SP, Spot |
| **Operate** | Как не откатиться? | budgets, policies, reviews |

---

## Роли

| Роль | Фокус |
|------|--------|
| **FinOps practitioner** | процесс, tooling, отчёты |
| **Engineering** | архитектура, autoscaling, labels |
| **Finance / FP&A** | forecast, chargeback, commit planning |
| **Product** | trade-off features vs cost |
| **Leadership** | guardrails, не микроменеджмент каждого instance |

В маленькой команде один **platform engineer** совмещает 3 роли — процесс всё равно нужен.

---

## FinOps vs SRE error budget

| | SRE error budget | FinOps budget |
|---|------------------|---------------|
| Ресурс | **допустимый downtime** | **допустимый spend** |
| Метрика | SLI/SLO | $ / unit (request, user) |
| Действие при исчерпании | freeze релизов | review, optimize, cap env |

Связь: [sre/15-economics-of-reliability](../sre/15-economics-of-reliability.md) — «ещё одна девятка» стоит денег; FinOps — **обратная сторона** той же сделки.

---

## Типичные антипаттерны

| Антипаттерн | Почему плохо |
|--------------|--------------|
| Cost cutting без метрик | ломают prod ради -10% |
| Central FinOps без dev buy-in | теги игнорируют |
| Только monthly review | leak накапливается 30 дней |
| Blame game по account | прячут ресурсы в другой account |

---

## В mock-exams

| Тема | Курс |
|------|------|
| Краткий AWS cost | [aws-advanced/25](../aws-advanced/25-cost-optimization.md) |
| NAT/VPC cost drivers | [networking-deep/06](../networking-deep/06-nat.md), [finops/08](08-storage-network-cost.md) |
| Cardinality cost | [observability-advanced/05](../observability-advanced/05-cardinality-cost.md) |

---

## Резюме

FinOps — **дисциплина и процесс**, не один инструмент. Engineering владеет **80% рычагов** (размер, архитектура, tags); finance — **forecast и commit**; вместе — устойчивый cloud spend.

---

## Чек-лист

- [ ] Назовите три фазы FinOps.
- [ ] Чем cloud cost budget отличается от SRE error budget?
- [ ] Кто в вашей организации «владеет» тегами?

**Дальше:** [02. Unit economics](02-unit-economics.md).
