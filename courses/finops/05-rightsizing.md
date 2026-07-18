# 05. Rightsizing: EC2, RDS, Lambda

## Введение

**Rightsizing** — подобрать тип/размер ресурса под **фактическую** нагрузку с запасом на пики, без «m5.4xlarge на всякий случай». Источники данных: CloudWatch, Cost Explorer recommendations, **Kubecost** для K8s ([07](07-kubecost.md)).

---

## EC2

| Сигнал | Действие |
|--------|----------|
| CPU < 20% p95 неделю | downgrade instance family/size |
| CPU credit exhaustion (T-class) | Unlimited или fixed size |
| Memory pressure | больше RAM, не больше CPU |
| Network saturated | enhanced networking, bigger instance |

**Шаги безопасного resize:**

1. Снимок / backup.
2. Stop → change type → start (или launch new + ASG refresh).
3. Проверить **burst credits**, **ENA**, **license** (Windows).

**Graviton (ARM):** до ~20% cheaper при совместимом образе — тест на stage.

---

## RDS

| Параметр | Rightsizing |
|----------|-------------|
| Instance class | CPU/Memory по Performance Insights |
| Storage | gp3 IOPS/throughput vs overprovisioned io1 |
| Multi-AZ | prod да, dev нет |
| Aurora Serverless v2 | переменная нагрузка |

**Dev leak:** `db.r6g.xlarge` «как в проде» 24/7 — отдельный маленький instance + auto stop.

---

## Lambda

Платите за **requests + GB-second**:

| Рычаг | Эффект |
|-------|--------|
| Memory | больше CPU, меньше duration — **оптимум не всегда 128MB** |
| Provisioned concurrency | стоимость ↑, cold start ↓ |
| Architecture ARM | дешевле |
| VPC attach | +ENI cost/complexity — только если нужно |

Power tuning: AWS Lambda Power Tuning (open source) — график cost vs memory.

---

## Автоматизация

- **AWS Compute Optimizer** — рекомендации (включить в account).
- **Instance Scheduler** — stop dev nights/weekends.
- **ASG** с mixed instances + Spot ([09](09-commitments.md)).

---

## В mock-exams

Отчёт rightsizing — [14-lab-cost-report](14-lab-cost-report.md). После [aws-advanced/14 EKS lab](../aws-advanced/14-lab-eks.md) — проверьте node group size.

---

## Резюме

Rightsizing — **не разовый audit**, а квартальный ритуал. EC2/RDS — по метрикам; Lambda — по duration/memory curve.

---

## Чек-лист

- [ ] Отличилие underutilized CPU от «нужен запас на Black Friday»?
- [ ] Dev RDS отделён от prod по размеру?
- [ ] Lambda memory протестирована, не 128MB по умолчанию?

**Дальше:** [06. EKS и Kubernetes cost](06-kubernetes-cost.md).
