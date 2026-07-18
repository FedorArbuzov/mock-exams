# 14. Лаба: отчёт и rightsizing plan

## Цель

Собрать **monthly cost review** артефакт: таблица spend, rightsizing recommendations, action items. Время: **90–120 минут**.

---

## Вариант A — real AWS dev account (рекомендуется)

### Шаг 1. Cost Explorer

Console → **Cost Explorer** → Last 7/30 days → Group by **Service**.

Запишите топ-5:

| Service | $ | % total | Примечание |
|---------|---|---------|------------|
| Amazon EC2 | | | |
| Amazon VPC (NAT) | | | |
| Amazon EKS | | | |
| … | | | |

### Шаг 2. Group by tag

Filter `Environment=dev` (или ваш tag) → Group by **Team** / **Service**.

Найдите **Unlabeled** / missing tags — % от total.

### Шаг 3. Rightsizing

**Compute Optimizer** или Cost Explorer → Recommendations:

| Resource ID | Current | Recommended | Est. savings/mo |
|-------------|---------|-------------|-----------------|
| i-xxx | m5.xlarge | m5.large | $ |

Если нет рекомендаций — вручную: instance с CPU < 20% p95.

### Шаг 4. Kubernetes (если есть EKS)

Установите [Kubecost](07-kubecost.md) или OpenCost → Allocation by namespace → top 3.

### Шаг 5. NAT / transfer

Отдельная строка: **NAT Gateway** hours + **Data Transfer** — из CUR или Explorer drill-down.

---

## Вариант B — учебный шаблон (без AWS)

Заполните таблицу **гипотетически** для архитектуры [image-platform](../aws-intermediate/projects/image-platform/):

| Компонент | Оценка $/mo | Оптимизация |
|-----------|-------------|-------------|
| NAT GW 2 AZ | ~$70+ | 1 NAT dev, endpoints |
| EKS control plane | ~$73 | destroy после lab |
| 3× m5.large nodes | ~$280 | Spot dev, smaller type |
| RDS db.t3.medium | ~$50 | stop nights |
| ALB | ~$20 | shared ALB |
| S3 + transfer | ~$5 | lifecycle |

---

## Deliverable: one-page Cost Review

```markdown
# Cost Review — YYYY-MM

## Summary
- Total: $X (budget $Y, forecast $Z)
- Biggest delta: NAT +$40 (new EKS lab)

## Actions
| # | Action | Owner | Savings est. | Due |
|---|--------|-------|--------------|-----|
| 1 | Destroy EKS lab cluster | me | $400/mo | Fri |
| 2 | S3 lifecycle on logs bucket | platform | $10/mo | next sprint |
| 3 | Rightsize RDS dev | DBA | $25/mo | Wed |

## Unit cost (if applicable)
- $ / 1000 API requests = $0.0X (assumption: N requests)
```

---

## Критерии успеха

- [ ] Топ-5 services с цифрами или обоснованными оценками
- [ ] Минимум 3 action items с owner и ETA
- [ ] Упомянуты NAT и tags/unallocated
- [ ] (A) Screenshot Explorer или (B) ссылка на архитектуру

---

## Cleanup checklist

После EKS/VPC лаб:

- [ ] `terraform destroy` / `eksctl delete cluster`
- [ ] Orphan EBS volumes
- [ ] Elastic IPs unattached
- [ ] Old snapshots > 30d (dev)

**Дальше:** [15. Синтез](15-synthesis.md).
