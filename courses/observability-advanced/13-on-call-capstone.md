# 13. On-call capstone: observability platform end-to-end

## Цель проекта (4–6 часов)

Собрать **документированный** артефакт для портфолио и интервью: traces на Docker-стенде, k8s metrics (опционально), runbooks, design doc, mock interview notes — как единая **observability story**.

## Предварительно

Пройдены главы **01–12** или эквивалент intermediate + этот README.

Стенды:

```bash
# Docker (обязательно)
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d --build

# K8s (опционально)
mockctl up
# helm install kube-prom ... см. 03-kube-prometheus.md
```

---

## Часть A — Traces (60 мин)

1. Отправьте trace через OTLP ([02-lab-jaeger](02-lab-jaeger.md)) — скрин Jaeger **16686**.
2. Добавьте в runbook поле «Trace search»: service, min duration.
3. Объясните в 5 предложениях propagation через 3 сервиса (tabletop).

**Deliverable:** скрин + абзац в `capstone-notes.md`.

---

## Часть B — Metrics & cardinality (60 мин)

1. Зафиксируйте `prometheus_tsdb_head_series` до/после traffic ([06-lab-cardinality](06-lab-cardinality.md)).
2. PromQL dashboard (3 панели): error ratio, p99 latency, `up`.
3. Напишите **cardinality policy** (10 строк): allowed/forbidden labels.

**Deliverable:** раздел `## Metrics` в `capstone-notes.md`.

---

## Часть C — Kubernetes (90 мин, опционально)

Если есть кластер:

1. Install kube-prometheus-stack ([04-lab-servicemonitor](04-lab-servicemonitor.md)).
2. OOM drill или скрин `kube_pod_container_status_restarts_total`.
3. ServiceMonitor YAML (даже если target DOWN — объясните почему).

**Deliverable:** `k8s-screenshots/` или описание в notes.

---

## Часть D — Runbooks (60 мин)

Два runbook на базе [`examples/runbook-template.md`](examples/runbook-template.md):

1. **High latency p99** — ветка Redis ([redis-advanced/09](../redis-advanced/09-troubleshooting.md)).
2. **Target down** — `up{job="demo-app"}==0`.

**Deliverable:** `runbook-latency.md`, `runbook-target-down.md`.

---

## Часть E — AWS tabletop (30 мин)

Без AWS аккаунта — письменно:

1. Как бы связали Prometheus alerts и CloudWatch alarms для Lambda worker? ([19](../aws-intermediate/19-cloudwatch.md), [20](../aws-intermediate/20-lab-cloudwatch.md))
2. Metric filter vs native `Errors` metric — когда что?

**Deliverable:** раздел `## AWS hybrid` в notes.

---

## Часть F — System design (60 мин)

Оформите [12-lab-system-design](12-lab-system-design.md) для **вашего** домена (выберите промпт A/B/C).

**Deliverable:** `my-observability-design.md` (≥9/12 rubric).

---

## Часть G — Mock interview (45 мин)

Пройдите [10-lab-mock-interview](10-lab-mock-interview.md). Запишите score rapid-fire /8.

**Deliverable:** `## Mock interview` в notes.

---

## Итоговый чеклист

| Артефакт | Готово |
|----------|--------|
| `capstone-notes.md` | ☐ |
| Jaeger trace скрин | ☐ |
| 2 runbooks | ☐ |
| Design doc | ☐ |
| Cardinality policy | ☐ |
| (Опц.) k8s ServiceMonitor | ☐ |
| Mock interview score | ☐ |

---

## Самопроверка перед собеседованием

- [ ] Объясняю три столпа без паузы
- [ ] Рисую OTel pipeline на доске
- [ ] Называю 3 PromQL для RED
- [ ] Объясняю cardinality на примере `user_id`
- [ ] Связываю trace → Redis SLOWLOG
- [ ] Сравниваю Alertmanager vs CloudWatch alarm
- [ ] [`interview-cheatsheet.md`](interview-cheatsheet.md) — закрыта глазами

---

## Уборка

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml down -v
helm uninstall kube-prom -n monitoring  # если ставили
```

Поздравляем — observability-advanced capstone завершён.
