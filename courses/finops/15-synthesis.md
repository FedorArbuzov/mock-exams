# 15. Синтез: cost review и чек-лист

## Практическое задание

Проведите **первый официальный** FinOps review для:

- real dev account, или
- вымышленной платформы mock-exams (image-platform + mockctl + GitLab).

### Deliverables (2–3 часа)

1. **Tag standard** (1 страница): обязательные keys, enum, пример Terraform `default_tags`.
2. **Budget policy**: лимит $/month, FORECASTED 80% + 100% ACTUAL, кто получает email.
3. **Showback table** по 3 командам/namespace (даже если цифры оценочные).
4. **Rightsizing backlog** — 5 items с priority (P0 leak vs P2 nice).
5. **K8s allocation** — скрин Kubecost/OpenCost или таблица namespace $.
6. **Quarterly commit recommendation** — покупать SP или нет, 5 предложений.

---

## Карта курса

```text
01–02   FinOps + unit economics     →  «зачем и как мерить ценность»
03–04   Tags + AWS tools            →  «видимость»
05–08   Rightsizing + K8s + Kubecost + network  →  «где деньги»
09–10   Commit + governance         →  «guardrails»
11–12   Process + observability cost →  «удержание»
13–15   Labs + synthesis            →  «ваш review»
```

---

## Вопросы с собеседований

### 1. Showback vs chargeback?

Showback — отчёт без реального списания; chargeback — P&L impact. Showback проще стартовать.

### 2. FORECASTED budget alert?

Срабатывает когда **прогноз** месяца превысит порог — раньше, чем счёт закрыт.

### 3. Почему NAT дорогой?

Hourly per-AZ + $/GB processed; HA = 2× hourly; dev часто оставляют 24/7.

### 4. CUR vs Cost Explorer?

Explorer — быстрые агрегаты; CUR — построчный usage для Athena/Kubecost/forensics.

### 5. Kubecost без AWS integration?

Да — allocation по CPU/RAM requests/usage внутри кластера; cloud costs требуют billing hook.

### 6. Когда Savings Plan?

Стабильный baseline 30–60 days, после rightsizing, не для volatile dev.

### 7. FinOps vs «выключить dev ночью»?

FinOps системный: tags, budgets, process; stop instances — одна тактика.

---

## Maturity checklist

- [ ] Tags activated в Cost allocation
- [ ] Budget FORECASTED на каждый non-prod account
- [ ] Monthly cost review в календаре
- [ ] Kubecost/OpenCost на prod-like кластере
- [ ] NAT/endpoints осознанно в архитектуре
- [ ] Cleanup checklist после aws-advanced лаб
- [ ] Unit cost для главного продукта известен PM

---

## В mock-exams — дальше

| Цель | Курс |
|------|------|
| Enterprise + cost gate | [aws-advanced/27](../aws-advanced/27-final-project.md) |
| Reliability economics | [sre/15](../sre/15-economics-of-reliability.md) |
| Network cost | [finops/08](08-storage-network-cost.md), [networking-deep/06](../networking-deep/06-nat.md) |
| Cardinality | [observability-advanced/05](../observability-advanced/05-cardinality-cost.md) |

---

## Резюме

FinOps курс завершён, когда у вас есть **живой** cost review document и **3 закрытых** action items — не когда прочитаны все главы.
