# 11. FinOps в процессе: ритуалы и культура

## Введение

Инструменты без **ритуала** дают dashboard, который никто не открывает. FinOps зреет через **регулярные** cost reviews и **встроенные** gates в engineering flow.

---

## Cadence

| Ритм | Участники | Артефакт |
|------|-----------|---------|
| Weekly (15 min) | platform + leads | top anomalies, leaks |
| Monthly (60 min) | eng + finance + product | cost review deck |
| Quarterly | leadership | commit strategy, unit cost trends |
| Per launch | PRR | cost estimate ([sre/14](../sre/14-production-readiness.md)) |

---

## Monthly cost review agenda

1. **Total vs budget** — forecast month-end.
2. **Top 5 services** — delta vs last month.
3. **Top 3 tag owners** — who grew?
4. **Rightsizing actions** — owner + ETA.
5. **Commit utilization** — SP/RI coverage.
6. **Wins** — что уже сэкономили (мораль важна).

---

## Engineering integration

| Gate | Пример |
|------|--------|
| Terraform PR | `Infracost` / cost diff comment |
| New service template | default tags + budgets |
| CI destroy | ephemeral env TTL 24h |
| On-call | «cost anomaly» runbook |

**Не** блокировать каждый PR из‑за $5 — фокус на **>$X/month** или **>% growth**.

---

## Gamification (осторожно)

- Dashboard «team of the month» по **savings** — риск скрывать spend.
- Лучше: **% allocated tags**, **reduction idle resources**.

---

## Blameless cost postmortem

Аналог incident PM: «NAT оставили после лабы» → action: **cleanup checklist в MR template**, не «наказать стажёра».

---

## Maturity levels (упрощённо)

| Level | Признаки |
|-------|----------|
| Crawl | Explorer иногда, нет тегов |
| Walk | tags, budgets, monthly review |
| Run | unit cost, Kubecost, SP, Infracost in CI |
| Fly | chargeback, anomaly automation, product trade-offs |

---

## Резюме

FinOps — **привычка**, не проект Q4. Weekly anomalies + monthly review + PRR cost = устойчивый Operate phase.

---

## Чек-лист

- [ ] Есть ли monthly cost meeting в календаре?
- [ ] Кто owner cleanup учебных ресурсов?
- [ ] Один недавний leak — какой process gap?

**Дальше:** [12. Observability cost](12-observability-platform-cost.md).
