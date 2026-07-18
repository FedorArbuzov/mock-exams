# 12. Стоимость observability и платформы

## Введение

Prometheus + Loki + Jaeger + CloudWatch Logs — **не бесплатны** при росте cardinality и retention. FinOps observability — баланс **debuggability** vs **$**.

Связь: [observability-advanced/05-cardinality-cost](../observability-advanced/05-cardinality-cost.md).

---

## Метрики (Prometheus / AMP / CloudWatch)

| Драйвер cost | Рычаг |
|--------------|--------|
| High cardinality labels | `user_id`, `trace_id` в labels — **нет** |
| Scrape interval 5s | 15–60s для non-critical |
| Long retention | recording rules + downsample |
| Remote write $ | sample filtering |

**Recording rules** — pre-aggregate для dashboards ([observability-intermediate/01](../observability-intermediate/01-recording-rules.md)).

---

## Логи

| Драйвер | Рычаг |
|---------|--------|
| Verbose debug в prod | level INFO/WARN |
| Full body logging | sampling |
| CloudWatch Logs ingest $/GB | retention 7–30d |
| Loki | label cardinality как Prometheus |
| Cross-region shipping | локальный ingest |

---

## Traces

- Head-based sampling 1–10% для high RPS.
- Tail-based sampling (дороже infra, меньше waste) — для critical paths.
- Retention traces << logs.

---

## Platform shared cost

GitLab runners, Argo CD, ingress controllers — **shared services**:

- allocate по % workloads или `team` label
- include in **platform unit cost** ($/developer/month)

---

## Reliability vs cost (связь SRE)

| Дешевле | Дороже, но нужно |
|---------|------------------|
| Меньше retention | Compliance 1y audit |
| Меньше алертов | Burn rate SLO pages |
| Self-hosted Prometheus | Managed AMP ops time |

[sre/15](../sre/15-economics-of-reliability.md) — не cut monitoring первым при budget pressure без risk assessment.

---

## В mock-exams

[deploy/observability](../../deploy/observability/README.md) — оцените disk growth при `traffic.sh` 24h. Kubecost + Prometheus stack на mockctl — double resource accounting.

---

## Резюме

Observability FinOps = **cardinality discipline**, retention tiers, sampling. Platform tools — явная строка в showback.

---

## Чек-лист

- [ ] Запрещены high-cardinality labels в style guide?
- [ ] Retention по типу данных различается?
- [ ] Shared monitoring cost allocated?

**Дальше:** [13. Лаба budgets/tags](13-lab-budgets-tags.md).
