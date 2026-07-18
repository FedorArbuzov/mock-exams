# 08. S3, EBS, NAT и data transfer

## Введение

«Скрытые» расходы AWS — **трафик** и **NAT**. После лаб VPC/EKS bill часто растёт из‑за **GB через NAT**, а не из‑за vCPU.

Связь: [networking-deep/06-nat](../networking-deep/06-nat.md), [aws-intermediate VPC](../aws-intermediate/01-vpc-custom.md).

---

## NAT Gateway

| Статья | Модель |
|--------|--------|
| Hourly | ~$0.045/час/AZ (регион зависит) |
| Data processing | $/GB processed |

**Два NAT в двух AZ** для HA — **2× hourly** даже ночью.

Митигация:

- **VPC Gateway Endpoint** S3/DynamoDB — **без NAT** для этого трафика
- **Interface endpoints** для ECR, STS — меньше egress (плата за endpoint ENI)
- **NAT instance** (self-managed) — дешевле, больше ops (редко в prod)
- **Удалить NAT** в dev когда не нужен

---

## Data transfer

| Тип | Типичная цена (логика) |
|-----|------------------------|
| In to internet | often free |
| Out to internet | $/GB tiered |
| Cross-AZ same region | $/GB both directions |
| Cross-region | $/GB + репликация |
| To CloudFront origin | может оптимизировать |

**Anti-pattern:** microservices chatty cross-AZ без need.

---

## S3

| Рычаг | Эффект |
|-------|--------|
| Storage class | Standard → IA → Glacier |
| Lifecycle rules | auto transition/delete |
| Incomplete MPU | abort multipart uploads |
| Request pricing | LIST в loop, миллион мелких objects |
| Replication CRR | storage + transfer ([aws-advanced/24](../aws-advanced/24-lab-s3-crr.md)) |

---

## EBS

- **gp3** default — дешевле io1 при том же IOPS если настроить.
- **Snapshots** — incremental, но копятся; lifecycle policy.
- **Orphan volumes** — после удаления instance, Cost Explorer → EBS.

---

## CloudFront (кратко)

Кэш снижает **origin egress** и улучшает UX — cost может **снизиться** при высоком public traffic.

---

## В mock-exams

В [14-lab-cost-report](14-lab-cost-report.md) — отдельная строка **NAT + DataTransfer**. Image pipeline S3: [aws-terraform image-pipeline](../aws-terraform/projects/image-pipeline/README.md).

---

## Резюме

Оптимизация сети FinOps — **архитектура**: endpoints, AZ placement, NAT count. S3/EBS — lifecycle и orphan hunting.

---

## Чек-лист

- [ ] S3 endpoint на private route table?
- [ ] Сколько NAT GW в account и зачем каждый?
- [ ] Есть lifecycle на buckets с логами?

**Дальше:** [09. Savings Plans и Spot](09-commitments.md).
