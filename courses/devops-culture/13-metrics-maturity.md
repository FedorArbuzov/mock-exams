# 13. Метрики зрелости без vanity

## Введение

«Мы измеряем 40 KPI» — и ни один не влияет на решение. Зрелость — **мало** метрик, **связанных** с DORA и SLO, встроенных в **ритуалы**.

---

## Два слоя метрик

| Слой | Примеры | Аудитория |
|------|---------|-----------|
| **Delivery (DORA)** | frequency, lead time, CFR, MTTR | engineering leadership |
| **Reliability (SRE)** | SLI, error budget burn | product + SRE |
| **Business** | conversion, revenue | product (не platform) |

Не смешивайте **CPU** с **delivery**.

---

## SPACE (дополнение к DORA)

GitHub / Nicole Forsgren: **S**atisfaction, **P**erformance, **A**ctivity, **C**ommunication, **E**fficiency — для **благополучия** команд.

| Зачем | Пример |
|-------|--------|
| burnout раньше увольнения | survey + on-call load |
| не оптимизировать activity | «1000 commits» ≠ ценность |

DORA без SPACE → **выгорание** при «elite» frequency.

---

## Maturity models (осторожно)

CMMI-style «уровень 3» легко превращается в **бумаги**.

| Полезно | Вредно |
|---------|--------|
| checklist capabilities | сертификация ради галочки |
| self-assessment квартал | сравнение команд публично как рейтинг |

Используйте как **направление**, не **рейтинг людей**.

---

## Ритуалы, где метрики живут

| Ритуал | Метрики |
|--------|---------|
| Weekly team | WIP, blocked MR, incidents |
| Monthly eng review | DORA trends, top failures |
| Quarterly | topology review, platform adoption |
| Post-incident | MTTR fact, action closure rate |

[finops/11](../finops/11-process-culture.md) — аналог для cost.

---

## Связь с observability

| Vanity | Actionable |
|--------|------------|
| dashboard 200 панелей | SLO burn alert |
| «все метрики в Prometheus» | RED на critical path |
| log everything forever | sampled errors + trace |

[observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md).

---

## Резюме

Измеряйте **мало и честно**. DORA + SLO + периодический SPACE — достаточно для большинства org 50–500 инженеров.

---

## Чек-лист

- [ ] Сколько KPI реально смотрят на monthly review?
- [ ] Есть ли SLI не привязанный к user path?
- [ ] Activity metrics наказывают за отпуск?

**Дальше:** [14. Синтез](14-synthesis.md).
